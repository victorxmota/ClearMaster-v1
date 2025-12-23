
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { ScheduleItem, UserRole, User } from '../types';
import { Button } from '../components/ui/Button';
import { Calendar, Loader2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    const initData = async () => {
      if (isAdmin) {
        const allUsers = await Database.getAllUsers();
        const staff = allUsers.filter(u => u.role === UserRole.EMPLOYEE);
        setUsers(staff);
        if (staff.length > 0 && !selectedUser) setSelectedUser(staff[0].id);
      }
    };
    initData();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      loadSchedules(selectedUser);
    } else if (user && !isAdmin) {
      loadSchedules(user.id);
    }
  }, [selectedUser, user, isAdmin]);

  const loadSchedules = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await Database.getSchedulesByUser(userId);
      setSchedules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assigned Work Schedule</h2>
          <p className="text-gray-500">Weekly plan for professional services</p>
        </div>
        {isAdmin && (
          <select 
            className="border rounded-lg px-3 py-2 bg-white shadow-sm"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-brand-300 transition-colors">
              <div className="flex items-center space-x-2 mb-3 text-brand-600">
                <Calendar size={20} />
                <span className="font-bold text-lg">{DAYS[schedule.dayOfWeek]}</span>
              </div>
              <p className="font-bold text-gray-900 mb-1">{schedule.locationName}</p>
              <p className="text-xs text-gray-400 mb-4">{schedule.address}</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Service duration:</span>
                <span className="text-brand-700">{schedule.hoursPerDay}h planned</span>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="col-span-full bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
              No shifts assigned for this professional.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
