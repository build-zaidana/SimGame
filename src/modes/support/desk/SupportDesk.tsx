import { StandardDesk } from '../../../app/ui/desk/StandardDesk.tsx';
import type { DeskProps } from '../../contract.ts';
import { SupportIntelPanel } from './SupportIntelPanel.tsx';

/** Meja Bengkel IT = meja standar + panel hasil alat (Ping, Pemindai Perangkat Keras). */
export default function SupportDesk(props: DeskProps) {
  return (
    <StandardDesk {...props} renderExtra={(c, doc) => <SupportIntelPanel c={c} doc={doc} />} />
  );
}
