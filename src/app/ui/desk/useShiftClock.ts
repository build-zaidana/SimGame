import { useEffect } from 'react';
import type { ShiftAction } from '../../../engine/shift.ts';

const TICK_EVERY_MS = 250;
/** Batas satu langkah agar jam tidak melompat jauh setelah tab kembali aktif. */
const MAX_FRAME_MS = 1000;

/** Mengirim TICK ke engine dari requestAnimationFrame (berhenti sendiri saat tab tersembunyi). */
export function useShiftClock(dispatch: (a: ShiftAction) => void, running: boolean) {
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (t: number) => {
      acc += Math.min(MAX_FRAME_MS, Math.max(0, t - last));
      last = t;
      if (acc >= TICK_EVERY_MS) {
        dispatch({ type: 'TICK', dtMs: acc });
        acc = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dispatch, running]);
}
