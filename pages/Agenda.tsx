import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { MockDB } from '../services/mockDatabase';
import { ScheduleItem, UserRole, User, Office, OfficeScheduleConfig } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Calendar, Clock, MapPin, Building2, Save, X, CheckSquare, Square } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  
  // State for toggling views
  const [viewMode, setViewMode] = useState<'schedule' | 'offices'>('schedule');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingOffice, setIsAddingOffice] = useState(false);

  // Form State for New Schedule
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    hoursPerDay: 4
  });
  // Multi-select for days
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Form State for New Office (Registering Location)
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
    if (isAdmin) {
      setUsers(MockDB.getUsers().filter(u => u.role === UserRole.EMPLOYEE));
      loadOffices();
    }
    
    // If admin changes selectedUser dropdown, load that user's schedule
    // If employee, selectedUser is effectively their own ID (set in initial state)
    if (selectedUser) {
      loadSchedules(selectedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedUser, isAdmin]);

  const loadSchedules = (userId: string) => {
    setSchedules(MockDB.getSchedulesByUser(userId));
  };

  const loadOffices = () => {
    setOffices(MockDB.getOffices());
  };

  const calculateWeeklyHours = () => {
    return schedules.reduce((acc, curr) => acc + curr.hoursPerDay, 0);
  };

  // --- Schedule Handlers ---

  const toggleScheduleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const handleAddSchedule = () => {
    if (!newSchedule.locationName || !newSchedule.address) {
      alert("Location and Address are required");
      return;
    }

    if (selectedDays.length === 0) {
      alert("Please select at least one day of the week.");
      return;
    }

    // Identify target user: Admin uses dropdown state, Employee uses their own ID
    const targetUserId = isAdmin ? selectedUser : user?.id;

    if (!targetUserId) return;

    // Create a schedule item for EACH selected day
    selectedDays.forEach(dayIndex => {
      const item: ScheduleItem = {
        id: Date.now().toString() + Math.random().toString(), // Ensure unique ID
        userId: targetUserId,
        locationName: newSchedule.locationName!,
        address: newSchedule.address!,
        dayOfWeek: dayIndex,
        hoursPerDay: Number(newSchedule.hoursPerDay)
      };
      MockDB.addSchedule(item);
    });

    loadSchedules(targetUserId);
    setIsAddingSchedule(false);
    // Reset form
    setNewSchedule({ hoursPerDay: 4, locationName: '', address: '' });
    setSelectedDays([]);
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm('Are you sure you want to remove this schedule?')) {
      MockDB.deleteSchedule(id);
      // Reload based on who we are viewing
      const targetUserId = isAdmin ? selectedUser : user?.id;
      if (targetUserId) loadSchedules(targetUserId);
    }
  };

  // --- Office Handlers ---

  const handleOfficeConfigChange = (dayIndex: number, field: 'isActive' | 'hours', value: any) => {
    const updatedConfigs = [...newOffice.configs];
    if (field === 'isActive') {
      updatedConfigs[dayIndex].isActive = value;
      // Default to 2 hours if enabled and was 0
      if (value && updatedConfigs[dayIndex].hours === 0) {
        updatedConfigs[dayIndex].hours = 2;
      }
    } else {
      updatedConfigs[dayIndex].hours = Number(value);
    }
    setNewOffice({ ...newOffice, configs: updatedConfigs });
  };

  const handleRegisterOffice = () => {
    if (!newOffice.name || !newOffice.address) {
      alert("Name and Address are required.");
      return;
    }

    const office: Office = {
      id: Date.now().toString(),
      name: newOffice.name,
      eircode: newOffice.eircode,
      address: newOffice.address,
      defaultSchedule: newOffice.configs.filter(c => c.isActive)
    };

    MockDB.addOffice(office);
    loadOffices();
    setIsAddingOffice(false);
    // Reset form
    setNewOffice({
      name: '',
      eircode: '',
      address: '',
      configs: DAYS.map((_, index) => ({ dayOfWeek: index, hours: 0, isActive: false }))
    });
  };

  const handleDeleteOffice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this office?')) {
      MockDB.deleteOffice(id);
      loadOffices();
    }
  };

  // When adding a schedule manually, selecting an office prefills data
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
                {/* Available for both Admin and Employee now */}
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

      {/* --- OFFICE MANAGEMENT VIEW (Admin Only) --- */}
      {viewMode === 'offices' && isAdmin && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Add Office Form */}
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
                    placeholder="e.g. Matt Blarney Castle"
                    value={newOffice.name}
                    onChange={(e) => setNewOffice({...newOffice, name: e.target.value})}
                  />
                  <Input 
                    label="Eircode" 
                    placeholder="e.g. A65 F4E2"
                    value={newOffice.eircode}
                    onChange={(e) => setNewOffice({...newOffice, eircode: e.target.value})}
                  />
                  <Input 
                    label="Address" 
                    placeholder="Full Address"
                    value={newOffice.address}
                    onChange={(e) => setNewOffice({...newOffice, address: e.target.value})}
                  />
                </div>

                <div className="border-t pt-4">
                   <h4 className="font-medium text-gray-700 mb-3">Working Days & Hours Configuration</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {newOffice.configs.map((config, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border transition-colors ${config.isActive ? 'bg-brand-50 border-brand-300' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-brand-600 rounded"
                                  checked={config.isActive}
                                  onChange={(e) => handleOfficeConfigChange(index, 'isActive', e.target.checked)}
                                />
                                <span className={`font-medium ${config.isActive ? 'text-brand-800' : 'text-gray-500'}`}>
                                  {DAYS[index]}
                                </span>
                             </label>
                          </div>
                          {config.isActive && (
                            <div className="flex items-center gap-2">
                               <Clock size={16} className="text-brand-500" />
                               <input 
                                  type="number" 
                                  min="0.5" 
                                  step="0.5"
                                  className="w-full p-1 text-sm border rounded bg-white"
                                  value={config.hours}
                                  onChange={(e) => handleOfficeConfigChange(index, 'hours', e.target.value)}
                                />
                                <span className="text-xs text-gray-500">hrs</span>
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <Button onClick={handleRegisterOffice}>
                     <Save size={18} className="mr-2" />
                     Save Office
                   </Button>
                </div>
             </div>
          )}

          {/* List Offices */}
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
                   <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                      <Building2 size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">{office.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{office.eircode}</p>
                   </div>
                </div>

                <div className="text-sm text-gray-600 mb-4 flex items-start gap-2">
                   <MapPin size={16} className="mt-0.5 text-gray-400" />
                   {office.address}
                </div>

                <div className="border-t pt-3">
                   <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Schedule Requirements</p>
                   <div className="space-y-1">
                      {office.defaultSchedule.length > 0 ? (
                        office.defaultSchedule.map((s) => (
                          <div key={s.dayOfWeek} className="flex justify-between text-sm">
                             <span className="text-gray-700">{DAYS[s.dayOfWeek]}</span>
                             <span className="font-medium text-brand-600">{s.hours}h</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No days configured</p>
                      )}
                   </div>
                </div>
              </div>
            ))}
            {offices.length === 0 && !isAddingOffice && (
              <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                No offices registered yet. Click "Register Office" to start.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SCHEDULE ASSIGNMENT VIEW --- */}
      {viewMode === 'schedule' && (
        <>
          {/* Stats Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Weekly Hours</h3>
              <p className="text-sm text-gray-500">Based on planned schedule</p>
            </div>
            <div className="text-3xl font-bold text-brand-600">
              {calculateWeeklyHours()}h
            </div>
          </div>

          {/* Add Schedule Form (Available to Admin and Employees now) */}
          {isAddingSchedule && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 animate-fade-in text-white shadow-xl">
              <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-lg">
                    {isAdmin ? 'Assign Schedule to Employee' : 'Add to My Schedule'}
                 </h3>
                 <button onClick={() => setIsAddingSchedule(false)} className="text-gray-400 hover:text-white">
                    <X size={20}/>
                 </button>
              </div>
              
              {/* Quick Select from Offices */}
              {offices.length > 0 && (
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">Select Registered Office (Optional)</label>
                   <select 
                      className="w-full rounded-md border-slate-600 bg-slate-700 text-white shadow-sm p-2"
                      onChange={(e) => handleOfficeSelectForSchedule(e.target.value)}
                   >
                     <option value="">-- Choose an Office to autofill --</option>
                     {offices.map(o => (
                       <option key={o.id} value={o.id}>{o.name}</option>
                     ))}
                   </select>
                </div>
              )}

              {/* Show User Select ONLY if Admin */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                  <select 
                    className="w-full rounded-md border-slate-600 bg-slate-700 text-white shadow-sm p-2"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Location Name"
                  placeholder="Client/Company Name"
                  value={newSchedule.locationName || ''}
                  onChange={e => setNewSchedule({...newSchedule, locationName: e.target.value})}
                  className="bg-slate-700 text-white border-slate-600 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500"
                />
                <Input 
                  label="Address"
                  placeholder="Street, Number, Area"
                  value={newSchedule.address || ''}
                  onChange={e => setNewSchedule({...newSchedule, address: e.target.value})}
                  className="bg-slate-700 text-white border-slate-600 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500"
                />
              </div>

              {/* Multi-Day Selection Box */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Days of Week (Select multiple)</label>
                <div className="flex flex-wrap gap-2">
                   {DAYS.map((day, idx) => {
                     const isSelected = selectedDays.includes(idx);
                     return (
                       <button
                         key={idx}
                         onClick={() => toggleScheduleDay(idx)}
                         className={`
                           flex items-center space-x-2 px-3 py-2 rounded-md border text-sm transition-all
                           ${isSelected 
                              ? 'bg-brand-600 border-brand-500 text-white shadow-md' 
                              : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}
                         `}
                       >
                         {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                         <span>{day.substring(0, 3)}</span>
                       </button>
                     )
                   })}
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <Input 
                  label="Hours per Day"
                  type="number"
                  min="1"
                  max="24"
                  value={newSchedule.hoursPerDay}
                  onChange={e => setNewSchedule({...newSchedule, hoursPerDay: Number(e.target.value)})}
                  className="bg-slate-700 text-white border-slate-600 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500"
                />
              </div>

              <Button onClick={handleAddSchedule} fullWidth className="mt-4">
                <Save size={18} className="mr-2"/> 
                Confirm Schedule
              </Button>
            </div>
          )}

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative">
                {/* Available for Admin OR if it belongs to the current user (Employee managing self) */}
                {(isAdmin || user?.id === schedule.userId) && (
                  <button 
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                    title="Remove Schedule"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <div className="flex items-center space-x-2 mb-3 text-brand-600">
                  <Calendar size={20} />
                  <span className="font-semibold text-lg">{DAYS[schedule.dayOfWeek]}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-gray-600">
                    <MapPin size={18} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{schedule.locationName}</p>
                      <p className="text-sm text-gray-500">{schedule.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock size={18} />
                    <span>{schedule.hoursPerDay} hours planned</span>
                  </div>
                </div>
              </div>
            ))}
            
            {schedules.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                No schedule assignments found for this user.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};