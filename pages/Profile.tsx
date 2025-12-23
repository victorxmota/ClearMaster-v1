
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
      setEditEmail(user.email);
      setEditPhone(user.phone);
    }
  }, [user]);

  if (!user) return null;

  // Lógica de Account ID: @PrimeiroNomeUltimoNome
  const getAccountId = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return 'User';
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const last = parts[parts.length - 1];
    // Remove caracteres especiais e concatena
    return `${first}${last}`.replace(/[^a-zA-Z0-9]/g, '');
  };

  const handleSave = async () => {
    if (!editEmail || !editPhone) {
      alert("Email and phone fields are mandatory.");
      return;
    }
    
    setIsSaving(true);
    try {
      await Database.updateUser(user.id, { 
        email: editEmail, 
        phone: editPhone 
      });
      alert('Your professional profile has been updated.');
      setIsEditing(false);
      // Força recarregamento para sincronizar o AuthContext
      window.location.reload();
    } catch (err: any) {
      console.error("Profile update error:", err);
      alert(`Could not update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-900 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg border-4 border-white">
              <div className="w-full h-full bg-brand-50 rounded-full flex items-center justify-center text-brand-300">
                <UserIcon size={64} />
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Edit2 size={16} className="mr-2" /> Modify Profile
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
        
        <div className="pt-20 pb-10 px-10">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="bg-brand-100 text-brand-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest">
                {user.role === UserRole.ADMIN ? 'System Administrator' : 'Cleaning Specialist'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-xl border transition-all duration-300 ${isEditing ? 'bg-white border-brand-500 ring-4 ring-brand-50 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Mail className="text-brand-500" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Corporate Email</p>
                  {isEditing ? (
                    <input 
                      type="email" 
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-900 placeholder-gray-300" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      autoFocus
                    />
                  ) : (
                    <p className="font-bold text-gray-800 text-sm">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl border transition-all duration-300 ${isEditing ? 'bg-white border-brand-500 ring-4 ring-brand-50 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Phone className="text-brand-500" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Phone Number</p>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-900 placeholder-gray-300" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+353 00 000 0000"
                    />
                  ) : (
                    <p className="font-bold text-gray-800 text-sm">{user.phone || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <CreditCard className="text-gray-400" size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">PPS Verification</p>
                <p className="font-bold text-gray-800 text-sm">{user.pps || 'Pending'}</p>
              </div>
            </div>

            <div className="p-5 bg-brand-50 rounded-xl border border-brand-100 flex items-center space-x-4 shadow-sm">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Shield className="text-brand-600" size={20} />
              </div>
              <div>
                <p className="text-[10px] text-brand-600 uppercase font-black tracking-widest mb-1">Account Handle</p>
                <p className="font-black text-brand-900 font-mono text-sm">@{getAccountId(user.name)}</p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono uppercase tracking-widest">Internal ID: {user.id.toUpperCase()}</span>
            <Button variant="danger" size="sm" onClick={logout} className="px-8 py-2.5 rounded-full font-black text-xs tracking-widest uppercase">
              Sign Out System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
