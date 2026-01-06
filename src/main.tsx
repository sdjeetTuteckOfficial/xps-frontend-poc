import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import App from './App.tsx';
import { appTheme } from './theme'; // Import your custom theme
import '@mantine/core/styles.css'; // Import Mantine global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. LOAD PREFERENCE BEFORE APP LOADS */}
    <ColorSchemeScript defaultColorScheme='dark' />

    {/* 2. PROVIDE THEME GLOBALLY */}
    <MantineProvider theme={appTheme} defaultColorScheme='dark'>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
