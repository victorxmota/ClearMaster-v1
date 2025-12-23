import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/firebase';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Failed to login with Google. Please check your Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">Downey Cleaning</h1>
          <p className="text-gray-500 mt-2">Professional Service Management</p>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg p-3 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all shadow-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent animate-spin rounded-full mr-3"></div>
            ) : (
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-6 h-6 mr-3"
              />
            )}
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </button>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="text-center text-xs text-gray-400 mt-6 pt-6 border-t">
            <p>Access restricted to Downey Cleaning authorized personnel.</p>
          </div>
        </div>
      </div>
    </div>
  );
};