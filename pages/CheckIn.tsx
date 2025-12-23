
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database } from '../services/database';
import { TimeRecord, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { Camera, ShieldCheck, PlayCircle, StopCircle, Check, MapPin, Loader2, HardHat, Glasses, Hand, Activity, Construction, Box, AlertTriangle, ChevronDown, Edit2 } from 'lucide-react';

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
    if (user) Database.getActiveSession(user.id).then(setActiveSession);
  }, [user]);

  const handleStartShift = async () => {
    if (!user || !locationName) return;
    setIsProcessing(true);
    const newRecord = await Database.startShift({
      userId: user.id, locationName, startTime: new Date().toISOString(), date: new Date().toISOString().split('T')[0], safetyChecklist: checklist
    });
    setActiveSession(newRecord);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-brand-600" /> Check-In</h2>
      {!activeSession ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <input className="w-full border p-2 rounded" placeholder="Location" value={locationName} onChange={e => setLocationName(e.target.value)} />
          <Button onClick={handleStartShift} fullWidth disabled={isProcessing}>Start Shift</Button>
        </div>
      ) : (
        <div className="bg-brand-900 text-white p-8 rounded-xl text-center">
          <p className="text-2xl font-mono">Shift Active: {activeSession.locationName}</p>
        </div>
      )}
    </div>
  );
};
