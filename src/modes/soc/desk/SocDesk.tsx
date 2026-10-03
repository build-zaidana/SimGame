import { StandardDesk } from '../../../app/ui/desk/StandardDesk.tsx';
import type { DeskProps } from '../../contract.ts';

/** Meja SOC memakai meja standar; alat (Pemeriksa Tautan, dll.) menyusul di M3. */
export default function SocDesk(props: DeskProps) {
  return <StandardDesk {...props} />;
}
