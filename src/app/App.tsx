import { useEffect } from 'react';
import { id } from '../i18n/id.ts';
import { DeskScreen } from './screens/DeskScreen.tsx';
import { HubScreen } from './screens/HubScreen.tsx';
import { LearningReportScreen } from './screens/LearningReportScreen.tsx';
import { ReportScreen } from './screens/ReportScreen.tsx';
import { AssessmentScreen } from './screens/AssessmentScreen.tsx';
import { ReviewScreen } from './screens/ReviewScreen.tsx';
import { SaveTransferScreen } from './screens/SaveTransferScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { ShopScreen } from './screens/ShopScreen.tsx';
import { RulebookScreen } from './screens/RulebookScreen.tsx';
import { TitleScreen } from './screens/TitleScreen.tsx';
import { persistNow, useAppStore } from './store.ts';
import { btnSecondary } from './ui/styles.ts';
import { UpdateToast } from './ui/UpdateToast.tsx';

const NOTICE_TEXT = {
  'memory-only': id.storage.memoryOnly,
  'restored-backup': id.storage.restoredBackup,
  reset: id.storage.reset,
} as const;

function Screen() {
  const screen = useAppStore((s) => s.screen);
  switch (screen) {
    case 'title':
      return <TitleScreen />;
    case 'desk':
      return <DeskScreen />;
    case 'report':
      return <ReportScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'rulebook':
      return <RulebookScreen />;
    case 'shop':
      return <ShopScreen />;
    case 'save-transfer':
      return <SaveTransferScreen />;
    case 'assessment':
      return <AssessmentScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'learning-report':
      return <LearningReportScreen />;
    default:
      return <HubScreen />;
  }
}

export function App() {
  const init = useAppStore((s) => s.init);
  const status = useAppStore((s) => s.status);
  const notice = useAppStore((s) => s.notice);
  const dismissNotice = useAppStore((s) => s.dismissNotice);
  const textScale = useAppStore((s) => s.save?.profile.settings.textScale ?? 1);
  const reduceMotion = useAppStore((s) => s.save?.profile.settings.reduceMotion ?? false);

  useEffect(() => {
    void init();
    const onHide = () => {
      if (document.visibilityState === 'hidden') persistNow();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', persistNow);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', persistNow);
    };
  }, [init]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(textScale));
  }, [textScale]);

  useEffect(() => {
    document.documentElement.dataset['reduceMotion'] = String(reduceMotion);
  }, [reduceMotion]);

  if (status === 'error') {
    return (
      <p role="alert" className="p-4">
        {id.app.loadError}
      </p>
    );
  }
  return (
    <>
      {notice && (
        <div role="alert" className="flex items-center gap-3 bg-danger p-2 text-sm text-bg">
          <p className="flex-1">{NOTICE_TEXT[notice]}</p>
          <button type="button" className={btnSecondary} onClick={dismissNotice}>
            {id.storage.dismiss}
          </button>
        </div>
      )}
      <Screen />
      <UpdateToast />
    </>
  );
}
