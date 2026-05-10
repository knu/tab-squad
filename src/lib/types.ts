export type ActionKind =
  | 'default'
  | 'rewrite'
  | 'groupTail'
  | 'windowTail'
  | 'nextWindowTail'
  | 'targetGroup';

export interface BaseAction {
  kind: ActionKind;
}

export interface DefaultAction extends BaseAction {
  kind: 'default';
}

export interface RewriteAction extends BaseAction {
  kind: 'rewrite';
  template: string;
}

export interface GroupTailAction extends BaseAction {
  kind: 'groupTail';
}

export interface WindowTailAction extends BaseAction {
  kind: 'windowTail';
}

export interface NextWindowTailAction extends BaseAction {
  kind: 'nextWindowTail';
}

export interface TargetGroupAction extends BaseAction {
  kind: 'targetGroup';
  groupTitle: string;
}

export type Action =
  | DefaultAction
  | RewriteAction
  | GroupTailAction
  | WindowTailAction
  | NextWindowTailAction
  | TargetGroupAction;

export interface Rule {
  id: string;
  enabled: boolean;
  groupTitle: string;
  urlPattern?: string;
  action: Action;
}

export interface Settings {
  version: 1;
  rules: Rule[];
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  rules: [],
};

export const ACTION_LABELS: Record<ActionKind, string> = {
  default: 'Default (do nothing)',
  rewrite: 'Rewrite URL',
  groupTail: "Move to the same group's tail",
  windowTail: 'Move to the window tail',
  nextWindowTail: 'Move to the next window tail',
  targetGroup: 'Move to a named tab group',
};
