import { useEffect, useState } from 'react';
import { bossState, type BossStatus } from '../../../engine/boss.ts';
import type { ShiftSession } from '../../../engine/types.ts';
import { t as id } from '../../../i18n/index.ts';
import { playSfx } from '../../sfx.ts';
import { useAppStore } from '../../store.ts';

/** Lama banner boss (datang / kalah / lolos) sebelum hilang sendiri. */
const BANNER_MS = 4500;

export interface BossMeta {
  title: string;
  icon: string;
  intro: string;
}

/**
 * Boss akhir shift (ADR 028): bar HP + hitung mundur selama boss aktif, dan banner saat boss
 * datang, kalah, atau lolos. Banner tidak menangkap klik (pemain tetap bisa bekerja di bawahnya);
 * hilang sendiri atau ditutup.
 */
export function BossBar({
  session,
  meta,
  practice,
}: {
  session: ShiftSession;
  meta: BossMeta;
  /** Mode Latihan: tidak ada bonus gaji. */
  practice: boolean;
}) {
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  const state = bossState(session);
  const status = state?.status ?? 'pending';
  // Status yang sudah diumumkan; status saat meja dibuka (mis. melanjutkan shift) tidak diumumkan lagi.
  const [seen, setSeen] = useState<BossStatus[]>(() => [status]);
  const banner = state && !seen.includes(status) ? status : null;

  useEffect(() => {
    if (!banner) return;
    if (sound) {
      if (banner === 'active') for (const d of [0, 0.3, 0.6]) playSfx('wrong', d, 1.4);
      else if (banner === 'defeated') {
        playSfx('combo');
        playSfx('coin', 0.4);
      }
    }
    const timer = window.setTimeout(() => setSeen((s) => [...s, banner]), BANNER_MS);
    return () => window.clearTimeout(timer);
  }, [banner, sound]);

  if (!state || !session.boss) return null;
  const timed = session.playMode === 'normal';
  const reward = session.boss.reward;
  const rules = practice
    ? id.boss.rulesPractice(state.maxHp)
    : timed
      ? id.boss.rulesTimed(state.maxHp, reward)
      : id.boss.rules(state.maxHp, reward);
  return (
    <>
      {status === 'active' && (
        <section
          aria-label={id.boss.label(meta.title)}
          className="flex flex-wrap items-center gap-x-3 border-b-2 border-danger bg-danger/15 px-3 py-0.5 text-sm"
          data-testid="boss-bar"
          data-status={status}
          data-hp={state.hp}
        >
          <p className="min-w-0 flex-1 truncate font-display text-danger">
            <span aria-hidden="true">👾 {meta.icon} </span>
            {id.boss.label(meta.title)}
          </p>
          <p className="flex items-center">
            <span className="sr-only">{id.boss.hp(state.hp, state.maxHp)}</span>
            <span key={state.hp} className={state.hp < state.maxHp ? 'flinch' : 'inline-block'}>
              {Array.from({ length: state.maxHp }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={
                    'mr-1 inline-block size-3 border-2 border-danger ' +
                    (i < state.hp ? 'bg-danger' : '')
                  }
                />
              ))}
            </span>
          </p>
          {timed && (
            <p className="font-display text-sm tabular-nums" data-testid="boss-time">
              <span aria-hidden="true">⏱ </span>
              {id.boss.timeLeft(Math.ceil(state.msLeft / 1000))}
            </p>
          )}
        </section>
      )}
      {banner && (
        <div
          role="alert"
          className={
            'rank-in pointer-events-none fixed inset-x-3 top-20 z-40 mx-auto flex max-w-lg flex-col gap-1 border-4 p-3 pr-12 text-left pixel-shadow ' +
            (banner === 'defeated'
              ? 'border-safe bg-panel'
              : banner === 'active'
                ? 'alarm-pulse border-danger bg-panel'
                : 'border-ink/60 bg-panel')
          }
          data-testid="boss-banner"
          data-status={banner}
        >
          {banner === 'active' ? (
            <>
              <span className="font-display text-xl text-danger">
                <span aria-hidden="true">⚠ </span>
                {id.boss.arrives}
              </span>
              <span className="font-display text-lg">
                <span aria-hidden="true">{meta.icon} </span>
                {meta.title}
              </span>
              <span className="text-sm font-bold">{rules}</span>
            </>
          ) : (
            <span className="font-display text-lg">
              <span aria-hidden="true">{banner === 'defeated' ? '🏆 ' : '💨 '}</span>
              {banner === 'defeated'
                ? practice
                  ? id.boss.defeatedPractice(meta.title)
                  : id.boss.defeated(meta.title, reward)
                : id.boss.escaped(meta.title)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSeen((s) => [...s, banner])}
            className="pointer-events-auto absolute right-1 top-1 flex size-11 items-center justify-center font-display focus-visible:outline-4 focus-visible:outline-focus"
            aria-label={id.boss.dismiss}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
    </>
  );
}

/** Cerita & aturan boss di atas antrian selama boss aktif (banner hanya pengumuman singkat). */
export function BossBrief({
  session,
  meta,
  practice,
}: {
  session: ShiftSession;
  meta: BossMeta;
  practice: boolean;
}) {
  const state = bossState(session);
  if (!state || state.status !== 'active' || !session.boss) return null;
  const reward = session.boss.reward;
  return (
    <section
      aria-label={id.boss.label(meta.title)}
      className="flex flex-col gap-1 border-2 border-danger bg-danger/15 p-2 text-sm"
      data-testid="boss-brief"
    >
      <p className="font-display text-danger">
        <span aria-hidden="true">👾 {meta.icon} </span>
        {meta.title}
      </p>
      <p>{meta.intro}</p>
      <p className="font-bold">
        {practice
          ? id.boss.rulesPractice(state.maxHp)
          : session.playMode === 'normal'
            ? id.boss.rulesTimed(state.maxHp, reward)
            : id.boss.rules(state.maxHp, reward)}
      </p>
    </section>
  );
}
