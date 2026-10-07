import { useState, type ReactNode } from 'react';
import { LOCALES, t as id } from '../../i18n/index.ts';
import type { Settings } from '../../persistence/saveSchema.ts';
import { resetTips } from '../onboarding.ts';
import { useAppStore } from '../store.ts';
import { ANALYTICS_OPT_IN, analyticsAvailable, telemetry } from '../telemetry.ts';
import { btnSecondary, panel } from '../ui/styles.ts';

const TEXT_SCALES: Settings['textScale'][] = [1, 1.15, 1.3];

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className={`${panel} flex flex-col gap-2 p-3`}>
      <legend className="px-1 font-display text-lg">{legend}</legend>
      {children}
    </fieldset>
  );
}

const optionClass =
  'flex min-h-11 cursor-pointer items-center gap-3 px-1 focus-within:outline-4 focus-within:outline-focus';

/** Pengaturan (PRD M11): ukuran teks, mode bermain, kurangi animasi, suara. */
export function SettingsScreen() {
  const settings = useAppStore((s) => s.save?.profile.settings);
  const update = useAppStore((s) => s.updateSettings);
  const back = useAppStore((s) => s.back);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const analyticsOn = useAppStore((s) => s.save?.flags[ANALYTICS_OPT_IN] === true);
  const setFlag = useAppStore((s) => s.setFlag);
  const updateSave = useAppStore((s) => s.updateSave);
  const [tipsReset, setTipsReset] = useState(false);
  if (!settings) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.settings.heading}</h1>
      </div>

      <Fieldset legend={id.language.label}>
        {LOCALES.map((l) => (
          <label key={l} className={optionClass} lang={l}>
            <input
              type="radio"
              name="language"
              className="size-5 accent-accent"
              checked={settings.language === l}
              onChange={() => void setLanguage(l)}
            />
            {id.language.names[l]}
          </label>
        ))}
        <p className="text-sm text-ink-muted">{id.language.note}</p>
      </Fieldset>

      <Fieldset legend={id.settings.textScale}>
        {TEXT_SCALES.map((scale) => (
          <label key={scale} className={optionClass}>
            <input
              type="radio"
              name="text-scale"
              className="size-5 accent-accent"
              checked={settings.textScale === scale}
              onChange={() => update({ textScale: scale })}
            />
            {id.settings.textScaleOptions[String(scale)]}
          </label>
        ))}
        <p className="border-2 border-ink/30 bg-bg p-2">{id.settings.preview}</p>
      </Fieldset>

      <Fieldset legend={id.settings.playMode}>
        {(['relaxed', 'normal'] as const).map((mode) => (
          <label key={mode} className={optionClass}>
            <input
              type="radio"
              name="play-mode"
              className="size-5 shrink-0 accent-accent"
              checked={settings.playMode === mode}
              onChange={() => update({ playMode: mode })}
            />
            {id.settings[mode]}
          </label>
        ))}
        <p className="text-sm text-ink-muted">{id.settings.playModeNote}</p>
      </Fieldset>

      <Fieldset legend={id.hub.heading}>
        <label className={optionClass}>
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-accent"
            checked={settings.exploreOffice}
            onChange={(e) => update({ exploreOffice: e.target.checked })}
          />
          {id.explore.setting}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              updateSave(resetTips);
              setTipsReset(true);
            }}
          >
            {id.tips.reset}
          </button>
          {tipsReset && (
            <p role="status" className="text-sm text-safe">
              {id.tips.resetDone}
            </p>
          )}
        </div>
      </Fieldset>

      <Fieldset legend={id.settings.reduceMotion}>
        <label className={optionClass}>
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={settings.reduceMotion}
            onChange={(e) => update({ reduceMotion: e.target.checked })}
          />
          {id.settings.reduceMotion}
        </label>
      </Fieldset>

      <Fieldset legend={id.settings.audio}>
        <label className={optionClass}>
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={settings.sound}
            onChange={(e) => update({ sound: e.target.checked })}
          />
          {id.settings.sound}
        </label>
        <label className={optionClass}>
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={settings.music}
            onChange={(e) => update({ music: e.target.checked })}
          />
          {id.settings.music}
        </label>
      </Fieldset>

      {analyticsAvailable && (
        <Fieldset legend={id.settings.analytics}>
          <label className={optionClass}>
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-accent"
              checked={analyticsOn}
              onChange={(e) => {
                setFlag(ANALYTICS_OPT_IN, e.target.checked);
                // Mematikan: antrean yang belum terkirim langsung dibuang.
                if (!e.target.checked) void telemetry.flush();
              }}
            />
            {id.settings.analyticsOptIn}
          </label>
          <p className="text-sm text-ink-muted">{id.settings.analyticsNote}</p>
        </Fieldset>
      )}
    </main>
  );
}
