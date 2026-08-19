'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteConfig } from '@/lib/types';
import { CameraIcon, EyeIcon, EyeOffIcon, LockIcon } from '@/components/client/icons';

interface GalleryUnlockProps {
  config: SiteConfig | null | undefined;
  error: string;
  loading: boolean;
  onSubmit: (password: string) => void;
}

/**
 * Unlock screen.
 *
 * Yeh pehli cheez hai jo client dekhta hai — aur is waqt hum uski koi
 * photo dikha nahi sakte (gallery abhi locked hai). Isliye yahan mahaul
 * light aur grain se banaya gaya hai, photos se nahi.
 */
export default function GalleryUnlock({
  config,
  error,
  loading,
  onSubmit,
}: GalleryUnlockProps) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Har naye error par card ek baar hilta hai — client ko turant samajh
  // aata hai ki password galat gaya, sirf laal text padhne ki zaroorat
  // nahi padti.
  useEffect(() => {
    if (!error) return;
    setShake(true);
    inputRef.current?.focus();
    inputRef.current?.select();
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [error]);

  const studioName = config?.studio_name || config?.photographer_name || '';

  return (
    <div className="cg-unlock cg-grain flex items-center justify-center px-5 py-16">
      <div
        className={`cg-unlock-card relative w-full max-w-[380px] rounded-3xl px-7 py-10 sm:px-9 ${
          shake ? 'cg-shake' : ''
        }`}
      >
        {/* Studio mark */}
        <div className="relative mx-auto mb-7 h-16 w-16">
          <span className="cg-ring" />
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-lg">
            {config?.studio_logo?.secure_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.studio_logo.secure_url}
                alt={studioName || 'Studio'}
                className="h-full w-full object-cover"
              />
            ) : (
              <CameraIcon size={26} className="text-[#2E4759]" />
            )}
          </div>
        </div>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-body text-[10px] uppercase tracking-[0.24em] text-[#B9D7EA]">
            <LockIcon size={11} />
            Private
          </span>

          <h1 className="mt-5 font-display text-[2rem] font-light leading-tight text-white">
            Your Gallery
          </h1>
          <p className="mt-2 font-body text-sm leading-relaxed text-[#B9D7EA]/75">
            Enter the password your photographer shared with you.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading && password) onSubmit(password);
          }}
          className="mt-8 space-y-3"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Gallery password"
              autoFocus
              autoComplete="current-password"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'cg-unlock-error' : undefined}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 pr-12 text-center font-body text-sm text-white placeholder:text-white/35 transition-all focus:border-[#769FCD] focus:bg-white/[0.1] focus:outline-none focus:ring-4 focus:ring-[#769FCD]/20"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition-colors hover:text-white/85"
            >
              {visible ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
            </button>
          </div>

          {error && (
            <p
              id="cg-unlock-error"
              role="alert"
              className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-center font-body text-xs text-red-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 font-body text-sm font-semibold text-[#0C1720] transition-all hover:bg-[#D6E6F2] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0C1720]/25 border-t-[#0C1720]" />
                Verifying…
              </>
            ) : (
              <>
                Open Gallery
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-500 ease-editorial group-hover:translate-x-1"
                  aria-hidden
                >
                  <line x1="4" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
              </>
            )}
          </button>
        </form>

        {studioName && (
          <p className="mt-8 text-center font-body text-[10px] uppercase tracking-[0.22em] text-white/30">
            Photographs by {studioName}
          </p>
        )}
      </div>
    </div>
  );
}
