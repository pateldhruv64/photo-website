'use client';

import { useState } from 'react';
import {
  formatBytes,
  formatDuration,
  type DownloadState,
} from '@/lib/galleryDownload';
import { CheckIcon, CloseIcon, DownloadIcon } from '@/components/client/icons';

interface DownloadDockProps {
  state: DownloadState;
  onCancel: () => void;
  onDismiss: () => void;
}

const ROUTE_LABEL: Record<string, string> = {
  folder: 'Saving into your folder',
  'zip-disk': 'Building ZIP on your disk',
  'zip-memory': 'Building ZIP',
  server: 'Preparing on the server',
};

/**
 * Neeche-daayein tarafa ka progress panel.
 *
 * Pehle download ke dauraan sirf button par ek spinner ghoomta tha —
 * client ko na pata chalta tha ki kitna hua, na kitna baaki, aur na hi
 * wo rok sakta tha. 200 photos par yeh "website hang ho gayi" jaisa
 * lagta tha. Ab har cheez dikhti hai, aur cancel bhi ho sakta hai.
 */
export default function DownloadDock({ state, onCancel, onDismiss }: DownloadDockProps) {
  const [showErrors, setShowErrors] = useState(false);

  if (state.phase === 'idle') return null;

  const done = state.completed + state.skipped + state.failed;
  const percent = state.total ? Math.round((done / state.total) * 100) : 0;
  const isBusy =
    state.phase === 'choosing' ||
    state.phase === 'downloading' ||
    state.phase === 'finalizing';

  // Server route par per-file progress nahi milta (ek hi lambi response
  // hoti hai) — wahan indeterminate bar hi imaandaar hai.
  const indeterminate =
    isBusy && (state.route === 'server' || state.phase === 'choosing' || !state.total);

  const remaining =
    state.speed > 0 && done > 0 && state.total > done
      ? formatDuration(((state.bytes / done) * (state.total - done)) / state.speed)
      : '';

  const tone =
    state.phase === 'error'
      ? 'border-red-200'
      : state.phase === 'done'
        ? 'border-accent'
        : 'border-line';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[200] w-[min(360px,calc(100vw-2rem))] sm:bottom-6 sm:right-6"
    >
      <div className={`cg-dock overflow-hidden rounded-2xl border bg-white/95 shadow-lift backdrop-blur-xl ${tone}`}>
        <div className="flex items-start gap-3 p-4">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              state.phase === 'done'
                ? 'bg-accent-deep text-white'
                : state.phase === 'error'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-accent-tint text-accent-deep'
            }`}
          >
            {state.phase === 'done' ? (
              <CheckIcon size={16} />
            ) : isBusy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-deep/25 border-t-accent-deep" />
            ) : (
              <DownloadIcon size={15} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-body text-sm font-semibold text-ink">
              {state.phase === 'done'
                ? 'Download complete'
                : state.phase === 'error'
                  ? 'Download stopped'
                  : state.phase === 'cancelled'
                    ? 'Cancelled'
                    : (state.route && ROUTE_LABEL[state.route]) || 'Preparing…'}
            </p>

            <p className="mt-0.5 truncate font-body text-xs text-ink-muted">
              {state.message ||
                (state.currentName
                  ? state.currentName
                  : `${done} of ${state.total} photos`)}
            </p>

            {isBusy && (
              <>
                <div className={`cg-bar mt-3 h-1.5 w-full overflow-hidden rounded-full ${indeterminate ? 'cg-bar-indeterminate' : ''}`}>
                  {!indeterminate && (
                    <div className="cg-bar-fill" style={{ width: `${percent}%` }} />
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] tabular-nums text-ink-muted">
                  {!indeterminate && (
                    <span className="font-medium text-ink">
                      {done} / {state.total}
                    </span>
                  )}
                  {state.bytes > 0 && <span>{formatBytes(state.bytes)}</span>}
                  {state.speed > 0 && <span>{formatBytes(state.speed)}/s</span>}
                  {remaining && <span>{remaining} left</span>}
                  {state.skipped > 0 && <span>{state.skipped} already saved</span>}
                </div>
              </>
            )}

            {state.failed > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowErrors((s) => !s)}
                  className="font-body text-[11px] font-medium text-red-500 underline underline-offset-2"
                >
                  {state.failed} photo{state.failed > 1 ? 's' : ''} could not be saved
                </button>
                {showErrors && (
                  <ul className="mt-1 max-h-24 overflow-y-auto font-body text-[11px] text-ink-muted">
                    {state.failedNames.map((name) => (
                      <li key={name} className="truncate">
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 font-body text-[11px] leading-relaxed text-ink-muted">
                  Run the download again — finished photos are skipped, so only
                  the missing ones are fetched.
                </p>
              </div>
            )}

            {isBusy && (
              <button
                onClick={onCancel}
                className="mt-3 font-body text-[11px] font-medium text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                Cancel
              </button>
            )}
          </div>

          {!isBusy && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-hover-surface hover:text-ink"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
