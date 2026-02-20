import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppShell } from '@descix/app-sdk';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell appId="demo" config={{}}>
      <div style={{ padding: 24, color: '#E6EDF3', fontFamily: 'sans-serif' }}>
        <h1>App Ready</h1>
        <p>The shell has reached READY state. Your app component is now rendered.</p>
      </div>
    </AppShell>
  </React.StrictMode>
);
