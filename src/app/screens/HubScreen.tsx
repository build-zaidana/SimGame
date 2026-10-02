import { id } from '../../i18n/id';

/** Placeholder sampai HubMenu (M4). */
export function HubScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 text-center">
      <p role="status">{id.title.comingSoon}</p>
    </main>
  );
}
