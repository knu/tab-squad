import { useState } from 'react';
import { Snapshot } from '../../lib/types';

interface Props {
  snapshot: Snapshot;
  onChange: (patch: Partial<Snapshot>) => void;
  onRemove: () => void;
  onRestore: () => void;
  onRecapture: () => void;
}

export function SnapshotEditor({ snapshot, onChange, onRemove, onRestore, onRecapture }: Props) {
  const confirmRecapture = () => {
    const ok = window.confirm(
      `Overwrite saved URLs for "${snapshot.groupTitle}" with the current state of the group?`,
    );
    if (ok) onRecapture();
  };
  const [expanded, setExpanded] = useState(false);

  const updateUrl = (idx: number, url: string) => {
    const next = snapshot.urls.slice();
    next[idx] = url;
    onChange({ urls: next });
  };

  const moveUrl = (idx: number, delta: -1 | 1) => {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= snapshot.urls.length) return;
    const next = snapshot.urls.slice();
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange({ urls: next });
  };

  const removeUrl = (idx: number) => {
    onChange({ urls: snapshot.urls.filter((_, i) => i !== idx) });
  };

  return (
    <div className="snapshot">
      <div className="snapshot-header">
        <button
          className="snapshot-toggle"
          onClick={() => setExpanded((e) => !e)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▸'} <strong>{snapshot.groupTitle || '(untitled)'}</strong>
          <span className="snapshot-meta">
            {' '}
            {snapshot.urls.length} tab{snapshot.urls.length === 1 ? '' : 's'}
            {' · '}
            {new Date(snapshot.updatedAt).toLocaleString()}
          </span>
        </button>
        <div className="row-actions">
          <button onClick={onRestore} title="Restore tabs into the current window">
            Restore
          </button>
          <button
            onClick={confirmRecapture}
            title="Replace saved URLs with the current state of the group"
          >
            Recapture
          </button>
          <button className="danger" onClick={onRemove} title="Delete snapshot">
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <ul className="snapshot-urls">
          {snapshot.urls.map((url, idx) => (
            <li key={idx}>
              <input
                type="text"
                value={url}
                onChange={(e) => updateUrl(idx, e.target.value)}
                spellCheck={false}
              />
              <div className="row-actions">
                <button onClick={() => moveUrl(idx, -1)} disabled={idx === 0} title="Move up">
                  ↑
                </button>
                <button
                  onClick={() => moveUrl(idx, 1)}
                  disabled={idx === snapshot.urls.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button className="danger" onClick={() => removeUrl(idx)} title="Remove URL">
                  ✕
                </button>
              </div>
            </li>
          ))}
          {snapshot.urls.length === 0 && (
            <li className="snapshot-empty">No URLs in this snapshot.</li>
          )}
        </ul>
      )}
    </div>
  );
}
