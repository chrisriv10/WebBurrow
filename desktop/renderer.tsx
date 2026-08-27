import React from 'react';
import { createRoot } from 'react-dom/client';

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
