import type { ReactNode } from 'react';
import { id } from '../../i18n/id.ts';
import type { Settings } from '../../persistence/saveSchema.ts';
import { useAppStore } from '../store.ts';
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

      <Fieldset legend={id.settings.sound}>
        <label className={optionClass}>
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={settings.sound}
            onChange={(e) => update({ sound: e.target.checked })}
          />
          {id.settings.sound}
        </label>
      </Fieldset>
    </main>
  );
}
