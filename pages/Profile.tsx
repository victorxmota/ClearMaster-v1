
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
    return `${first}${last}`.replace(/[^a-zA-Z0-9]/g, '');
  };

  const handleSave = async () => {
    if (!editEmail || !editPhone) {
      alert("Email and phone fields cannot be empty.");
      return;
    }
    
    setIsSaving(true);
    try {
      await Database.updateUser(user.id, { 
        email: editEmail, 
        phone: editPhone 
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
      // Recarrega para atualizar o contexto de autenticação com os dados novos
      window.location.reload();
    } catch (err: any) {
      console.error("Update profile error:", err);
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-brand-600 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-md">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <UserIcon size={64} />
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} className="mr-2" /> Edit Details
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X size={16} className="mr-2" /> Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-20 pb-8 px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-brand-600 font-medium">
              {user.role === UserRole.ADMIN ? 'Executive Administrator' : 'Cleaning Specialist'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg border transition-all ${isEditing ? 'bg-white border-brand-400 ring-2 ring-brand-50' : 'bg-gray-50 border-transparent'}`}>
              <div className="flex items-center space-x-3">
                <Mail className="text-gray-400" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Email Address</p>
                  {isEditing ? (
                    <input 
                      type="email" 
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-700" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border transition-all ${isEditing ? 'bg-white border-brand-400 ring-2 ring-brand-50' : 'bg-gray-50 border-transparent'}`}>
              <div className="flex items-center space-x-3">
                <Phone className="text-gray-400" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Contact Phone</p>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-brand-700" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-transparent flex items-center space-x-3">
              <CreditCard className="text-gray-400" size={18} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">PPS Number</p>
                <p className="font-semibold text-gray-800">{user.pps || 'Not provided'}</p>
              </div>
            </div>

            <div className="p-4 bg-brand-50 rounded-lg border border-brand-100 flex items-center space-x-3">
              <Shield className="text-brand-600" size={18} />
              <div>
                <p className="text-[10px] text-brand-600 uppercase font-bold tracking-widest mb-1">Digital Account ID</p>
                <p className="font-bold text-brand-900 font-mono">@{getAccountId(user.name)}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-tighter">UID: {user.id.slice(0, 8)}...</span>
            <Button variant="danger" size="sm" onClick={logout}>Terminate Session</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
