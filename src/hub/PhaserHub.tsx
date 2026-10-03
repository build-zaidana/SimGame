import { useEffect, useRef, useState, type ReactNode } from 'react';
import { t as id } from '../i18n/index.ts';
import { Avatar } from '../app/ui/Avatar.tsx';
import { btnPrimary } from '../app/ui/styles.ts';
import type { HubHandle } from './hubTypes.ts';

export interface HotspotInfo {
  /** Nama tempat/orang, mis. "Meja SOC". */
  label: string;
  /** Teks tombol aksi, mis. "Masuk". Tanpa aksi = hanya keterangan (meja terkunci). */
  action?: string;
}

interface PhaserHubProps {
  activeModes: string[];
  describe(hotspotId: string): HotspotInfo;
  /** Dipanggil saat pemain berinteraksi; mengembalikan ucapan Mbak Rani bila ada. */
  onInteract(hotspotId: string): string | void;
  /** Ditampilkan selama Phaser dimuat atau bila gagal (ilustrasi statis). */
  fallback: ReactNode;
}

/**
 * Kantor yang bisa dijelajahi (PRD C1, ADR 024). Phaser dimuat dinamis hanya di sini. Kanvas tidak
 * terbaca pembaca layar, jadi semua tujuan tetap ada sebagai tombol biasa di HUB; bar di bawah
 * kanvas mengumumkan tempat terdekat dan punya tombol aksi sendiri.
 */
export function PhaserHub({ activeModes, describe, onInteract, fallback }: PhaserHubProps) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<HubHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [near, setNear] = useState<string | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const interactRef = useRef(onInteract);
  useEffect(() => {
    interactRef.current = onInteract;
  }, [onInteract]);
  const modesKey = activeModes.join(',');

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;
    import('./phaser/createGame.ts')
      .then(({ createGame }) => {
        if (cancelled) return;
        handle.current = createGame(el, {
          activeModes: modesKey.split(',').filter(Boolean),
          callbacks: {
            onNear: (hotspotId) => {
              setNear(hotspotId);
              setSpeech(null);
            },
            onInteract: (hotspotId) => {
              const said = interactRef.current(hotspotId);
              if (typeof said === 'string') setSpeech(said);
            },
          },
        });
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('failed'));
    return () => {
      cancelled = true;
      handle.current?.destroy();
      handle.current = null;
    };
  }, [modesKey]);

  const info = near ? describe(near) : null;
  return (
    <div className="flex flex-col gap-2" data-testid="explore-office" data-status={status}>
      {status === 'failed' ? (
        fallback
      ) : (
        <div className="relative aspect-[320/192] w-full">
          <div
            ref={host}
            tabIndex={status === 'ready' ? 0 : -1}
            role="application"
            aria-label={id.explore.canvasLabel}
            aria-describedby="explore-help"
            className="absolute inset-0 border-2 border-ink/40 bg-bg pixel-shadow focus-visible:outline-4 focus-visible:outline-focus"
          />
          {/* Selama Phaser dimuat: ilustrasi statis di atas kanvas (sudah berukuran penuh). */}
          {status === 'loading' && <div className="absolute inset-0 bg-bg">{fallback}</div>}
        </div>
      )}
      {status === 'ready' && (
        <>
          <p id="explore-help" className="text-sm text-ink-muted">
            {id.explore.help}
          </p>
          <div
            role="status"
            className="flex min-h-14 items-center gap-3 border-2 border-ink/40 bg-panel p-2"
            data-testid="explore-prompt"
          >
            {speech ? (
              <>
                <Avatar kind="rani" className="size-10" />
                <p className="flex-1 text-sm">
                  <strong className="font-display text-accent">{id.speakers['rani']}: </strong>
                  {speech}
                </p>
              </>
            ) : info ? (
              <>
                <p className="flex-1 font-display">{info.label}</p>
                {info.action ? (
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => handle.current?.interact()}
                  >
                    {info.action}
                  </button>
                ) : (
                  <p className="text-sm text-ink-muted">{id.hub.comingSoon}</p>
                )}
              </>
            ) : (
              <p className="flex-1 text-sm text-ink-muted">{id.explore.idle}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
