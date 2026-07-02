import React from 'react';
import Home from './pages/Home';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/ui/Toast';

function App() {
  return (
    <ToastProvider>
      <Toast />
      <Home />
    </ToastProvider>
  );
}

export default App;
