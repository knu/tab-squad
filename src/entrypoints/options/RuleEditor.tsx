import { isUrlPatternValid } from '../../lib/match';
import { ACTION_LABELS, Action, ActionKind, Rule } from '../../lib/types';

interface Props {
  rule: Rule;
  knownGroups: chrome.tabGroups.TabGroup[];
  defaultTemplate: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<Rule>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ACTION_ORDER: ActionKind[] = [
  'default',
  'rewrite',
  'groupTail',
  'windowTail',
  'nextWindowTail',
  'targetGroup',
];

export function RuleEditor({
  rule,
  knownGroups,
  defaultTemplate,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const onActionKind = (kind: ActionKind) => {
    onChange({ action: defaultActionFor(kind, rule.action, defaultTemplate) });
  };

  const urlPattern = rule.urlPattern ?? '';
  const urlPatternValid = isUrlPatternValid(urlPattern);

  const groupTitles = dedupe(knownGroups.map((g) => g.title ?? '').filter(Boolean));

  return (
    <div className={`rule${rule.enabled ? '' : ' disabled'}`}>
      <div className="rule-grid">
        <div className="cell cell--inline">
          <label className="rule-active">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="cell cell--inline cell--right">
          <div className="row-actions">
            <button onClick={onMoveUp} disabled={isFirst} title="Move up">
              ↑
            </button>
            <button onClick={onMoveDown} disabled={isLast} title="Move down">
              ↓
            </button>
            <button className="danger" onClick={onRemove} title="Delete rule">
              ✕
            </button>
          </div>
        </div>

        <div className="cell">
          <label htmlFor={`group-title-${rule.id}`}>Tab Group</label>
          <input
            id={`group-title-${rule.id}`}
            type="text"
            placeholder="Tab group title (e.g. Work, Slack)"
            value={rule.groupTitle}
            list={`group-titles-${rule.id}`}
            onChange={(e) => onChange({ groupTitle: e.target.value })}
          />
          <datalist id={`group-titles-${rule.id}`}>
            {groupTitles.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
        </div>
        <div className="cell">
          <label htmlFor={`url-pattern-${rule.id}`}>URL pattern (regex)</label>
          <input
            id={`url-pattern-${rule.id}`}
            type="text"
            value={urlPattern}
            placeholder="^https?://(www\.)?example\.com/"
            aria-invalid={!urlPatternValid}
            onChange={(e) => onChange({ urlPattern: e.target.value || undefined })}
          />
          <p className="help">
            Case-insensitive. Leave empty to match every link.
            {!urlPatternValid && (
              <>
                {' '}
                <span className="error">Invalid regex — this rule will be skipped.</span>
              </>
            )}
          </p>
        </div>

        <div className="cell">
          <label htmlFor={`action-${rule.id}`}>Action</label>
          <select
            id={`action-${rule.id}`}
            value={rule.action.kind}
            onChange={(e) => onActionKind(e.target.value as ActionKind)}
          >
            {ACTION_ORDER.map((k) => (
              <option key={k} value={k}>
                {ACTION_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="cell">
          {rule.action.kind === 'rewrite' && (
            <>
              <label htmlFor={`rewrite-template-${rule.id}`}>URL template</label>
              <input
                id={`rewrite-template-${rule.id}`}
                type="text"
                value={rule.action.template}
                onChange={(e) =>
                  onChange({ action: { kind: 'rewrite', template: e.target.value } })
                }
                placeholder="hammerspoon://open-in-edge?url={urlencoded}"
              />
              <p className="help">
                Placeholders: <code>{'{url}'}</code>, <code>{'{urlencoded}'}</code>,{' '}
                <code>{'{host}'}</code>, <code>{'{path}'}</code>, <code>{'{search}'}</code>,{' '}
                <code>{'{hash}'}</code>.
              </p>
            </>
          )}
          {rule.action.kind === 'targetGroup' && (
            <>
              <label htmlFor={`target-title-${rule.id}`}>Destination tab group</label>
              <input
                id={`target-title-${rule.id}`}
                type="text"
                placeholder="Group title (e.g. Outside)"
                list={`target-titles-${rule.id}`}
                value={rule.action.groupTitle}
                onChange={(e) =>
                  onChange({ action: { kind: 'targetGroup', groupTitle: e.target.value } })
                }
              />
              <datalist id={`target-titles-${rule.id}`}>
                {groupTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
              <p className="help">
                Existing group with this title is preferred (current window first); created in the
                current window if none exists.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultActionFor(kind: ActionKind, prev: Action, defaultTemplate: string): Action {
  switch (kind) {
    case 'default':
      return { kind: 'default' };
    case 'rewrite':
      return {
        kind: 'rewrite',
        template: prev.kind === 'rewrite' ? prev.template : defaultTemplate,
      };
    case 'groupTail':
      return { kind: 'groupTail' };
    case 'windowTail':
      return { kind: 'windowTail' };
    case 'nextWindowTail':
      return { kind: 'nextWindowTail' };
    case 'targetGroup':
      return {
        kind: 'targetGroup',
        groupTitle: prev.kind === 'targetGroup' ? prev.groupTitle : '',
      };
  }
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
