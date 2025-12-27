import React from 'react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { User, Phone, Mail, CreditCard, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
        <p className="text-brand-500 font-bold uppercase text-sm">{user.role}</p>
        
        <div className="mt-8 space-y-4">
           <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
             <Mail className="text-brand-600" />
             <span>{user.email}</span>
           </div>
        </div>

        <Button variant="danger" onClick={logout} className="mt-8 w-full">Logout</Button>
      </div>
    </div>
  );
};