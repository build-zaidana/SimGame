import { useEffect } from 'react';
import { useAppStore } from './store.ts';

/**
 * Mode yang dilihat di layar Toko / Buku Panduan / Lencana: mode shift yang sedang berjalan,
 * atau pilihan pemain di tab meja. Konten mode itu dimuat bila belum ada.
 */
export function useMenuMode() {
  const sessionMode = useAppStore((s) => s.session?.modeId);
  const menuMode = useAppStore((s) => s.menuMode);
  const modeId = sessionMode ?? menuMode;
  const content = useAppStore((s) => s.contents[modeId]) ?? null;
  const preload = useAppStore((s) => s.preloadContent);
  useEffect(() => {
    if (!content) void preload(modeId);
  }, [content, modeId, preload]);
  return { modeId, content, inSession: !!sessionMode };
}
