import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { validateEnvironment } from './utils/envValidation';
import { StartupEnvGuard } from './components/system/StartupEnvGuard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const env = validateEnvironment();

if (env.warnings.length > 0) {
  console.warn('Environment warnings:', env.warnings);
}

root.render(
  <React.StrictMode>
    {!env.ok ? (
      <StartupEnvGuard errors={env.errors} warnings={env.warnings} />
    ) : (
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )}
  </React.StrictMode>
);
