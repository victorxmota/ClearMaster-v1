import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User } from '../types';
import { Button } from '../components/ui/Button';
import { 
  FileDown, 
  FileText, 
  Loader2, 
  MapPin, 
  ExternalLink, 
  BarChart3, 
  Clock, 
  TrendingUp,
  Map as MapIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(user?.id || 'all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
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
          setUsers([user]);
          setSelectedUserFilter(user.id);
        }
        setRecords(allRecords);
        setFilteredRecords(allRecords);
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setIsLoading(false);
      }
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

  const stats = useMemo(() => {
    const completed = filteredRecords.filter(r => r.endTime);
    const totalMinutes = completed.reduce((acc, rec) => {
      return acc + differenceInMinutes(parseISO(rec.endTime!), parseISO(rec.startTime));
    }, 0);
    
    const uniqueLocations = new Set(filteredRecords.map(r => r.locationName)).size;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      sessions: completed.length,
      locations: uniqueLocations
    };
  }, [filteredRecords]);

  const chartData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const sorted = [...filteredRecords].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    sorted.forEach(rec => {
      if (!rec.endTime) return;
      const day = format(parseISO(rec.date), 'dd/MM');
      const mins = differenceInMinutes(parseISO(rec.endTime), parseISO(rec.startTime));
      const hours = mins / 60;
      dailyMap.set(day, (dailyMap.get(day) || 0) + hours);
    });

    return Array.from(dailyMap.entries()).map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(1))
    })).slice(-10);
  }, [filteredRecords]);

  const formatGPS = (loc?: {lat: number, lng: number}) => {
    if (!loc) return 'N/A';
    return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
  };

  const getMapsUrl = (loc?: {lat: number, lng: number}) => {
    if (!loc) return '';
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const reportUser = users.find(u => u.id === selectedUserFilter) || user;
    const isFiltered = selectedUserFilter !== 'all';
    
    doc.setFontSize(22);
    doc.setTextColor(2, 132, 199);
    doc.text('DOWNEY CLEANING SERVICES', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Staff Member: ${isFiltered ? reportUser?.name : 'All Active Personnel'}`, 14, 28);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);
    
    const tableData = [...filteredRecords]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map((rec: TimeRecord) => [
        format(parseISO(rec.date), 'dd/MM/yyyy'),
        rec.locationName,
        `${format(parseISO(rec.startTime), 'HH:mm')} - ${rec.endTime ? format(parseISO(rec.endTime), 'HH:mm') : 'ACTIVE'}`,
        formatGPS(rec.startLocation),
        formatGPS(rec.endLocation),
        rec.endTime ? 'COMPLETED' : 'IN PROGRESS'
      ]);

    autoTable(doc, {
      head: [['Date', 'Site Name', 'Shift Time', 'Check-In Location', 'Check-Out Location', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        3: { textColor: [2, 132, 199], fontStyle: 'bold' },
        4: { textColor: [2, 132, 199], fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
          const text = data.cell.text[0];
          if (text !== 'N/A') {
            const sortedRecords = [...filteredRecords].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            const record = sortedRecords[data.row.index];
            const loc = data.column.index === 3 ? record.startLocation : record.endLocation;
            if (loc) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
                url: getMapsUrl(loc)
              });
            }
          }
        }
      }
    });

    doc.save(`Downey_Operational_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-brand-600" size={48}/>
      <p className="text-gray-400 font-medium animate-pulse">Compiling performance analytics...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Operational Dashboard</h2>
          <p className="text-gray-500 text-sm">Real-time performance metrics and location audit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === UserRole.ADMIN && (
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500 shadow-sm font-medium"
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">Entire Team</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={exportPDF} size="sm" className="shadow-md">
            <FileDown size={18} className="mr-2" /> Export Audit Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-brand-50 p-3 rounded-lg text-brand-600"><Clock size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Hours</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalHours}h</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Completed Shifts</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.sessions}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-lg text-orange-600"><MapIcon size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Unique Sites</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.locations}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-brand-600" size={20} />
          <h3 className="font-bold text-gray-800">Productivity Trend (Daily Hours)</h3>
        </div>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Bar dataKey="hours" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={0.8 + (index / chartData.length) * 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <BarChart3 size={40} className="opacity-20" />
              <p className="text-sm italic">Not enough data to render trend chart.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-2">
            <div className="bg-brand-100 p-2 rounded-lg">
              <FileText className="text-brand-600" size={18} />
            </div>
            <h3 className="font-bold text-gray-800">Detailed Activity History</h3>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredRecords.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] border-b">
              <tr>
                <th className="p-4 w-32">Date</th>
                <th className="p-4">Site/Location</th>
                <th className="p-4">Time Log</th>
                <th className="p-4">GPS Verification</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...filteredRecords]
                .sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((record) => (
                <tr key={record.id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="p-4 text-xs font-mono text-gray-600">
                    {format(parseISO(record.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {record.locationName}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
                        {format(parseISO(record.startTime), 'HH:mm')}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.endTime ? 'bg-gray-100' : 'bg-brand-50 text-brand-700 animate-pulse'}`}>
                        {record.endTime ? format(parseISO(record.endTime), 'HH:mm') : 'ACTIVE'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <a href={getMapsUrl(record.startLocation)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-brand-600 hover:underline">
                        <MapPin size={10} className="text-green-500"/> {formatGPS(record.startLocation)}
                      </a>
                      <a href={getMapsUrl(record.endLocation)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-brand-600 hover:underline">
                        <MapPin size={10} className="text-red-500"/> {formatGPS(record.endLocation)}
                      </a>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${record.endTime ? 'bg-green-50 text-green-700' : 'bg-brand-50 text-brand-700'}`}>
                      {record.endTime ? 'COMPLETED' : 'ON SITE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};