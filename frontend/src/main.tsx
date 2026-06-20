import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b', // Slate-800 (Dark Blue/Grey)
            color: '#ffffff', 
            border: '1px solid #334155', // Slate-700
            borderRadius: '8px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'white' }, // Green theme
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'white' }, // Red theme
          },
        }}
      />
  </StrictMode>,
);
