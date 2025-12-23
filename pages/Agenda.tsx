
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { ScheduleItem, UserRole, User, Office, OfficeScheduleConfig } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trash2, Calendar, Clock, MapPin, Building2, Save, X, CheckSquare, Square, Loader2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<'schedule' | 'offices'>('schedule');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingOffice, setIsAddingOffice] = useState(false);

  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({ hoursPerDay: 4 });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [newOffice, setNewOffice] = useState({
    name: '', eircode: '', address: '',
    configs: DAYS.map((_, index) => ({ dayOfWeek: index, hours: 0, isActive: false }))
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      if (isAdmin) {
        const allUsers = await Database.getAllUsers();
        setUsers(allUsers.filter(u => u.role === UserRole.EMPLOYEE));
      }
      const allOffices = await Database.getOffices();
      setOffices(allOffices);
      setIsLoading(false);
    };
    initData();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) loadSchedules(selectedUser);
  }, [selectedUser]);

  const loadSchedules = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await Database.getSchedulesByUser(userId);
      setSchedules(data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.locationName || !newSchedule.address || selectedDays.length === 0) {
      alert("Please fill all required fields.");
      return;
    }
    const targetUserId = isAdmin ? selectedUser : user?.id;
    if (!targetUserId) return;
    setIsLoading(true);
    for (const dayIndex of selectedDays) {
      await Database.addSchedule({
        userId: targetUserId,
        locationName: newSchedule.locationName!,
        address: newSchedule.address!,
        dayOfWeek: dayIndex,
        hoursPerDay: Number(newSchedule.hoursPerDay)
      });
    }
    await loadSchedules(targetUserId);
    setIsAddingSchedule(false);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{viewMode === 'schedule' ? 'Work Schedule' : 'Office Management'}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
            {isAdmin && selectedUser && viewMode === 'schedule' && (
              <select className="border rounded-md px-3 py-2 bg-white" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            <Button onClick={() => setIsAddingSchedule(!isAddingSchedule)}>Assign Shift</Button>
        </div>
      </header>

      {/* Tabela de horários e listagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
            <div className="flex items-center space-x-2 mb-3 text-brand-600">
              <Calendar size={20} />
              <span className="font-semibold text-lg">{DAYS[schedule.dayOfWeek]}</span>
            </div>
            <p className="font-medium text-gray-900">{schedule.locationName}</p>
            <p className="text-sm text-gray-500">{schedule.hoursPerDay} hours planned</p>
          </div>
        ))}
      </div>
    </div>
  );
};
