import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { User, Phone, Mail, CreditCard, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-brand-600 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-md">
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <User size={64} />
              </div>
            </div>
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
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase">PPS (Social Number)</p>
                <p className="font-medium">{user.pps}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Shield className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase">User ID</p>
                <p className="font-medium text-sm font-mono">{user.id}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <Button variant="danger" onClick={logout} className="w-full md:w-auto">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};