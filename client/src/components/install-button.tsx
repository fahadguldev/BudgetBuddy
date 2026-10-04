
import { useEffect, useState } from 'react';

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      // expose for manual testing in Console
      try {
        // @ts-ignore
        window.deferredPrompt = e;
      } catch (err) {
        // ignore
      }
      console.log('[PWA] beforeinstallprompt fired — saved to window.deferredPrompt', e);
      setPromptEvent(e);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
  }, []);

  // If prompt is saved on window (from previous navigation), allow manual trigger
  useEffect(() => {
    try {
      // @ts-ignore
      const deferred = window.deferredPrompt;
      if (deferred && !promptEvent) {
        setPromptEvent(deferred);
        setVisible(true);
        console.log('[PWA] found existing window.deferredPrompt');
      }
    } catch (e) {
      // ignore
    }
  }, [promptEvent]);

  if (!visible) return null;

  async function handleInstall() {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      console.log('PWA install choice:', choice);
    } catch (err) {
      console.warn('Install prompt failed:', err);
    }
    setVisible(false);
    setPromptEvent(null);
    try {
      // @ts-ignore
      window.deferredPrompt = null;
    } catch (err) {}
  }

  return (
    <div>
      <button onClick={handleInstall} className="inline-flex items-center h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm transition-all hover:shadow-md active:scale-95">
        Install BudgetBuddy
      </button>
      {/* Manual trigger note (dev): you can also run `window.deferredPrompt && window.deferredPrompt.prompt()` in the browser Console */}
    </div>
  );
}
