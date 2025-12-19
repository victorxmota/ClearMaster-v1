
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types.ts';
import { Database } from './services/database.ts';
import { auth, logoutFirebase } from './services/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Layout } from './components/Layout.tsx';
import { Login } from './pages/Login.tsx';
import { Agenda } from './pages/Agenda.tsx';
import { CheckIn } from './pages/CheckIn.tsx';
import { Reports } from './pages/Reports.tsx';
import { Profile } from './pages/Profile.tsx';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-600 w-12 h-12" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Verificando Segurança...</p>
        </div>
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
    if (!auth) {
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const appUser = await Database.syncUser(firebaseUser);
          setUser(appUser);
          setInitError(null);
        } catch (error: any) {
          console.error("Erro de sincronização:", error);
          setInitError("Falha na sincronização. Verifique a conexão.");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 text-center">
          <ShieldAlert className="text-red-600 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-black text-gray-900 mb-2">Sistema Offline</h1>
          <p className="text-gray-500">Configuração do Firebase ausente ou inválida.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user, isLoading }}>
      {initError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black animate-bounce">
          <AlertCircle size={16} />
          {initError}
        </div>
      )}
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/check-in" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}><CheckIn /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
