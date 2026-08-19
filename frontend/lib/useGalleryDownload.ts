'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DownloadCancelled,
  initialDownloadState,
  startGalleryDownload,
  type DownloadableItem,
  type DownloadMode,
  type DownloadState,
} from '@/lib/galleryDownload';

interface UseGalleryDownloadArgs {
  slug: string;
  token: string;
  galleryName: string;
  onSessionExpired: () => void;
}

const BUSY_PHASES = new Set(['choosing', 'downloading', 'finalizing']);

/**
 * Download engine ko React state se jodta hai — ek waqt me ek hi
 * download, cancel karne ki suvidha, aur khatm hone par apne aap chhup
 * jaane wala status panel.
 */
export const useGalleryDownload = ({
  slug,
  token,
  galleryName,
  onSessionExpired,
}: UseGalleryDownloadArgs) => {
  const [state, setState] = useState<DownloadState>(initialDownloadState);
  const abortRef = useRef<AbortController | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = BUSY_PHASES.has(state.phase);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => () => {
    clearHideTimer();
    abortRef.current?.abort();
  }, []);

  // Download chalte waqt tab band karne par warning — client ko pata to
  // chale ki adhoora reh jayega.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  const dismiss = useCallback(() => {
    clearHideTimer();
    setState(initialDownloadState);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(
    async (mode: DownloadMode, items: DownloadableItem[], isSubset: boolean) => {
      if (BUSY_PHASES.has(state.phase)) return;
      if (!items.length) return;

      clearHideTimer();
      const controller = new AbortController();
      abortRef.current = controller;

      const report = (patch: Partial<DownloadState>) =>
        setState((prev) => ({ ...prev, ...patch }));

      setState({ ...initialDownloadState, phase: 'choosing', total: items.length });

      try {
        await startGalleryDownload({
          slug,
          token,
          items,
          folderName: galleryName,
          mode,
          isSubset,
          report,
          signal: controller.signal,
        });

        setState((prev) => ({
          ...prev,
          phase: 'done',
          currentName: '',
          message:
            prev.failed > 0
              ? `${prev.completed} saved · ${prev.failed} failed`
              : prev.skipped > 0
                ? `All ${prev.total} photos are on your device (${prev.skipped} already there)`
                : `All ${prev.total} photos saved`,
        }));
        hideTimerRef.current = setTimeout(() => setState(initialDownloadState), 8000);
      } catch (err) {
        if (err instanceof DownloadCancelled) {
          setState((prev) => ({
            ...prev,
            phase: 'cancelled',
            currentName: '',
            message: prev.completed
              ? `Stopped — ${prev.completed} photos already saved`
              : 'Download cancelled',
          }));
          hideTimerRef.current = setTimeout(() => setState(initialDownloadState), 5000);
          return;
        }

        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          setState(initialDownloadState);
          onSessionExpired();
          return;
        }

        setState((prev) => ({
          ...prev,
          phase: 'error',
          currentName: '',
          message:
            err instanceof Error && err.message
              ? `Could not finish the download (${err.message})`
              : 'Could not finish the download',
        }));
      } finally {
        abortRef.current = null;
      }
    },
    [slug, token, galleryName, onSessionExpired, state.phase]
  );

  return { state, busy, start, cancel, dismiss };
};
