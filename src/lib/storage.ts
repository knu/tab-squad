import { DEFAULT_SETTINGS, Settings } from './types';

const STORAGE_KEY = 'settings';

function area(): chrome.storage.StorageArea {
  return chrome.storage.sync ?? chrome.storage.local;
}

export async function loadSettings(): Promise<Settings> {
  const result = await area().get(STORAGE_KEY);
  const value = result[STORAGE_KEY];
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS };
  return migrate(value as Partial<Settings>);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await area().set({ [STORAGE_KEY]: settings });
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    if (!(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue;
    callback(next ? migrate(next as Partial<Settings>) : { ...DEFAULT_SETTINGS });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function migrate(raw: Partial<Settings>): Settings {
  return {
    version: 1,
    rules: Array.isArray(raw.rules) ? raw.rules : [],
    snapshots: Array.isArray(raw.snapshots) ? raw.snapshots : [],
  };
}
