import { useEffect, useMemo, useState } from 'react';
import { defaultRewriteTemplate } from '../../lib/defaults';
import { captureGroup, restoreSnapshot } from '../../lib/snapshot';
import { loadSettings, onSettingsChanged, saveSettings } from '../../lib/storage';
import { DEFAULT_SETTINGS, Rule, Settings, Snapshot } from '../../lib/types';
import { RuleEditor } from './RuleEditor';
import { SnapshotEditor } from './SnapshotEditor';

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [knownGroups, setKnownGroups] = useState<chrome.tabGroups.TabGroup[]>([]);
  const [currentWindowGroups, setCurrentWindowGroups] = useState<chrome.tabGroups.TabGroup[]>([]);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [pickedGroupTitle, setPickedGroupTitle] = useState<string>('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('');

  useEffect(() => {
    void loadSettings().then(setSettings);
    void chrome.tabGroups
      .query({})
      .then(setKnownGroups)
      .catch(() => {});
    void defaultRewriteTemplate().then(setDefaultTemplate);

    // Track the current window so we can save / restore against the right one.
    void chrome.windows
      .getCurrent()
      .then(async (win) => {
        if (win.id == null) return;
        setCurrentWindowId(win.id);
        const groups = await chrome.tabGroups.query({ windowId: win.id });
        setCurrentWindowGroups(groups);
      })
      .catch(() => {});

    return onSettingsChanged(setSettings);
  }, []);

  const persist = async (next: Settings) => {
    setSettings(next);
    await saveSettings(next);
    setSavedAt(Date.now());
  };

  const addRule = () => {
    const rule = makeBlankRule(knownGroups);
    void persist({ ...settings, rules: [...settings.rules, rule] });
  };

  const updateRule = (id: string, patch: Partial<Rule>) => {
    void persist({
      ...settings,
      rules: settings.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRule = (id: string) => {
    void persist({ ...settings, rules: settings.rules.filter((r) => r.id !== id) });
  };

  const moveRule = (id: string, delta: -1 | 1) => {
    const idx = settings.rules.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= settings.rules.length) return;
    const next = settings.rules.slice();
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    void persist({ ...settings, rules: next });
  };

  const captureSnapshot = async (groupTitle: string, opts: { confirmOverwrite?: boolean } = {}) => {
    if (currentWindowId == null || !groupTitle) return;
    const captured = await captureGroup(currentWindowId, groupTitle);
    if (!captured) {
      window.alert(`No tab group titled "${groupTitle}" in this window.`);
      return;
    }
    const now = Date.now();
    const existing = settings.snapshots.find((s) => s.groupTitle === captured.groupTitle);
    if (existing && opts.confirmOverwrite) {
      const ok = window.confirm(
        `A saved group "${captured.groupTitle}" already exists. Overwrite it?`,
      );
      if (!ok) return;
    }
    let nextSnapshots: Snapshot[];
    if (existing) {
      nextSnapshots = settings.snapshots.map((s) =>
        s.id === existing.id ? { ...s, urls: captured.urls, updatedAt: now } : s,
      );
    } else {
      const snapshot: Snapshot = {
        id: cryptoRandomId(),
        groupTitle: captured.groupTitle,
        urls: captured.urls,
        updatedAt: now,
      };
      nextSnapshots = [...settings.snapshots, snapshot];
    }
    await persist({ ...settings, snapshots: nextSnapshots });
  };

  const updateSnapshot = (id: string, patch: Partial<Snapshot>) => {
    void persist({
      ...settings,
      snapshots: settings.snapshots.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
      ),
    });
  };

  const removeSnapshot = (id: string) => {
    void persist({ ...settings, snapshots: settings.snapshots.filter((s) => s.id !== id) });
  };

  const onRestore = async (id: string) => {
    const snapshot = settings.snapshots.find((s) => s.id === id);
    if (!snapshot) return;
    if (currentWindowId == null) return;
    try {
      await restoreSnapshot(snapshot, currentWindowId);
    } catch (err) {
      console.error('[TabSquad] restore failed', err);
      window.alert(`Restore failed: ${(err as Error).message}`);
    }
  };

  const onRecapture = (id: string) => {
    const snapshot = settings.snapshots.find((s) => s.id === id);
    if (!snapshot) return;
    void captureSnapshot(snapshot.groupTitle);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tabsquad-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Settings>;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.rules)) {
        throw new Error('Invalid settings file');
      }
      const cleaned: Settings = {
        version: 1,
        rules: parsed.rules.map((r) => ({ ...r, id: r.id || cryptoRandomId() })) as Rule[],
        snapshots: Array.isArray(parsed.snapshots)
          ? (parsed.snapshots.map((s) => ({
              ...s,
              id: s.id || cryptoRandomId(),
              urls: Array.isArray(s.urls) ? s.urls : [],
              updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
            })) as Snapshot[])
          : [],
      };
      await persist(cleaned);
    } catch (err) {
      console.error('[TabSquad] import failed', err);
      window.alert(`Import failed: ${(err as Error).message}`);
    }
  };

  const savedLabel = useMemo(() => {
    if (savedAt == null) return '';
    return `Saved at ${new Date(savedAt).toLocaleTimeString()}`;
  }, [savedAt]);

  const groupTitleOptions = useMemo(
    () => dedupe(currentWindowGroups.map((g) => g.title ?? '').filter(Boolean)),
    [currentWindowGroups],
  );

  return (
    <div className="app">
      <h1>TabSquad</h1>
      <p className="tagline">Keep tab groups organized.</p>

      <div className="toolbar">
        <button onClick={exportJSON}>Export JSON</button>
        <label className="button-like">
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJSON(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = (e.currentTarget.previousSibling as HTMLInputElement) ?? null;
              input?.click();
            }}
          >
            Import JSON
          </button>
        </label>
        <span className="status">{savedLabel}</span>
      </div>

      <section>
        <div className="section-header">
          <h2>Routing rules</h2>
          <button className="primary" onClick={addRule}>
            + Add rule
          </button>
        </div>

        {settings.rules.length === 0 ? (
          <div className="empty">
            No rules yet. Click <strong>+ Add rule</strong> to route links from a tab group
            elsewhere.
          </div>
        ) : (
          settings.rules.map((rule, idx) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              knownGroups={knownGroups}
              defaultTemplate={defaultTemplate}
              isFirst={idx === 0}
              isLast={idx === settings.rules.length - 1}
              onChange={(patch) => updateRule(rule.id, patch)}
              onRemove={() => removeRule(rule.id)}
              onMoveUp={() => moveRule(rule.id, -1)}
              onMoveDown={() => moveRule(rule.id, 1)}
            />
          ))
        )}
      </section>

      <section>
        <div className="section-header">
          <h2>Saved groups</h2>
          <div className="save-picker">
            <select value={pickedGroupTitle} onChange={(e) => setPickedGroupTitle(e.target.value)}>
              <option value="">(pick a tab group in this window)</option>
              {groupTitleOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
            <button
              className="primary"
              disabled={!pickedGroupTitle}
              onClick={() => {
                if (pickedGroupTitle) {
                  void captureSnapshot(pickedGroupTitle, { confirmOverwrite: true });
                }
              }}
            >
              Capture
            </button>
          </div>
        </div>
        <p className="section-help">
          Capture the URLs of a tab group so you can restore it later. Manual edits to the URL list
          are kept until you press Recapture.
        </p>

        {settings.snapshots.length === 0 ? (
          <div className="empty">No saved groups yet.</div>
        ) : (
          settings.snapshots.map((s) => (
            <SnapshotEditor
              key={s.id}
              snapshot={s}
              onChange={(patch) => updateSnapshot(s.id, patch)}
              onRemove={() => removeSnapshot(s.id)}
              onRestore={() => void onRestore(s.id)}
              onRecapture={() => onRecapture(s.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function makeBlankRule(known: chrome.tabGroups.TabGroup[]): Rule {
  return {
    id: cryptoRandomId(),
    enabled: true,
    groupTitle: known[0]?.title ?? '',
    action: { kind: 'default' },
  };
}

function cryptoRandomId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `r-${Math.random().toString(36).slice(2, 10)}`;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
