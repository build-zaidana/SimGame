import { hashString } from '../../../engine/rng.ts';
import { Avatar } from '../../../app/ui/Avatar.tsx';
import { t as id } from '../../../i18n/index.ts';
import type { PyTest, RunResult } from '../runner/harness.ts';

/** Jeda antar-pelanggan saat dilayani (ms). */
const SERVE_STEP = 380;
const PRICE = 5000;

interface CustomerSceneProps {
  /** Nama aplikasi (dari nama berkas), mis. "rapor/nilai.py". */
  file: string;
  /** Kunci acak tetap per kasus, agar wajah pelanggan sama setiap kali. */
  seed: string;
  tests: readonly PyTest[];
  result: RunResult | null;
}

/**
 * Tes sebagai pelanggan (tahap "game feel"): tiap tes adalah pelanggan yang antre di loket aplikasi.
 * Kode benar → senang & membayar; salah → kecewa dengan protes "dapat X, harusnya Y"; crash → aplikasi
 * meledak dan semua kabur. Hanya hiasan: hasil yang sama tetap tertulis di daftar tes (pembaca layar).
 */
export function CustomerScene({ file, seed, tests, result }: CustomerSceneProps) {
  const t = id.dev.customers;
  const crashed = !!result?.error;
  const passed = result?.tests.filter((x) => x.passed).length ?? 0;
  let hidden = 0;
  return (
    <section
      aria-label={t.label}
      className={
        'border-2 border-ink/60 bg-[#232a3a] p-2 text-[#e6e1d6] ' + (crashed ? 'crash-shake' : '')
      }
      data-testid="customer-scene"
      data-crashed={crashed || undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-2 font-display text-xs">
        <span>
          <span aria-hidden="true">🖥 </span>
          {t.app(file)}
        </span>
        {result && !crashed && (
          <span className="text-[#f2c14e]" data-testid="revenue">
            {t.revenue(passed * PRICE)}
          </span>
        )}
      </div>
      {crashed && (
        <p className="mb-2 border-2 border-[#f07a6a] bg-[#3a1210] p-2 text-center font-display text-[#f07a6a]">
          <span aria-hidden="true">💥 </span>
          {t.crash}
          <span className="block font-sans text-xs text-[#e6e1d6]">{t.crashLine}</span>
        </p>
      )}
      {!result && <p className="mb-2 text-xs text-[#c9ccd6]">{t.waiting}</p>}
      <ol className="flex flex-col gap-2" aria-hidden="true">
        {tests.map((test, i) => {
          if (test.hidden) hidden++;
          const r = result?.tests[i];
          const mood = !r ? 'neutral' : r.passed ? 'happy' : 'upset';
          const happyLines = t.happy;
          const line = !r
            ? test.hidden
              ? t.mystery
              : test.name
            : r.passed
              ? happyLines[hashString(seed + i) % happyLines.length]
              : crashed
                ? '…'
                : test.hidden
                  ? t.upset
                  : r.got !== undefined
                    ? id.dev.run.gotExpected(r.got, r.expected ?? '')
                    : t.upset;
          return (
            <li
              key={`${i}-${result ? 'r' : 'q'}`}
              className="walk-in flex items-center gap-2"
              style={{ animationDelay: `${result ? i * SERVE_STEP : 0}ms` }}
              data-mood={mood}
            >
              <span className="relative">
                <Avatar kind="person" seed={`${seed}-${i}`} mood={mood} className="size-10" />
                {test.hidden && !r && (
                  <span className="absolute inset-0 grid place-items-center bg-[#14101c]/70 font-display text-lg">
                    ?
                  </span>
                )}
              </span>
              <span
                className={
                  'min-w-0 flex-1 border-2 px-2 py-1 text-xs break-words ' +
                  (mood === 'happy'
                    ? 'border-[#74cf92]'
                    : mood === 'upset'
                      ? 'border-[#f07a6a]'
                      : 'border-[#5d6b82]')
                }
              >
                {test.hidden && r ? `${id.dev.run.hiddenTest(hidden)}: ` : ''}
                {line}
              </span>
              {r?.passed && <span className="text-[#f2c14e]">+Rp</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
