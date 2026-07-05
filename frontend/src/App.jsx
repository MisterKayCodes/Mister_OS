import React, { useState, useEffect } from 'react';
import NotesApp from './pages/Home';
import Dashboard from './pages/Dashboard';
import FinanceApp from './pages/Finance';
import LeadsApp from './pages/Leads';
import KnowledgeApp from './pages/Knowledge';
import TasksApp from './pages/Tasks';
import OmniChat from './components/features/OmniChat';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/ui/Toast';
import PullToRefresh from './components/layout/PullToRefresh';
import { ThemeProvider } from './context/ThemeContext';
import AuthScreen from './components/layout/AuthScreen';

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem("master_token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [currentApp, setCurrentApp] = useState(() => sessionStorage.getItem('mister_activeApp') || 'dashboard');

  useEffect(() => {
    sessionStorage.setItem('mister_activeApp', currentApp);
  }, [currentApp]);

  const handleLogin = (newToken) => {
    localStorage.setItem("master_token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("master_token");
    setToken("");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  const navigate = (app) => setCurrentApp(app);
  const goHome = () => navigate('dashboard');

  return (
    <PullToRefresh>
      <div className="w-full h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        {currentApp === 'dashboard' && <Dashboard onNavigate={navigate} onLogout={handleLogout} token={token} />}
        {currentApp === 'notes' && <NotesApp onBack={goHome} token={token} />}
        {currentApp === 'finance' && <FinanceApp onBack={goHome} token={token} />}
        {currentApp === 'warroom' && <LeadsApp onBack={goHome} token={token} />}
        {currentApp === 'knowledge' && <KnowledgeApp onBack={goHome} token={token} />}
        {currentApp === 'tasks' && <TasksApp onBack={goHome} token={token} />}
        {currentApp === 'omnichat' && <OmniChat onBack={goHome} token={token} />}
      </div>
    </PullToRefresh>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Toast />
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
