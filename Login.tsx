import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../services/firebase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../App';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate('/');
  }

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'register' && !name) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Login/Register Error:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const darkInputStyle = "bg-brand-900/5 border-gray-200 focus:border-brand-500";

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-brand-100">
        <div className="bg-brand-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold">Downey Cleaning</h1>
          <p className="text-brand-100 mt-2">Professional Service Management</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={darkInputStyle}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={darkInputStyle}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={darkInputStyle}
              required
            />

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="h-12 shadow-lg">
              {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Login to Dashboard' : 'Create My Account')}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 font-medium">Alternative access</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg p-3 text-gray-700 hover:bg-gray-50 transition-all shadow-sm font-semibold"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};