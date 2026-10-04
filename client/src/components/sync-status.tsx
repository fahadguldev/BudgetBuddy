import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// Shows only while the device is offline. Firestore keeps serving reads
// from cache and queues writes, so the app keeps working — this pill just
// tells the user their changes will sync when they reconnect.
export default function SyncStatus() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
    >
      <div className="flex items-center gap-2 h-9 pl-3 pr-4 rounded-full bg-card border border-border shadow-lg text-xs font-medium">
        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
        <span>Offline — changes save here and sync on reconnect</span>
      </div>
    </div>
  );
}
