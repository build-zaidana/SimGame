import { intlLocale, t as id } from '../../i18n/index.ts';
import { useAppStore } from '../store.ts';
import { useMenuMode } from '../useMenuMode.ts';
import { ModeTabs } from '../ui/ModeTabs.tsx';
import { Medal } from '../ui/Medal.tsx';
import { btnSecondary, panel } from '../ui/styles.ts';

const dateFmt = () =>
  new Intl.DateTimeFormat(intlLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Koleksi lencana (PRD C3): yang sudah didapat dan yang belum, dengan cara mendapatkannya. */
export function BadgesScreen() {
  const save = useAppStore((s) => s.save);
  const back = useAppStore((s) => s.back);
  const { modeId, content, inSession } = useMenuMode();

  const badges = content?.badges ?? [];
  const earned = save?.modes[modeId]?.badges ?? {};
  const count = badges.filter((b) => b.id in earned).length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.badges.heading}</h1>
      </div>
      <ModeTabs current={modeId} hidden={inSession} />
      <p className="text-ink-muted">{id.badges.intro}</p>
      <p className="font-display" data-testid="badge-count">
        {id.badges.count(count, badges.length)}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {badges.map((b) => {
          const at = earned[b.id];
          return (
            <li
              key={b.id}
              data-badge={b.id}
              data-earned={at ? 'true' : 'false'}
              className={`${panel} flex items-start gap-3 p-3 ${at ? '' : 'opacity-80'}`}
            >
              <Medal tier={b.tier} icon={b.icon} locked={!at} className="w-12 text-2xl" />
              <div className="min-w-0 flex-1">
                <h2 className={`font-display ${at ? 'text-accent' : 'text-ink-muted'}`}>
                  {b.title}
                </h2>
                <p className="text-sm">{b.description}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {id.badges.tier[b.tier]} ·{' '}
                  {at ? id.badges.earned(dateFmt().format(new Date(at))) : id.badges.locked}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
