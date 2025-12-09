import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">CleanMaster Pro</h1>
          <p className="text-gray-500 mt-2">Cleaning Service Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ex: john@clean.com"
            className="bg-slate-800 text-white border-slate-700 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••"
            className="bg-slate-800 text-white border-slate-700 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth size="lg">
            Login
          </Button>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Admin: admin@clean.com / 123</p>
            <p>User: john@clean.com / 123</p>
          </div>
        </form>
      </div>
    </div>
  );
};