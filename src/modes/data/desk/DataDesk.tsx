import { StandardDesk } from '../../../app/ui/desk/StandardDesk.tsx';
import type { DeskProps } from '../../contract.ts';
import { DataIntelPanel } from './DataIntelPanel.tsx';

/** Meja Data = meja standar + panel hasil alat (Profiler Data, Cek Sumber). */
export default function DataDesk(props: DeskProps) {
  return <StandardDesk {...props} renderExtra={(c, doc) => <DataIntelPanel c={c} doc={doc} />} />;
}
