import { DEFAULT_SETTINGS, Rule, Settings, Snapshot } from './types';

const SYNC_KEY = 'settings';
const LOCAL_KEY = 'settings';

interface SyncPayload {
  version: 1;
  syncedRules: Rule[];
  snapshots: Snapshot[];
}

interface LocalPayload {
  localRules: Rule[];
}

function syncArea(): chrome.storage.StorageArea {
  return chrome.storage.sync ?? chrome.storage.local;
}

function localArea(): chrome.storage.StorageArea {
  return chrome.storage.local;
}

export async function loadSettings(): Promise<Settings> {
  const [syncRaw, localRaw] = await Promise.all([
    syncArea()
      .get(SYNC_KEY)
      .then((r) => r[SYNC_KEY] as Partial<SyncPayload> | undefined),
    localArea()
      .get(LOCAL_KEY)
      .then((r) => r[LOCAL_KEY] as Partial<LocalPayload> | undefined),
  ]);
  return {
    version: 1,
    syncedRules: Array.isArray(syncRaw?.syncedRules) ? syncRaw.syncedRules : [],
    localRules: Array.isArray(localRaw?.localRules) ? localRaw.localRules : [],
    snapshots: Array.isArray(syncRaw?.snapshots) ? syncRaw.snapshots : [],
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const syncPayload: SyncPayload = {
    version: 1,
    syncedRules: settings.syncedRules,
    snapshots: settings.snapshots,
  };
  const localPayload: LocalPayload = {
    localRules: settings.localRules,
  };
  await Promise.all([
    syncArea().set({ [SYNC_KEY]: syncPayload }),
    localArea().set({ [LOCAL_KEY]: localPayload }),
  ]);
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    const key = areaName === 'local' ? LOCAL_KEY : SYNC_KEY;
    if (!(key in changes)) return;
    void loadSettings().then(callback);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

// Re-export for callers that used to import DEFAULT_SETTINGS from this module.
export { DEFAULT_SETTINGS };
