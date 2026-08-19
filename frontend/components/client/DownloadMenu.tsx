'use client';

import { useEffect, useRef, useState } from 'react';
import type { DownloadMode } from '@/lib/galleryDownload';
import { canSaveToFolder } from '@/lib/galleryDownload';
import {
  ArchiveIcon,
  ChevronDownIcon,
  DownloadIcon,
  FolderIcon,
} from '@/components/client/icons';

interface DownloadMenuProps {
  label: string;
  /** Button par dikhne wala count. 0 = koi count nahi dikhana. */
  count?: number;
  disabled?: boolean;
  align?: 'left' | 'right';
  /**
   * Menu upar khulega ya neeche. Selection bar screen ke bilkul neeche
   * hoti hai — wahan neeche khulne wala menu viewport se bahar kat jaata
   * hai, isliye wahan `up` chahiye.
   */
  direction?: 'down' | 'up';
  variant?: 'primary' | 'quiet' | 'dark';
  onPick: (mode: DownloadMode) => void;
}

const VARIANTS: Record<string, string> = {
  primary:
    'bg-ink text-white hover:bg-obsidian-soft shadow-soft',
  quiet:
    'border border-line-strong bg-white text-ink hover:border-accent hover:bg-hover-surface',
  dark:
    'bg-white text-ink hover:bg-accent-tint',
};

/**
 * Download button + uske do raaste.
 *
 * Do alag buttons ("Download All" / "Download as Folder") ke bajaye ek
 * primary action rakha hai. Pehle wale design me client ko lagta tha ki
 * dono ek hi cheez hain (aur the bhi — dono zip hi dete the). Ab folder
 * wala option sach much folder me photos likhta hai, isliye dono ke
 * beech ka farq menu me ek line me samjha diya gaya hai.
 */
export default function DownloadMenu({
  label,
  count = 0,
  disabled,
  align = 'right',
  direction = 'down',
  variant = 'primary',
  onPick,
}: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const [folderSupported, setFolderSupported] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Capability check sirf browser me — SSR aur client ka pehla render
  // match karna zaroori hai, warna hydration mismatch aata hai.
  useEffect(() => setFolderSupported(canSaveToFolder()), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (mode: DownloadMode) => {
    setOpen(false);
    onPick(mode);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm font-medium transition-all duration-300 ease-editorial disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]}`}
      >
        <DownloadIcon size={15} />
        {label}
        {count > 0 && (
          <span className="text-[13px] tabular-nums opacity-60">({count})</span>
        )}
        <ChevronDownIcon
          size={13}
          className={`transition-transform duration-300 ${
            open !== (direction === 'up') ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-[min(290px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift ${
            direction === 'up' ? 'cg-menu-up bottom-full mb-2' : 'cg-menu mt-2'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {folderSupported && (
            <button
              role="menuitem"
              onClick={() => choose('folder')}
              className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-hover-surface"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent-deep">
                <FolderIcon size={15} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-body text-sm font-semibold text-ink">
                  Save to a folder
                  <span className="rounded-full bg-accent-deep px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-white">
                    Fastest
                  </span>
                </span>
                <span className="mt-0.5 block font-body text-xs leading-relaxed text-ink-muted">
                  Photos land straight in a folder you pick. No zip, no
                  extracting — and it resumes if it stops.
                </span>
              </span>
            </button>
          )}

          <button
            role="menuitem"
            onClick={() => choose('zip')}
            className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-hover-surface"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent-deep">
              <ArchiveIcon size={15} />
            </span>
            <span className="min-w-0">
              <span className="block font-body text-sm font-semibold text-ink">
                Download as ZIP
              </span>
              <span className="mt-0.5 block font-body text-xs leading-relaxed text-ink-muted">
                One file with every photo inside. Works on every device;
                you unzip it afterwards.
              </span>
            </span>
          </button>

          {!folderSupported && (
            <p className="px-3 pb-2 pt-1 font-body text-[11px] leading-relaxed text-ink-faint">
              Tip: open this gallery in Chrome or Edge on a computer to save
              photos straight into a folder, without any zip.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
