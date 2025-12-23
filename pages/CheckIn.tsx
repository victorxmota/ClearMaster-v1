
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { TimeRecord, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Loader2 } from 'lucide-react';
// Added missing imports for date formatting
import { format, parseISO } from 'date-fns';

const INITIAL_CHECKLIST: SafetyChecklist = {
  knowJobSafety: false, weatherCheck: false, safePassInDate: false, hazardAwareness: false, floorConditions: false,
  manualHandlingCert: false, liftingHelp: false, anchorPoints: false, ladderFooting: false, safetyCones: false,
  communication: false, laddersCheck: false, sharpEdges: false, scraperCovers: false, hotSurfaces: false,
  chemicalCourse: false, chemicalAwareness: false, tidyEquipment: false, laddersStored: false,
  highVis: false, helmet: false, goggles: false, gloves: false, mask: false, earMuffs: false, faceGuard: false, harness: false, boots: false
};

export const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeRecord | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checklist, setChecklist] = useState<SafetyChecklist>(INITIAL_CHECKLIST);

  useEffect(() => {
    if (user) {
      Database.getActiveSession(user.id).then(setActiveSession);
    }
  }, [user]);

  const handleStartShift = async () => {
    if (!user || !locationName) {
      alert("Please enter site location.");
      return;
    }
    setIsProcessing(true);
    try {
      const newRecord = await Database.startShift({
        userId: user.id,
        locationName,
        startTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        safetyChecklist: checklist
      });
      setActiveSession(newRecord);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    try {
      await Database.endShift(activeSession.id, {
        endTime: new Date().toISOString()
      });
      setActiveSession(null);
      setLocationName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-brand-600" size={32} />
        <h2 className="text-3xl font-bold text-gray-900">Professional Check-In</h2>
      </div>

      {!activeSession ? (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Current Work Site</label>
            <input 
              className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-brand-500 outline-none transition-all text-lg" 
              placeholder="e.g. Tech Corp HQ" 
              value={locationName} 
              onChange={e => setLocationName(e.target.value)} 
            />
          </div>
          <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 text-sm text-brand-700">
            Confirm that all safety protocols are being followed before starting your shift.
          </div>
          <Button onClick={handleStartShift} fullWidth size="lg" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
            Commence Shift
          </Button>
        </div>
      ) : (
        <div className="bg-brand-900 text-white p-10 rounded-2xl text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-brand-200 uppercase tracking-widest text-xs font-bold mb-2">Shift Status: Active</p>
            <h3 className="text-3xl font-bold mb-6">{activeSession.locationName}</h3>
            <p className="text-sm text-brand-300 mb-8 font-mono">Started at: {format(parseISO(activeSession.startTime), 'HH:mm:ss')}</p>
            <Button variant="danger" onClick={handleEndShift} fullWidth size="lg" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
              Finalize Shift
            </Button>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={120} />
          </div>
        </div>
      )}
    </div>
  );
};
