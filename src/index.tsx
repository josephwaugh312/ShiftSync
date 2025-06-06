import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import './styles/index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA functionality
try {
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log('ShiftSync PWA: App cached successfully for offline use');
    },
    onUpdate: () => {
      console.log('ShiftSync PWA: New version available, refresh to update');
    }
  });
} catch (error) {
  console.debug('Service worker registration failed:', error);
} 