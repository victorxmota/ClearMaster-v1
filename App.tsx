import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { Database } from './services/database';
import { auth, logoutFirebase } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Agenda } from './pages/Agenda';
import { CheckIn } from './pages/CheckIn';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-600 w-12 h-12" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await Database.syncUser(firebaseUser);
          setUser(appUser);
          setInitError(null);
        } catch (error: any) {
          console.error("Failed to sync user", error);
          setInitError("Error syncing data. Check console for details.");
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutFirebase();
    setUser(null);
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-red-100">
            <ShieldAlert className="text-red-600 w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Initialization Error</h1>
            <p className="text-gray-600">Could not connect to Firebase. Please check your configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user, isLoading }}>
      {initError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-bounce">
          <AlertCircle size={18} />
          {initError}
        </div>
      )}
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          } />
          
          <Route path="/check-in" element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
              <CheckIn />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;