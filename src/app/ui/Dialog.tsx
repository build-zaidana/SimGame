import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  labelledBy: string;
  children: ReactNode;
  /** Escape memanggil ini; tanpa onClose, Escape diabaikan. */
  onClose?: () => void;
  /**
   * 'action' (bawaan <dialog>): fokus ke tombol pertama.
   * 'content': fokus ke dialog itu sendiri agar isi dibaca dari atas (umpan balik panjang di HP).
   */
  initialFocus?: 'action' | 'content';
  /** 'paper': slip kertas (umpan balik), memakai token warna kertas. */
  variant?: 'panel' | 'paper';
}

/** Modal memakai <dialog> bawaan: fokus terkunci di dalam dan latar belakang inert. */
export function Dialog({
  labelledBy,
  children,
  onClose,
  initialFocus = 'action',
  variant = 'panel',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    if (el && initialFocus === 'content') {
      el.focus();
      el.scrollTop = 0;
    }
    return () => el?.close();
  }, [initialFocus]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      className={
        'm-auto max-h-[90dvh] w-[min(36rem,calc(100vw-2rem))] overflow-auto border-4 border-ink p-4 ' +
        'backdrop:bg-[#161a24]/80 focus-visible:outline-4 focus-visible:outline-focus ' +
        (variant === 'paper' ? 'paper paper-sheet slip-up' : 'bg-panel text-ink')
      }
    >
      {children}
    </dialog>
  );
}
