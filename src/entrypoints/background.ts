import { defineBackground } from 'wxt/utils/define-background';
import { findMatchingRule } from '../lib/match';
import { dispatch } from '../lib/router';
import { loadSettings, onSettingsChanged } from '../lib/storage';
import { DEFAULT_SETTINGS, Settings } from '../lib/types';

const TAB_GROUP_ID_NONE = -1;
const RECENTLY_DISPATCHED_TTL_MS = 5_000;

export default defineBackground(() => {
  let cachedSettings: Settings = DEFAULT_SETTINGS;
  const recentlyDispatchedTabs = new Map<number, number>();

  const refreshSettings = async (): Promise<void> => {
    cachedSettings = await loadSettings();
  };

  const rememberDispatch = (tabId: number): void => {
    recentlyDispatchedTabs.set(tabId, Date.now());
    if (recentlyDispatchedTabs.size > 100) {
      const cutoff = Date.now() - RECENTLY_DISPATCHED_TTL_MS;
      for (const [id, ts] of recentlyDispatchedTabs) {
        if (ts < cutoff) recentlyDispatchedTabs.delete(id);
      }
    }
  };

  const wasRecentlyDispatched = (tabId: number): boolean => {
    const ts = recentlyDispatchedTabs.get(tabId);
    if (ts == null) return false;
    if (Date.now() - ts > RECENTLY_DISPATCHED_TTL_MS) {
      recentlyDispatchedTabs.delete(tabId);
      return false;
    }
    return true;
  };

  const handle = async (
    details: chrome.webNavigation.WebNavigationSourceCallbackDetails,
  ): Promise<void> => {
    if (wasRecentlyDispatched(details.tabId)) return;

    let sourceTab: chrome.tabs.Tab;
    try {
      sourceTab = await chrome.tabs.get(details.sourceTabId);
    } catch {
      return;
    }
    const sourceGroupId = sourceTab.groupId ?? TAB_GROUP_ID_NONE;
    if (sourceGroupId === TAB_GROUP_ID_NONE) return;

    let group: chrome.tabGroups.TabGroup;
    try {
      group = await chrome.tabGroups.get(sourceGroupId);
    } catch {
      return;
    }

    const rule = findMatchingRule(cachedSettings.rules, group, details.url);
    if (!rule) return;

    rememberDispatch(details.tabId);

    await dispatch(rule, {
      tabId: details.tabId,
      url: details.url,
      sourceTabId: details.sourceTabId,
      sourceWindowId: sourceTab.windowId,
      sourceGroupId,
    });
  };

  void refreshSettings();
  onSettingsChanged((next) => {
    cachedSettings = next;
  });

  chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
    void handle(details);
  });

  chrome.action.onClicked.addListener(() => {
    void chrome.runtime.openOptionsPage();
  });

  chrome.runtime.onInstalled.addListener(() => {
    void refreshSettings();
  });

  chrome.runtime.onStartup.addListener(() => {
    void refreshSettings();
  });
});
