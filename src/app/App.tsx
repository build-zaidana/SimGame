import { HubScreen } from './screens/HubScreen';
import { TitleScreen } from './screens/TitleScreen';
import { useAppStore } from './store';

export function App() {
  const screen = useAppStore((s) => s.screen);
  switch (screen) {
    case 'title':
      return <TitleScreen />;
    default:
      return <HubScreen />;
  }
}
