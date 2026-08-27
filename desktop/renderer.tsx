import React from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@/app/globals.css';
import { WebBurrowApp } from '@/components/webburrow-app';

const root = document.getElementById('root');

if (!root) {
  throw new Error('WebBurrow desktop root element was not found.');
}

createRoot(root).render(
  <React.StrictMode>
    <WebBurrowApp />
  </React.StrictMode>,
);
