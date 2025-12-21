
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Database } from '../services/database.ts';
import { TimeRecord, UserRole, User } from '../types.ts';
import { Button } from '../components/ui/Button.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, parseISO, differenceInHours } from 'date-fns';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        
        let allRecords: TimeRecord[] = [];
        
        if (user.role === UserRole.ADMIN) {
            const [fetchedRecords, fetchedUsers] = await Promise.all([
                Database.getAllRecords(),
                Database.getAllUsers()
            ]);
            allRecords = fetchedRecords;
            setUsers(fetchedUsers.filter(u => u.role === UserRole.EMPLOYEE));
        } else {
            allRecords = await Database.getRecordsByUser(user.id);
        }

        setRecords(allRecords);
        setFilteredRecords(allRecords);
        setIsLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      if (selectedUserFilter === 'all') {
        setFilteredRecords(records);
      } else {
        setFilteredRecords(records.filter(r => r.userId === selectedUserFilter));
      }
    } else {
        setFilteredRecords(records);
    }
  }, [selectedUserFilter, records, user]);

  const getChartData = () => {
    const data: Record<string, number> = {};
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    filteredRecords.forEach(record => {
      if (!record.endTime) return;
      const date = parseISO(record.date);
      if (date >= weekStart && date <= weekEnd) {
        const dayName = format(date, 'EEEE');
        const hours = differenceInHours(parseISO(record.endTime), parseISO(record.startTime));
        data[dayName] = (data[dayName] || 0) + hours;
      }
    });

    return Object.keys(data).map(day => ({ name: day, hours: data[day] }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Service Performance Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = filteredRecords.map(rec => {
        const u = users.find(u => u.id === rec.userId);
        const start = new Date(rec.startTime).toLocaleTimeString();
        const end = rec.endTime ? new Date(rec.endTime).toLocaleTimeString() : 'In progress';
        return [
            u?.name || rec.userId.substring(0,8),
            rec.date,
            rec.locationName,
            start,
            end
        ];
    });

    autoTable(doc, {
      head: [['Employee', 'Date', 'Location', 'Check-In', 'Check-Out']],
      body: tableData,
      startY: 40,
    });
    doc.save('CleaningServiceReport.pdf');
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-500" size={40}/></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Analytical Reports</h2>
          <p className="text-gray-500 font-medium">Weekly service tracking & performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {user?.role === UserRole.ADMIN && (
                <select 
                    className="border rounded-md px-3 py-2 bg-white font-medium focus:ring-brand-500"
                    value={selectedUserFilter}
                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                >
                    <option value="all">All Employees</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            )}
            <Button variant="primary" onClick={exportPDF} className="shadow-lg">
                <FileDown size={18} className="mr-2" /> Download PDF Report
            </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6 text-gray-700">Hours per Weekday</h3>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="hours" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="text-brand-500" />
                <h3 className="font-bold text-lg text-gray-800">Operational Logs</h3>
            </div>
            <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-full">{filteredRecords.length} records</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    <tr>
                        <th className="p-4">Date</th>
                        {user?.role === UserRole.ADMIN && <th className="p-4">Staff Member</th>}
                        <th className="p-4">Work Location</th>
                        <th className="p-4">Shift Time</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredRecords.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((record) => (
                        <tr key={record.id} className="hover:bg-brand-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                            {user?.role === UserRole.ADMIN && (
                                <td className="p-4 font-bold text-brand-900">{users.find(u => u.id === record.userId)?.name || 'Unknown'}</td>
                            )}
                            <td className="p-4 font-medium text-gray-600">{record.locationName}</td>
                            <td className="p-4 text-gray-500 font-mono">
                                {new Date(record.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {record.endTime ? new Date(record.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                            </td>
                            <td className="p-4">
                                {record.endTime ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase">Finalized</span>
                                ) : (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase animate-pulse">On Duty</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium">No service records available for this period.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
