
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileDown, FileText, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const SAFETY_LABELS: Record<keyof SafetyChecklist, string> = {
  knowJobSafety: "Job Safety",
  weatherCheck: "Weather",
  safePassInDate: "Safe Pass",
  hazardAwareness: "Hazards Aware",
  floorConditions: "Floor Checked",
  manualHandlingCert: "Manual Handling",
  liftingHelp: "Lifting Plan",
  anchorPoints: "Anchor Points",
  ladderFooting: "Ladder Footing",
  safetyCones: "Cones/Signs",
  communication: "Comm. Done",
  laddersCheck: "Ladders Checked",
  sharpEdges: "No Sharp Edges",
  scraperCovers: "Scraper Covers",
  hotSurfaces: "No Hot Surfaces",
  chemicalCourse: "Chem Course",
  chemicalAwareness: "Chem Safety",
  tidyEquipment: "Tidy Equip.",
  laddersStored: "Ladders Stored",
  highVis: "High Vis",
  helmet: "Helmet",
  goggles: "Goggles",
  gloves: "Gloves",
  mask: "Mask",
  earMuffs: "Ear Muffs",
  faceGuard: "Face Guard",
  harness: "Harness",
  boots: "Boots"
};

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
                setUsers(fetchedUsers.filter((u: User) => u.role === UserRole.EMPLOYEE));
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
        setFilteredRecords(records.filter((r: TimeRecord) => r.userId === selectedUserFilter));
      }
    } else {
        setFilteredRecords(records);
    }
  }, [selectedUserFilter, records, user]);

  const getChartData = () => {
    const data: Record<string, number> = {};
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    filteredRecords.forEach((record: TimeRecord) => {
      if (!record.endTime) return;
      const date = parseISO(record.date);
      if (date >= weekStart && date <= weekEnd) {
        const dayName = format(date, 'EEEE');
        const start = parseISO(record.startTime);
        const end = parseISO(record.endTime);
        const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
        data[dayName] = (data[dayName] || 0) + Number(hours.toFixed(2));
      }
    });
    return Object.keys(data).map(day => ({ name: day, hours: data[day] }));
  };

  const formatGPS = (loc?: {lat: number, lng: number}) => {
    if (!loc) return 'N/A';
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  };

  const getSafetySummary = (checklist?: SafetyChecklist) => {
    if (!checklist) return 'No data';
    const checked = Object.entries(checklist)
      .filter(([_, value]) => value === true)
      .map(([key]) => SAFETY_LABELS[key as keyof SafetyChecklist] || key);
    return checked.length > 0 ? checked.join(', ') : 'None';
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const reportUser = users.find(u => u.id === selectedUserFilter) || user;
    
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199); 
    doc.text('DOWNEY CLEANING SERVICES', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Staff Member: ${reportUser?.name || 'N/A'}`, 14, 22);
    doc.text(`Report Period: ${format(new Date(), 'MMMM yyyy')}`, 14, 27);
    
    const tableData = filteredRecords
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map((rec: TimeRecord) => {
        const start = format(parseISO(rec.startTime), 'HH:mm');
        const end = rec.endTime ? format(parseISO(rec.endTime), 'HH:mm') : 'Active';
        return [
            format(parseISO(rec.date), 'dd/MM/yyyy'),
            rec.locationName,
            `${start} - ${end}`,
            getSafetySummary(rec.safetyChecklist),
            formatGPS(rec.startLocation),
            formatGPS(rec.endLocation),
            rec.endTime ? 'Done' : 'In Work'
        ];
    });

    autoTable(doc, {
      head: [['Date', 'Site', 'Shift', 'Safety Check', 'GPS In', 'GPS Out', 'Status']],
      body: tableData,
      startY: 38,
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 3: { cellWidth: 70 } },
      headStyles: { fillColor: [12, 74, 110] }, 
    });

    doc.save(`Report_${reportUser?.name.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" size={32}/></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Service Reports</h2>
          <p className="text-gray-500">Service logs for team members</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {user?.role === UserRole.ADMIN && (
                <select className="border rounded-md px-3 py-2 bg-white text-sm font-medium shadow-sm" value={selectedUserFilter} onChange={(e) => setSelectedUserFilter(e.target.value)}>
                    <option value="all">All Employees</option>
                    {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            )}
            <Button variant="primary" onClick={exportPDF} size="sm"><FileDown size={18} className="mr-2" /> Export PDF</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Shift</th>
                        <th className="p-4">Safety Items</th>
                        <th className="p-4">GPS Log</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredRecords.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((record: TimeRecord) => (
                        <tr key={record.id} className="hover:bg-brand-50/30 transition-colors">
                            <td className="p-4 font-mono font-medium text-gray-600">{format(parseISO(record.date), 'dd/MM/yyyy')}</td>
                            <td className="p-4 font-bold text-gray-900">{record.locationName}</td>
                            <td className="p-4 whitespace-nowrap">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
                                    {format(parseISO(record.startTime), 'HH:mm')} - {record.endTime ? format(parseISO(record.endTime), 'HH:mm') : '...'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-1 text-brand-600">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] max-w-[120px] truncate" title={getSafetySummary(record.safetyChecklist)}>
                                        {Object.values(record.safetyChecklist || {}).filter(v => v === true).length} items
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 font-mono text-[9px] text-gray-400">
                                <div>IN: {formatGPS(record.startLocation)}</div>
                                <div>OUT: {formatGPS(record.endLocation)}</div>
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${record.endTime ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700 animate-pulse'}`}>
                                    {record.endTime ? 'Done' : 'Active'}
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
