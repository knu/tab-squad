import { useEffect, useMemo, useState } from 'react';
import { defaultRewriteTemplate } from '../../lib/defaults';
import { loadSettings, onSettingsChanged, saveSettings } from '../../lib/storage';
import { DEFAULT_SETTINGS, Rule, Settings } from '../../lib/types';
import { RuleEditor } from './RuleEditor';

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [knownGroups, setKnownGroups] = useState<chrome.tabGroups.TabGroup[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('');

  useEffect(() => {
    void loadSettings().then(setSettings);
    void chrome.tabGroups
      .query({})
      .then(setKnownGroups)
      .catch(() => {});
    void defaultRewriteTemplate().then(setDefaultTemplate);
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

  return (
    <div className="app">
      <h1>TabSquad</h1>
      <p className="tagline">Keep tab groups organized.</p>

      <div className="toolbar">
        <button className="primary" onClick={addRule}>
          + Add rule
        </button>
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

      {settings.rules.length === 0 ? (
        <div className="empty">
          No rules yet. Click <strong>+ Add rule</strong> to start jailing a tab group.
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
