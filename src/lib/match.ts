import { Rule } from './types';

const regexCache = new Map<string, RegExp | null>();

function compileUrlPattern(pattern: string): RegExp | null {
  if (regexCache.has(pattern)) return regexCache.get(pattern)!;
  let compiled: RegExp | null;
  try {
    compiled = new RegExp(pattern, 'i');
  } catch {
    compiled = null;
  }
  regexCache.set(pattern, compiled);
  return compiled;
}

export function isUrlPatternValid(pattern: string): boolean {
  if (!pattern) return true;
  return compileUrlPattern(pattern) !== null;
}

export function findMatchingRule(
  rules: Rule[],
  group: chrome.tabGroups.TabGroup,
  url: string,
): Rule | undefined {
  return rules.find((rule) => {
    if (!rule.enabled) return false;
    if (!rule.groupTitle) return false;
    if (rule.groupTitle !== (group.title ?? '')) return false;
    if (rule.urlPattern) {
      const re = compileUrlPattern(rule.urlPattern);
      if (!re) return false;
      if (!re.test(url)) return false;
    }
    return true;
  });
}
