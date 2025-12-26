import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
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

  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    hoursPerDay: 4
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [newOffice, setNewOffice] = useState<{
    name: string;
    eircode: string;
    address: string;
    configs: OfficeScheduleConfig[];
  }>({
    name: '',
    eircode: '',
    address: '',
    configs: DAYS.map((_, index) => ({ dayOfWeek: index, hours: 0, isActive: false }))
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      if (isAdmin) {
        const allUsers = await Database.getAllUsers();
        setUsers(allUsers.filter(u => u.role === UserRole.EMPLOYEE));
        const allOffices = await Database.getOffices();
        setOffices(allOffices);
      } else {
        // Load offices for employees too, to use in dropdown
        const allOffices = await Database.getOffices();
        setOffices(allOffices);
      }
      setIsLoading(false);
    };
    initData();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      loadSchedules(selectedUser);
    }
  }, [selectedUser]);

  const loadSchedules = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await Database.getSchedulesByUser(userId);
      setSchedules(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const loadOffices = async () => {
    const data = await Database.getOffices();
    setOffices(data);
  };

  const calculateWeeklyHours = () => {
    return schedules.reduce((acc, curr) => acc + curr.hoursPerDay, 0);
  };

  const toggleScheduleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.locationName || !newSchedule.address) {
      alert("Location and Address are required");
      return;
    }
    if (selectedDays.length === 0) {
      alert("Please select at least one day of the week.");
      return;
    }

    const targetUserId = isAdmin ? selectedUser : user?.id;
    if (!targetUserId) return;

    setIsLoading(true);
    for (const dayIndex of selectedDays) {
      const item: any = {
        userId: targetUserId,
        locationName: newSchedule.locationName!,
        address: newSchedule.address!,
        dayOfWeek: dayIndex,
        hoursPerDay: Number(newSchedule.hoursPerDay)
      };
      await Database.addSchedule(item);
    }

    await loadSchedules(targetUserId);
    setIsAddingSchedule(false);
    setNewSchedule({ hoursPerDay: 4, locationName: '', address: '' });
    setSelectedDays([]);
    setIsLoading(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this schedule?')) {
      setIsLoading(true);
      await Database.deleteSchedule(id);
      const targetUserId = isAdmin ? selectedUser : user?.id;
      if (targetUserId) await loadSchedules(targetUserId);
      setIsLoading(false);
    }
  };

  const handleOfficeConfigChange = (dayIndex: number, field: 'isActive' | 'hours', value: any) => {
    const updatedConfigs = [...newOffice.configs];
    if (field === 'isActive') {
      updatedConfigs[dayIndex].isActive = value;
      if (value && updatedConfigs[dayIndex].hours === 0) {
        updatedConfigs[dayIndex].hours = 2;
      }
    } else {
      updatedConfigs[dayIndex].hours = Number(value);
    }
    setNewOffice({ ...newOffice, configs: updatedConfigs });
  };

  const handleRegisterOffice = async () => {
    if (!newOffice.name || !newOffice.address) {
      alert("Name and Address are required.");
      return;
    }

    setIsLoading(true);
    const office: any = {
      name: newOffice.name,
      eircode: newOffice.eircode,
      address: newOffice.address,
      defaultSchedule: newOffice.configs.filter(c => c.isActive)
    };

    await Database.addOffice(office);
    await loadOffices();
    setIsAddingOffice(false);
    setNewOffice({
      name: '',
      eircode: '',
      address: '',
      configs: DAYS.map((_, index) => ({ dayOfWeek: index, hours: 0, isActive: false }))
    });
    setIsLoading(false);
  };

  const handleDeleteOffice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this office?')) {
      setIsLoading(true);
      await Database.deleteOffice(id);
      await loadOffices();
      setIsLoading(false);
    }
  };

  const handleOfficeSelectForSchedule = (officeId: string) => {
    const office = offices.find(o => o.id === officeId);
    if (office) {
      setNewSchedule({
        ...newSchedule,
        locationName: office.name,
        address: office.address
      });
    }
  };

  if (isLoading && schedules.length === 0 && offices.length === 0) {
      return (
        <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {viewMode === 'schedule' ? 'Work Schedule' : 'Office Management'}
          </h2>
          <p className="text-gray-500">
            {viewMode === 'schedule' ? 'Manage assignments' : 'Register and manage locations'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {viewMode === 'schedule' ? (
               <>
                {isAdmin && (
                  <select 
                    className="border rounded-md px-3 py-2 bg-white"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}
                <Button onClick={() => setIsAddingSchedule(!isAddingSchedule)}>
                  {isAddingSchedule ? 'Cancel' : 'Assign Shift'}
                </Button>
                
                {isAdmin && (
                  <Button variant="secondary" onClick={() => setViewMode('offices')}>
                    <Building2 size={18} className="mr-2" />
                    Manage Offices
                  </Button>
                )}
               </>
            ) : (
               <>
                <Button onClick={() => setIsAddingOffice(!isAddingOffice)}>
                   {isAddingOffice ? 'Cancel' : 'Register Office'}
                </Button>
                <Button variant="secondary" onClick={() => setViewMode('schedule')}>
                  <Calendar size={18} className="mr-2" />
                  View Schedule
                </Button>
               </>
            )}
        </div>
      </header>

      {viewMode === 'offices' && isAdmin && (
        <div className="space-y-6 animate-fade-in">
          {isAddingOffice && (
             <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Register New Office</h3>
                  <button onClick={() => setIsAddingOffice(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Input 
                    label="Office Name" 
                    value={newOffice.name}
                    onChange={(e) => setNewOffice({...newOffice, name: e.target.value})}
                  />
                  <Input 
                    label="Eircode" 
                    value={newOffice.eircode}
                    onChange={(e) => setNewOffice({...newOffice, eircode: e.target.value})}
                  />
                  <Input 
                    label="Address" 
                    value={newOffice.address}
                    onChange={(e) => setNewOffice({...newOffice, address: e.target.value})}
                  />
                </div>

                <div className="border-t pt-4">
                   <h4 className="font-medium text-gray-700 mb-3">Working Days & Hours Configuration</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {newOffice.configs.map((config, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${config.isActive ? 'bg-brand-50 border-brand-300' : 'bg-gray-50 border-gray-200'}`}>
                          <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4"
                              checked={config.isActive}
                              onChange={(e) => handleOfficeConfigChange(index, 'isActive', e.target.checked)}
                            />
                            <span className={`font-medium ${config.isActive ? 'text-brand-800' : 'text-gray-500'}`}>{DAYS[index]}</span>
                          </label>
                          {config.isActive && (
                            <div className="flex items-center gap-2">
                               <Clock size={16} className="text-brand-500" />
                               <input 
                                  type="number" 
                                  min="0.5" 
                                  step="0.5"
                                  className="w-full p-1 text-sm border rounded"
                                  value={config.hours}
                                  onChange={(e) => handleOfficeConfigChange(index, 'hours', e.target.value)}
                                />
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <Button onClick={handleRegisterOffice} disabled={isLoading}>
                     {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2" />}
                     Save Office
                   </Button>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map((office) => (
              <div key={office.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group">
                <button 
                  onClick={() => handleDeleteOffice(office.id)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex items-start space-x-3 mb-4">
                   <div className="bg-brand-100 p-2 rounded-lg text-brand-600"><Building2 size={24} /></div>
                   <div>
                      <h3 className="font-bold text-gray-900">{office.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{office.eircode}</p>
                   </div>
                </div>
                <div className="text-sm text-gray-600 mb-4 flex items-start gap-2">
                   <MapPin size={16} className="mt-0.5 text-gray-400" />
                   {office.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'schedule' && (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Weekly Hours</h3>
            </div>
            <div className="text-3xl font-bold text-brand-600">{calculateWeeklyHours()}h</div>
          </div>

          {isAddingSchedule && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 animate-fade-in text-white shadow-xl">
              <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-lg">{isAdmin ? 'Assign Schedule' : 'Add Schedule'}</h3>
                 <button onClick={() => setIsAddingSchedule(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              
              {offices.length > 0 && (
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">Select Registered Office</label>
                   <select 
                      className="w-full rounded-md border-slate-600 bg-slate-700 text-white p-2"
                      onChange={(e) => handleOfficeSelectForSchedule(e.target.value)}
                   >
                     <option value="">-- Choose --</option>
                     {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                   </select>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                  <select 
                    className="w-full rounded-md border-slate-600 bg-slate-700 text-white p-2"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Location Name" value={newSchedule.locationName || ''} onChange={e => setNewSchedule({...newSchedule, locationName: e.target.value})} className="bg-slate-700 text-white border-slate-600" />
                <Input label="Address" value={newSchedule.address || ''} onChange={e => setNewSchedule({...newSchedule, address: e.target.value})} className="bg-slate-700 text-white border-slate-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                   {DAYS.map((day, idx) => (
                     <button
                       key={idx}
                       onClick={() => toggleScheduleDay(idx)}
                       className={`flex items-center space-x-2 px-3 py-2 rounded-md border text-sm ${selectedDays.includes(idx) ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                     >
                       {selectedDays.includes(idx) ? <CheckSquare size={16} /> : <Square size={16} />}
                       <span>{day.substring(0, 3)}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="w-1/3">
                <Input label="Hours" type="number" min="1" value={newSchedule.hoursPerDay} onChange={e => setNewSchedule({...newSchedule, hoursPerDay: Number(e.target.value)})} className="bg-slate-700 text-white border-slate-600" />
              </div>

              <Button onClick={handleAddSchedule} fullWidth disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Confirm
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
                {(isAdmin || user?.id === schedule.userId) && (
                  <button onClick={() => handleDeleteSchedule(schedule.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="flex items-center space-x-2 mb-3 text-brand-600">
                  <Calendar size={20} />
                  <span className="font-semibold text-lg">{DAYS[schedule.dayOfWeek]}</span>
                </div>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-start space-x-2">
                    <MapPin size={18} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{schedule.locationName}</p>
                      <p className="text-sm text-gray-500">{schedule.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={18} />
                    <span>{schedule.hoursPerDay} hours planned</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};