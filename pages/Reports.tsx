import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User } from '../types';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    doc.text('Service Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = filteredRecords.map(rec => {
        const u = users.find((u: User) => u.id === rec.userId);
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
      head: [['User', 'Date', 'Location', 'Start', 'End']],
      body: tableData,
      startY: 40,
    });
    doc.save('report.pdf');
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600"/></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500">Weekly tracking</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {user?.role === UserRole.ADMIN && (
                <select 
                    className="border rounded-md px-3 py-2 bg-white"
                    value={selectedUserFilter}
                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                >
                    <option value="all">All Employees</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            )}
            <Button variant="secondary" onClick={exportPDF}>
                <FileDown size={18} className="mr-2" /> Export PDF
            </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6">Weekly Hours</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <FileText className="text-brand-600" />
            <h3 className="font-semibold text-lg">Detailed Records</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                    <tr>
                        <th className="p-4">Date</th>
                        {user?.role === UserRole.ADMIN && <th className="p-4">User</th>}
                        <th className="p-4">Location</th>
                        <th className="p-4">Time</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredRecords.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                            <td className="p-4">{new Date(record.date).toLocaleDateString()}</td>
                            {user?.role === UserRole.ADMIN && (
                                <td className="p-4 font-medium">{users.find((u: User) => u.id === record.userId)?.name || '...'}</td>
                            )}
                            <td className="p-4">{record.locationName}</td>
                            <td className="p-4">
                                {new Date(record.startTime).toLocaleTimeString()} - {record.endTime ? new Date(record.endTime).toLocaleTimeString() : '...'}
                            </td>
                            <td className="p-4">
                                {record.endTime ? (
                                    <span className="text-green-600 font-medium">Completed</span>
                                ) : (
                                    <span className="text-blue-600 font-medium">Active</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};