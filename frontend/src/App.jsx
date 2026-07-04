import React from 'react';
import Home from './pages/Home';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/ui/Toast';
import PullToRefresh from './components/layout/PullToRefresh';

function App() {
  return (
    <PullToRefresh>
      <ToastProvider>
        <Toast />
        <Home />
      </ToastProvider>
    </PullToRefresh>
  );
}

export default App;
