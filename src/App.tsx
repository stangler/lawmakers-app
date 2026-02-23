/**
 * Lawmakers App
 * メインアプリケーション（ルーティング付き）
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { JapanMap } from './components/JapanMap';
import { MemberPanel } from './components/MemberPanel';
import { NewsPanel } from './components/NewsPanel';
import { Header } from './components/Header';
import { useSingleSeatMembers, useProportionalMembers } from './hooks/useMembers';
import { useNewsData } from './hooks/useNewsData';
import { AuthProvider, useAuth, ProtectedRoute } from './components/AuthProvider';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Verify } from './pages/Verify';

// ============================================
// Home Component (Main App Content)
// ============================================

function Home(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'single-seat' | 'proportional'>('single-seat');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const { members, isLoading: loadingSingle, error: errorSingle } = useSingleSeatMembers();
  const { members: proportionalMembers, isLoading: loadingProp, error: errorProp } = useProportionalMembers();

  // News data
  const {
    filteredNews,
    isLoading: loadingNews,
    error: errorNews,
    lastUpdated,
    refresh,
    filterByCategory,
    selectedCategory,
  } = useNewsData();

  const isLoading = loadingSingle || loadingProp;
  const error = errorSingle || errorProp;
  const totalCount = members.length + proportionalMembers.length;

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-cyan-400 text-xl">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">エラー: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900">
      <Header
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          setSelectedPrefecture(null);
          setSelectedBlock(null);
        }}
        totalCount={totalCount}
      />
      
      {/* User info bar */}
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-sm">
        <span className="text-gray-400">
          ログイン中: <span className="text-cyan-400">{user?.email}</span>
        </span>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ログアウト
        </button>
      </div>
      
      <div className="flex flex-1 min-h-0">
        {/* Map area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <JapanMap
            members={members}
            proportionalMembers={proportionalMembers}
            selectedPrefecture={selectedPrefecture}
            onSelectPrefecture={setSelectedPrefecture}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            mode={mode}
            news={filteredNews}
          />
        </div>

        {/* Member panel */}
        <MemberPanel
          selectedPrefecture={selectedPrefecture}
          selectedBlock={selectedBlock}
          members={members}
          proportionalMembers={proportionalMembers}
          mode={mode}
          news={filteredNews}
        />

        {/* News panel */}
        <NewsPanel
          news={filteredNews}
          isLoading={loadingNews}
          error={errorNews}
          lastUpdated={lastUpdated}
          selectedCategory={selectedCategory}
          onCategoryChange={filterByCategory}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

// ============================================
// Auth Page Wrapper
// ============================================

function AuthPage(): React.ReactElement {
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = (): void => {
    navigate('/');
  };

  const handleSwitchToSignup = (): void => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = (): void => {
    setIsLogin(true);
  };

  if (isLogin) {
    return (
      <Login
        onSwitchToSignup={handleSwitchToSignup}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <Signup
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
}

// ============================================
// App with Routing
// ============================================

function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/verify" element={<Verify />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute
            fallback={<Navigate to="/login" replace />}
          >
            <Home />
          </ProtectedRoute>
        }
      />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================
// Main App Component
// ============================================

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;