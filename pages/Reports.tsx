
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { TimeRecord, UserRole, User, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { FileDown, Loader2, ShieldCheck, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

const SAFETY_LABELS: Record<keyof SafetyChecklist, string> = {
  knowJobSafety: "Job Safety", weatherCheck: "Weather", safePassInDate: "Safe Pass",
  hazardAwareness: "Hazards Aware", floorConditions: "Floor Checked",
  manualHandlingCert: "Manual Handling", liftingHelp: "Lifting Plan",
  anchorPoints: "Anchor Points", ladderFooting: "Ladder Footing",
  safetyCones: "Cones/Signs", communication: "Comm. Done",
  laddersCheck: "Ladders Checked", sharpEdges: "No Sharp Edges",
  scraperCovers: "Scraper Covers", hotSurfaces: "No Hot Surfaces",
  chemicalCourse: "Chem Course", chemicalAwareness: "Chem Safety",
  tidyEquipment: "Tidy Equip.", laddersStored: "Ladders Stored",
  highVis: "High Vis", helmet: "Helmet", goggles: "Goggles",
  gloves: "Gloves", mask: "Mask", earMuffs: "Ear Muffs",
  faceGuard: "Face Guard", harness: "Harness", boots: "Boots"
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
          const [allRecs, allUsers] = await Promise.all([
            Database.getAllRecords(),
            Database.getAllUsers()
          ]);
          setRecords(allRecs);
          setFilteredRecords(allRecs);
          setUsers(allUsers.filter(u => u.role === UserRole.EMPLOYEE));
          setSelectedUserFilter('all');
        } else {
          const myRecs = await Database.getRecordsByUser(user.id);
          setRecords(myRecs);
          setFilteredRecords(myRecs);
          setUsers([user]);
          setSelectedUserFilter(user.id);
        }
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedUserFilter === 'all') {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter(r => r.userId === selectedUserFilter));
    }
  }, [selectedUserFilter, records]);

  const getSafetyItemsCount = (checklist?: SafetyChecklist) => {
    if (!checklist) return 0;
    return Object.values(checklist).filter(v => v === true).length;
  };

  const getSafetySummaryText = (checklist?: SafetyChecklist) => {
    if (!checklist) return 'N/A';
    const active = Object.entries(checklist)
      .filter(([_, v]) => v === true)
      .map(([k]) => SAFETY_LABELS[k as keyof SafetyChecklist] || k);
    return active.length > 0 ? active.join(', ') : 'None';
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const activeUser = users.find(u => u.id === selectedUserFilter) || user;
    
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199);
    doc.text('DOWNEY CLEANING SERVICES - SERVICE REPORT', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Staff: ${selectedUserFilter === 'all' ? 'Full Team' : activeUser?.name}`, 14, 22);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 27);

    const tableData = filteredRecords
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map(r => [
        format(parseISO(r.date), 'dd/MM/yyyy'),
        r.locationName,
        `${format(parseISO(r.startTime), 'HH:mm')} - ${r.endTime ? format(parseISO(r.endTime), 'HH:mm') : 'Active'}`,
        getSafetySummaryText(r.safetyChecklist),
        r.endTime ? 'Complete' : 'Working'
      ]);

    autoTable(doc, {
      head: [['Date', 'Location', 'Shift Window', 'Safety Checklist Summary', 'Status']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 3: { cellWidth: 90 } },
      headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`Downey_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-brand-600" /> Operational Reports
          </h2>
          <p className="text-gray-500">Service logs and mandatory safety verifications</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {user?.role === UserRole.ADMIN && (
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">Full Staff View</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={exportPDF} size="sm" className="shadow-md">
            <FileDown size={18} className="mr-2" /> Export to PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Client / Site</th>
                <th className="p-4">Time Tracked</th>
                <th className="p-4">Safety Items</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((record) => (
                <tr key={record.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="p-4 font-mono font-medium text-gray-600">
                    {format(parseISO(record.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4 font-bold text-gray-900">{record.locationName}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold border border-gray-200">
                      {format(parseISO(record.startTime), 'HH:mm')} - {record.endTime ? format(parseISO(record.endTime), 'HH:mm') : '...'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100 w-fit">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold" title={getSafetySummaryText(record.safetyChecklist)}>
                        {getSafetyItemsCount(record.safetyChecklist)} Checkpoints
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${record.endTime ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'}`}>
                      {record.endTime ? 'Verified' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 italic">
                    No records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
