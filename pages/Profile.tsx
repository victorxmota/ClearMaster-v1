
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User as UserIcon, Phone, Mail, CreditCard, Shield, Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Database } from '../services/database';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (user) {
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  if (!user) return null;

  // Lógica de Account ID: @PrimeiroNomeUltimoNome
  const getAccountId = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '@User';
    if (parts.length === 1) return `@${parts[0]}`;
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `@${first}${last}`.replace(/[^a-zA-Z0-9@]/g, '');
  };

  const handleSave = async () => {
    if (!editEmail || !editPhone) {
      alert("Email and phone are required for professional contact.");
      return;
    }
    
    setIsSaving(true);
    try {
      await Database.updateUser(user.id, { 
        email: editEmail, 
        phone: editPhone 
      });
      setIsEditing(false);
      // Recarrega para sincronizar com o AuthContext global
      window.location.reload();
    } catch (err: any) {
      console.error("Profile update error:", err);
      alert("Could not update profile information.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Banner */}
        <div className="bg-brand-900 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-brand-50 rounded-full flex items-center justify-center text-brand-300">
                <UserIcon size={64} />
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Edit2 size={16} className="mr-2" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X size={16} />
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="pt-20 pb-10 px-10">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-brand-100 text-brand-700 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {user.role === UserRole.ADMIN ? 'Administrator' : 'Professional Staff'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-xl border transition-all ${isEditing ? 'bg-white border-brand-500 shadow-inner ring-4 ring-brand-50' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-3 text-gray-400 mb-2">
                <Mail size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Corporate Email</span>
              </div>
              {isEditing ? (
                <input 
                  type="email" 
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-900" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoFocus
                />
              ) : (
                <p className="font-bold text-gray-800 text-sm">{user.email}</p>
              )}
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isEditing ? 'bg-white border-brand-500 shadow-inner ring-4 ring-brand-50' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-3 text-gray-400 mb-2">
                <Phone size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Phone Contact</span>
              </div>
              {isEditing ? (
                <input 
                  type="tel" 
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-900" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              ) : (
                <p className="font-bold text-gray-800 text-sm">{user.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-3 text-gray-400 mb-2">
                <CreditCard size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">PPS Registration</span>
              </div>
              <p className="font-bold text-gray-800 text-sm">{user.pps || 'Verified System'}</p>
            </div>

            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <div className="flex items-center space-x-3 text-brand-600 mb-2">
                <Shield size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Professional Account ID</span>
              </div>
              <p className="font-black text-brand-900 font-mono text-sm">{getAccountId(user.name)}</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono">UID: {user.id.toUpperCase()}</span>
            <Button variant="danger" size="sm" onClick={logout} className="px-10">
              Sign Out Securely
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
