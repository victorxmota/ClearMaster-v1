
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { User, Phone, Mail, CreditCard, Shield, Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Database } from '../services/database';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local form state
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (user) {
      setEditEmail(user.email);
      setEditPhone(user.phone);
    }
  }, [user]);

  if (!user) return null;

  // Lógica para gerar o Account ID (Primeiro + Último nome)
  const getAccountId = (fullName: string) => {
    const names = fullName.trim().split(/\s+/);
    if (names.length === 0) return 'User';
    if (names.length === 1) return names[0];
    const first = names[0];
    const last = names[names.length - 1];
    return `${first}${last}`;
  };

  const handleSave = async () => {
    if (!editEmail || !editPhone) {
      alert("Email and Phone are required.");
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
      // Recarrega para refletir as mudanças que vêm do Firestore no App.tsx
      window.location.reload(); 
    } catch (error: any) {
      console.error("Error updating profile", error);
      alert(`Failed to update profile: ${error.message}`);
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
                <User size={64} />
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} className="mr-2" /> Edit Info
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-brand-600 font-medium mt-1">
                {user.role === UserRole.ADMIN ? 'System Administrator' : 'Cleaning Professional'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${isEditing ? 'bg-white border-brand-300 ring-2 ring-brand-100' : 'bg-gray-50 border-transparent'}`}>
              <Mail className="text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Official Email</p>
                {isEditing ? (
                  <input 
                    type="email"
                    className="w-full bg-transparent border-none p-0 mt-1 text-sm font-medium focus:ring-0 outline-none text-gray-800"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <p className="font-medium text-gray-800">{user.email}</p>
                )}
              </div>
            </div>

            <div className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${isEditing ? 'bg-white border-brand-300 ring-2 ring-brand-100' : 'bg-gray-50 border-transparent'}`}>
              <Phone className="text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contact Number</p>
                {isEditing ? (
                  <input 
                    type="tel"
                    className="w-full bg-transparent border-none p-0 mt-1 text-sm font-medium focus:ring-0 outline-none text-gray-800"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-gray-800">{user.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-transparent">
              <CreditCard className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">PPS Number</p>
                <p className="font-medium text-gray-800">{user.pps || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-brand-50 rounded-lg border border-brand-100 shadow-inner">
              <Shield className="text-brand-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-brand-600 uppercase font-bold tracking-wider">Account ID</p>
                <p className="font-bold text-brand-900 font-mono text-sm">@{getAccountId(user.name)}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-6">
            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-400 mb-6 italic">
              User Unique Reference: {user.id}
            </div>
            <Button variant="danger" onClick={logout} className="w-full md:w-auto">
              Logout System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
