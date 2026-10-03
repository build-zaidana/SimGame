import { useEffect, useState } from 'react';
import { intlLocale, t as id } from '../../i18n/index.ts';
import type { SaveData } from '../../persistence/saveSchema.ts';
import {
  decodeSave,
  FILE_EXTENSION,
  MAX_IMPORT_BYTES,
  summarizeSave,
  TransferError,
} from '../../persistence/transfer.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

const dateFmt = () =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' });

/** Ekspor (kode teks / file .shiftit) dan impor dengan ringkasan + konfirmasi (ARCHITECTURE §7.3). */
export function SaveTransferScreen() {
  const exportCode = useAppStore((s) => s.exportCode);
  const importSave = useAppStore((s) => s.importSave);
  const back = useAppStore((s) => s.back);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<SaveData | null>(null);

  useEffect(() => {
    void exportCode().then(setCode);
  }, [exportCode]);

  const check = async (text: string) => {
    setError(null);
    setPending(null);
    try {
      setPending(await decodeSave(text));
    } catch (e) {
      const key = e instanceof TransferError ? e.code : 'corrupt';
      setError(id.transfer.errors[key] ?? id.transfer.errors['corrupt'] ?? '');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftit-${new Date().toISOString().slice(0, 10)}${FILE_EXTENSION}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = pending ? summarizeSave(pending) : null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" className={btnSecondary} onClick={back}>
          <span aria-hidden="true">← </span>
          {id.transfer.back}
        </button>
        <h1 className="font-display text-2xl text-accent">{id.transfer.heading}</h1>
      </div>
      <p className="text-sm">{id.transfer.intro}</p>

      <section className={`${panel} flex flex-col gap-2 p-3`} aria-labelledby="export-h">
        <h2 id="export-h" className="font-display text-lg">
          {id.transfer.exportHeading}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          {id.transfer.exportCode}
          <textarea
            readOnly
            value={code}
            data-testid="export-code"
            rows={4}
            className="break-all border-2 border-ink/40 bg-bg p-2 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={!code}
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => setCopied(true));
            }}
          >
            {copied ? id.transfer.copied : id.transfer.copy}
          </button>
          <button type="button" className={btnSecondary} disabled={!code} onClick={download}>
            {id.transfer.download}
          </button>
        </div>
      </section>

      <section className={`${panel} flex flex-col gap-2 p-3`} aria-labelledby="import-h">
        <h2 id="import-h" className="font-display text-lg">
          {id.transfer.importHeading}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          {id.transfer.importLabel}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            data-testid="import-code"
            rows={4}
            className="border-2 border-ink/40 bg-bg p-2 font-mono text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {id.transfer.importFile}
          <input
            type="file"
            accept={`${FILE_EXTENSION},.txt,text/plain`}
            className="min-h-11"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_IMPORT_BYTES) {
                setError(id.transfer.errors['too-large'] ?? '');
                return;
              }
              void file.text().then((t) => {
                setInput(t);
                void check(t);
              });
            }}
          />
        </label>
        <button
          type="button"
          className={btnPrimary}
          disabled={!input.trim()}
          onClick={() => void check(input)}
        >
          {id.transfer.check}
        </button>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {pending && summary && (
          <div
            role="group"
            aria-labelledby="confirm-h"
            className="flex flex-col gap-2 border-2 border-accent p-3"
          >
            <p data-testid="import-summary">
              {id.transfer.summary(
                summary.shiftsCompleted,
                summary.stars,
                dateFmt().format(new Date(summary.updatedAt)),
              )}
            </p>
            <p id="confirm-h" className="font-display">
              {id.transfer.confirm}
            </p>
            <p className="text-sm text-ink-muted">{id.transfer.confirmNote}</p>
            <div className="flex gap-2">
              <button type="button" className={btnPrimary} onClick={() => importSave(pending)}>
                {id.transfer.confirmYes}
              </button>
              <button type="button" className={btnSecondary} onClick={() => setPending(null)}>
                {id.transfer.confirmNo}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
