import { useRegisterSW } from 'virtual:pwa-register/react';
import { t as id } from '../../i18n/index.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary, btnSecondary } from './styles.ts';

/**
 * "Versi baru tersedia": pemain yang memutuskan kapan reload. Tidak tampil di meja kerja supaya shift
 * tidak terganggu, dan diletakkan di atas agar tidak menutupi tombol aksi di bawah layar.
 */
export function UpdateToast() {
  const screen = useAppStore((s) => s.screen);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (screen === 'desk' || !needRefresh) return null;

  return (
    <div
      role="status"
      className="toast fixed inset-x-2 top-2 z-40 mx-auto flex max-w-md flex-wrap items-center gap-2 border-2 border-accent bg-panel p-3 pixel-shadow"
    >
      <p className="flex-1">{id.pwa.updateReady}</p>
      <button type="button" className={btnPrimary} onClick={() => void updateServiceWorker(true)}>
        {id.pwa.reload}
      </button>
      <button type="button" className={btnSecondary} onClick={() => setNeedRefresh(false)}>
        {id.pwa.later}
      </button>
    </div>
  );
}
