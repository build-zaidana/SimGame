import { StandardDesk } from '../../../app/ui/desk/StandardDesk.tsx';
import type { DeskProps } from '../../contract.ts';
import { SocIntelPanel } from './SocIntelPanel.tsx';

/** Meja SOC = meja standar + panel hasil alat (WHOIS, Sandbox). */
export default function SocDesk(props: DeskProps) {
  return <StandardDesk {...props} renderExtra={(c, doc) => <SocIntelPanel c={c} doc={doc} />} />;
}
