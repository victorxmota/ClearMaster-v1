
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { ScheduleItem, UserRole, User } from '../types';
import { Button } from '../components/ui/Button';
import { Calendar, Loader2, MapPin, Clock } from 'lucide-react';

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
        try {
          const allUsers = await Database.getAllUsers();
          const staff = allUsers.filter(u => u.role === UserRole.EMPLOYEE);
          setUsers(staff);
          if (staff.length > 0 && !selectedUser) setSelectedUser(staff[0].id);
        } catch (e) {
          console.error("Failed to load staff list", e);
        }
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
      console.error("Failed to load work schedule", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Work Assignments</h2>
          <p className="text-gray-500 font-medium">Your weekly professional cleaning schedule</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
            <span className="text-xs font-bold text-gray-400 uppercase px-2">Professional:</span>
            <select 
              className="border-none rounded-lg px-4 py-2 bg-gray-50 font-bold text-sm focus:ring-0 outline-none"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <Loader2 className="animate-spin text-brand-600" size={48} />
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Retrieving schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 text-brand-600">
                  <div className="bg-brand-50 p-2 rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Calendar size={20} />
                  </div>
                  <span className="font-black text-xl tracking-tight">{DAYS[schedule.dayOfWeek]}</span>
                </div>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100">Confirmed</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-300 mt-1" size={18} />
                  <div>
                    <p className="font-black text-gray-900 leading-tight">{schedule.locationName}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">{schedule.address}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock size={16} />
                    <span className="text-sm font-bold uppercase tracking-widest">Allocation</span>
                  </div>
                  <span className="text-lg font-black text-brand-700">{schedule.hoursPerDay} Hours</span>
                </div>
              </div>
            </div>
          ))}
          
          {schedules.length === 0 && (
            <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Calendar className="text-gray-200" size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Shifts Assigned</h3>
              <p className="text-gray-300 mt-2 font-medium">Please contact the administrator to receive your weekly schedule.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
