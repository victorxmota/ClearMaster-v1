
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { FileDown, FileText, Loader2, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

const SAFETY_LABELS: Record<keyof SafetyChecklist, string> = {
  knowJobSafety: "Job Safety Plan", weatherCheck: "Weather Check", safePassInDate: "Safe Pass",
  hazardAwareness: "Hazard Awareness", floorConditions: "Floor Check", manualHandlingCert: "Manual Handling",
  liftingHelp: "Lifting Help", anchorPoints: "Anchor Points", ladderFooting: "Ladder Footing",
  safetyCones: "Safety Cones", communication: "Comm. Protocol", laddersCheck: "Ladder Check",
  sharpEdges: "Sharp Edges", scraperCovers: "Scraper Covers", hotSurfaces: "Hot Surfaces",
  chemicalCourse: "Chem Course", chemicalAwareness: "Chem Awareness", tidyEquipment: "Tidy Equip",
  laddersStored: "Ladder Storage", highVis: "High Vis", helmet: "Helmet", goggles: "Goggles",
  gloves: "Gloves", mask: "Mask", earMuffs: "Ear Muffs", faceGuard: "Face Guard", harness: "Harness", boots: "Boots"
};

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
        try {
            if (user.role === UserRole.ADMIN) {
                const [recs, allUsers] = await Promise.all([Database.getAllRecords(), Database.getAllUsers()]);
                setRecords(recs);
                setFilteredRecords(recs);
                setUsers(allUsers.filter(u => u.role === UserRole.EMPLOYEE));
            } else {
                const recs = await Database.getRecordsByUser(user.id);
                setRecords(recs);
                setFilteredRecords(recs);
                setUsers([user]);
                setSelectedUserFilter(user.id);
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedUserFilter === 'all') setFilteredRecords(records);
    else setFilteredRecords(records.filter(r => r.userId === selectedUserFilter));
  }, [selectedUserFilter, records]);

  const getSafetySummary = (checklist?: SafetyChecklist) => {
    if (!checklist) return "N/A";
    const checked = Object.entries(checklist)
      .filter(([_, value]) => value === true)
      .map(([key]) => SAFETY_LABELS[key as keyof SafetyChecklist] || key);
    return checked.length > 0 ? checked.join(", ") : "None";
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const activeUser = users.find(u => u.id === selectedUserFilter) || user;
    
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199);
    doc.text('DOWNEY CLEANING SERVICES - SAFETY & SERVICE REPORT', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Staff: ${activeUser?.name || 'Full Team'}`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 27);

    const tableData = filteredRecords.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(r => [
      format(parseISO(r.date), 'dd/MM/yyyy'),
      r.locationName,
      `${format(parseISO(r.startTime), 'HH:mm')} - ${r.endTime ? format(parseISO(r.endTime), 'HH:mm') : '...' }`,
      getSafetySummary(r.safetyChecklist),
      r.endTime ? 'Completed' : 'Active'
    ]);

    autoTable(doc, {
      head: [['Date', 'Site', 'Shift', 'Safety Items Checked', 'Status']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 3: { cellWidth: 100 } },
      headStyles: { fillColor: [12, 74, 110] },
    });

    doc.save(`Downey_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Operational Reports</h2>
          <p className="text-gray-500">Service logs with integrated safety verifications</p>
        </div>
        <div className="flex gap-2">
          {user?.role === UserRole.ADMIN && (
            <select className="border rounded-md px-3 py-2 bg-white text-sm" value={selectedUserFilter} onChange={(e) => setSelectedUserFilter(e.target.value)}>
              <option value="all">Full Team</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={exportPDF} size="sm"><FileDown size={18} className="mr-2" /> PDF Report</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Site</th>
                <th className="p-4">Shift</th>
                <th className="p-4">Safety Items</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/20 transition-colors">
                  <td className="p-4 font-mono">{format(parseISO(r.date), 'dd/MM/yyyy')}</td>
                  <td className="p-4 font-bold">{r.locationName}</td>
                  <td className="p-4 text-[11px] whitespace-nowrap">
                    {format(parseISO(r.startTime), 'HH:mm')} - {r.endTime ? format(parseISO(r.endTime), 'HH:mm') : '...'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-brand-600">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-medium truncate max-w-[150px]" title={getSafetySummary(r.safetyChecklist)}>
                        {Object.values(r.safetyChecklist || {}).filter(v => v === true).length} items verified
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.endTime ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700 animate-pulse'}`}>
                      {r.endTime ? 'Done' : 'Active'}
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
