import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User } from '../types';
import { Button } from '../components/ui/Button';
import { FileDown, FileText, Loader2, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

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

  const formatGPS = (loc?: {lat: number, lng: number}) => {
    if (!loc) return 'N/A';
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  };

  const exportPDF = () => {
    // PDF em modo Paisagem (l) para acomodar as colunas de GPS
    const doc = new jsPDF('l', 'mm', 'a4');
    const reportUser = users.find(u => u.id === selectedUserFilter) || user;
    
    doc.setFontSize(20);
    doc.setTextColor(2, 132, 199);
    doc.text('DOWNEY CLEANING SERVICES', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Service Report: ${reportUser?.name || 'Staff'}`, 14, 28);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);
    
    const tableData = [...filteredRecords]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map((rec: TimeRecord) => [
        format(parseISO(rec.date), 'dd/MM/yyyy'),
        rec.locationName,
        `${format(parseISO(rec.startTime), 'HH:mm')} - ${rec.endTime ? format(parseISO(rec.endTime), 'HH:mm') : 'Active'}`,
        formatGPS(rec.startLocation),
        formatGPS(rec.endLocation),
        rec.endTime ? 'Completed' : 'In Progress'
      ]);

    autoTable(doc, {
      head: [['Date', 'Site Name', 'Shift Time', 'Check-In (GPS)', 'Check-Out (GPS)', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [12, 74, 110] },
    });

    doc.save(`Downey_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" size={48}/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Operational Reports</h2>
          <p className="text-gray-500 text-sm">Attendance and GPS location tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === UserRole.ADMIN && (
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">All Staff</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={exportPDF} size="sm">
            <FileDown size={18} className="mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-brand-600" size={20} />
            <h3 className="font-bold text-gray-800">Activity Log</h3>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filteredRecords.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Location</th>
                <th className="p-4">Time</th>
                <th className="p-4">GPS (In/Out)</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...filteredRecords]
                .sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((record) => (
                <tr key={record.id} className="hover:bg-brand-50/20 transition-colors">
                  <td className="p-4 font-mono text-gray-600">
                    {format(parseISO(record.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4 font-bold text-gray-900">{record.locationName}</td>
                  <td className="p-4 text-gray-500">
                    <span className="font-medium">
                      {format(parseISO(record.startTime), 'HH:mm')} - {record.endTime ? format(parseISO(record.endTime), 'HH:mm') : '...'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col text-[10px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-green-500"/> {formatGPS(record.startLocation)}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-red-500"/> {formatGPS(record.endLocation)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${record.endTime ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'}`}>
                      {record.endTime ? 'Completed' : 'Ongoing'}
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