import { applyTemplate } from './template';
import { Action, Rule } from './types';

const TAB_GROUP_ID_NONE = -1;

interface DispatchContext {
  tabId: number;
  url: string;
  sourceTabId: number;
  sourceWindowId: number;
  sourceGroupId: number;
}

export async function dispatch(rule: Rule, ctx: DispatchContext): Promise<void> {
  const { action } = rule;
  try {
    switch (action.kind) {
      case 'default':
        return;
      case 'rewrite':
        await runRewrite(action.template, ctx);
        return;
      case 'groupTail':
        await runGroupTail(ctx);
        return;
      case 'windowTail':
        await runWindowTail(ctx);
        return;
      case 'nextWindowTail':
        await runNextWindowTail(ctx);
        return;
      case 'targetGroup':
        await runTargetGroup(action.groupTitle, ctx);
        return;
      default: {
        const _exhaustive: never = action;
        void _exhaustive;
      }
    }
  } catch (err) {
    console.warn('[TabSquad] action failed; leaving tab in default state', err);
  }
}

async function runRewrite(template: string, ctx: DispatchContext): Promise<void> {
  const next = applyTemplate(template, ctx.url);
  if (!next || next === ctx.url) return;
  await chrome.tabs.update(ctx.tabId, { url: next });
}

async function runGroupTail(ctx: DispatchContext): Promise<void> {
  if (ctx.sourceGroupId === TAB_GROUP_ID_NONE) return;
  await chrome.tabs.move(ctx.tabId, { index: -1 });
  await chrome.tabs.group({
    groupId: ctx.sourceGroupId,
    tabIds: [ctx.tabId],
  });
}

async function runWindowTail(ctx: DispatchContext): Promise<void> {
  await safeUngroup(ctx.tabId);
  await chrome.tabs.move(ctx.tabId, { windowId: ctx.sourceWindowId, index: -1 });
}

async function runNextWindowTail(ctx: DispatchContext): Promise<void> {
  const targetWindowId = await pickNextNormalWindow(ctx.sourceWindowId);
  if (targetWindowId === undefined) {
    const created = await chrome.windows.create({ tabId: ctx.tabId, focused: true });
    if (created?.id != null) await safeUngroup(ctx.tabId);
    return;
  }
  await safeUngroup(ctx.tabId);
  await chrome.tabs.move(ctx.tabId, { windowId: targetWindowId, index: -1 });
  await chrome.tabs.update(ctx.tabId, { active: true });
  await chrome.windows.update(targetWindowId, { focused: true });
}

async function runTargetGroup(title: string, ctx: DispatchContext): Promise<void> {
  const groups = await chrome.tabGroups.query({ title });

  // Prefer a group already in the source window.
  const sameWindow = groups.find((g) => g.windowId === ctx.sourceWindowId);
  const target = sameWindow ?? groups[0];

  if (target) {
    if (target.windowId !== ctx.sourceWindowId) {
      await safeUngroup(ctx.tabId);
      await chrome.tabs.move(ctx.tabId, { windowId: target.windowId, index: -1 });
    }
    await chrome.tabs.group({ groupId: target.id, tabIds: [ctx.tabId] });
    return;
  }

  // Create a new group in the source window.
  await safeUngroup(ctx.tabId);
  await chrome.tabs.move(ctx.tabId, { windowId: ctx.sourceWindowId, index: -1 });
  const newGroupId = await chrome.tabs.group({
    createProperties: { windowId: ctx.sourceWindowId },
    tabIds: [ctx.tabId],
  });
  await chrome.tabGroups.update(newGroupId, { title });
}

async function safeUngroup(tabId: number): Promise<void> {
  try {
    await chrome.tabs.ungroup([tabId]);
  } catch {
    // already ungrouped or transient — ignore
  }
}

async function pickNextNormalWindow(currentWindowId: number): Promise<number | undefined> {
  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
  const normals = windows.filter((w) => w.id != null && w.type === 'normal');
  if (normals.length < 2) return undefined;
  const idx = normals.findIndex((w) => w.id === currentWindowId);
  if (idx === -1) return normals[0].id ?? undefined;
  const next = normals[(idx + 1) % normals.length];
  return next.id ?? undefined;
}

export type { Action };
