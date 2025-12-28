'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Scope:', registration.scope))
        .catch((err) => console.log('SW Registration Failed:', err));
    }
  }, []);
  
  return null; // This component renders nothing visually
}