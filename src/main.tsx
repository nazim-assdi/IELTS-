import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/service-worker-registration';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for offline-first caching
registerServiceWorker({
  onSuccess: () => {
    console.log('[IELTS HERO] Service worker active. Core 100 units ready for offline use.');
  },
  onUpdate: () => {
    console.log('[IELTS HERO] New curriculum content available.');
  },
});

