import { StandardDesk } from '../../../app/ui/desk/StandardDesk.tsx';
import type { DeskProps } from '../../contract.ts';
import { DevIntelPanel } from './DevIntelPanel.tsx';

/** Meja Meja Developer = meja standar + panel hasil alat (Test Runner, Linter). */
export default function DevDesk(props: DeskProps) {
  return <StandardDesk {...props} renderExtra={(c, doc) => <DevIntelPanel c={c} doc={doc} />} />;
}
