
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../services/firebase.ts';
import { Input } from '../components/ui/Input.tsx';
import { Button } from '../components/ui/Button.tsx';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../App.tsx';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redireciona se já estiver autenticado
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
      setError('Falha na autenticação Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
      console.error("Erro de Auth:", err);
      setError(err.message || 'Erro ao processar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const darkInputStyle = "bg-brand-900/5 border-gray-200 focus:border-brand-500";

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-100">
        <div className="bg-brand-600 p-10 text-white text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Downey Staff</h1>
          <p className="text-brand-100 mt-2 text-[10px] font-black tracking-widest uppercase">Portal de Acesso</p>
        </div>

        <div className="p-10">
          <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase transition-all ${mode === m ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {m === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
                {m === 'login' ? 'Entrar' : 'Registrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Nome Completo"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className={darkInputStyle}
                required
              />
            )}

            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="nome@downey.ie"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className={darkInputStyle}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className={darkInputStyle}
              required
            />

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[10px] font-black uppercase text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="h-14 text-sm font-black uppercase tracking-widest shadow-xl">
              {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Acessar Dashboard' : 'Finalizar Cadastro')}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="px-3 bg-white text-gray-400 tracking-widest">OU</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white border-2 border-gray-100 rounded-xl p-4 text-gray-700 hover:bg-gray-50 transition-all font-black text-xs uppercase tracking-tight shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
            Continuar com Google
          </button>
        </div>
      </div>
    </div>
  );
};
