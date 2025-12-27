import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { Database } from '../services/database';
import { TimeRecord, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { 
  Camera, 
  ShieldCheck, 
  PlayCircle, 
  StopCircle, 
  Check, 
  MapPin, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeRecord | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      const session = await Database.getActiveSession(user.id);
      if (session) {
        setActiveSession(session);
        setLocationName(session.locationName);
      }
      setInitializing(false);
    };
    init();
  }, [user]);

  if (initializing) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Operational Check-In</h2>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        {!activeSession ? (
          <>
            <input 
              className="w-full p-3 border rounded-lg"
              placeholder="Enter Location Name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
            <Button fullWidth size="lg" onClick={() => {/* logic */}}>Start Shift</Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-2">Shift Active</p>
            <h3 className="text-3xl font-mono font-black">{activeSession.locationName}</h3>
            <Button variant="danger" className="mt-6" fullWidth onClick={() => {/* logic */}}>End Shift</Button>
          </div>
        )}
      </div>
    </div>
  );
};