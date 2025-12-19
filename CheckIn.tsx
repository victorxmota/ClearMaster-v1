
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAuth } from '../App.tsx';
import { Database } from '../services/database.ts';
import { TimeRecord, SafetyChecklist, ScheduleItem } from '../types.ts';
import { Button } from '../components/ui/Button.tsx';
import { 
  ShieldCheck, 
  PlayCircle, 
  StopCircle, 
  Check, 
  MapPin, 
  Loader2, 
  AlertCircle,
  HardHat,
  Glasses,
  HandMetal,
  Wind,
  Ear,
  ScanEye,
  Construction,
  Strikethrough,
  Camera
} from 'lucide-react';

const INITIAL_CHECKLIST: SafetyChecklist = {
  highVis: false, helmet: false, goggles: false, gloves: false, mask: false,
  earMuffs: false, faceGuard: false, harness: false, boots: false,
  knowSafeJob: false, weatherCheck: false, safePassInDate: false,
  slipTripAware: false, wetFloorsCleaned: false, manualHandlingCert: false,
  heavyLiftingAssistance: false, anchorPointsTie: false, ladderFooted: false,
  safetySigns: false, commWithOthers: false, ladderCheck: false,
  sharpEdgesCheck: false, scraperBladeCovers: false, hotSurfacesCheck: false,
  chemicalCourseComplete: false, chemicalDilutionAware: false,
  equipmentTidy: false, laddersPutAway: false
};

export const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeRecord | null>(null);
  const [locationName, setLocationName] = useState('');
  const [availableLocations, setAvailableLocations] = useState<{name: string, address: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);
  const [endPhotoFile, setEndPhotoFile] = useState<File | null>(null);
  const [checklist, setChecklist] = useState<SafetyChecklist>(INITIAL_CHECKLIST);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const session = await Database.getActiveSession(user.id);
        if (session) {
          setActiveSession(session);
          setLocationName(session.locationName);
          setChecklist({ ...INITIAL_CHECKLIST, ...session.safetyChecklist });
          setPhotoPreview(session.photoUrl || null);
        }
        const schedules: ScheduleItem[] = await Database.getSchedulesByUser(user.id);
        const uniqueLocs = new Map<string, string>();
        schedules.forEach((s: ScheduleItem) => {
          if (!uniqueLocs.has(s.locationName)) uniqueLocs.set(s.locationName, s.address);
        });
        setAvailableLocations(Array.from(uniqueLocs.entries()).map(([name, address]) => ({ name, address })));
      } catch (e) {
        console.error(e);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      const startTime = new Date(activeSession.startTime).getTime();
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>, isEnd: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEnd) { setEndPhotoPreview(reader.result as string); setEndPhotoFile(file); }
        else { setPhotoPreview(reader.result as string); setPhotoFile(file); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartShift = async () => {
    if (!user || !locationName) { alert("Select location."); return; }
    setIsProcessing(true);
    try {
      const recordData: any = {
        userId: user.id,
        locationName,
        startTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        safetyChecklist: checklist
      };
      const newRecord = await Database.startShift(recordData, photoFile || undefined);
      setActiveSession(newRecord);
    } catch (error: any) {
      setErrorMsg("Failed to start.");
    } finally { setIsProcessing(false); }
  };

  const handleEndShift = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    try {
      await Database.endShift(activeSession.id, { endTime: new Date().toISOString() }, endPhotoFile || undefined);
      setActiveSession(null);
      setLocationName('');
      setChecklist(INITIAL_CHECKLIST);
    } catch (error: any) {
      setErrorMsg("Failed to end.");
    } finally { setIsProcessing(false); }
  };

  const toggleCheck = (key: keyof SafetyChecklist) => {
    if (!activeSession) {
      setChecklist((prev: SafetyChecklist) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const CheckItem = ({ id, label }: { id: keyof SafetyChecklist, label: string }) => (
    <button
      onClick={() => toggleCheck(id)}
      disabled={!!activeSession}
      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${checklist[id] ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}
    >
      <span className="text-[10px] font-black uppercase leading-tight">{label}</span>
      {checklist[id] ? <Check size={14} /> : <div className="w-3 h-3 rounded border border-gray-200" />}
    </button>
  );

  const PPECARD = ({ id, label, icon: Icon }: { id: keyof SafetyChecklist, label: string, icon: any }) => (
    <button
      onClick={() => toggleCheck(id)}
      disabled={!!activeSession}
      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all aspect-square ${checklist[id] ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-gray-50 bg-gray-50/50 text-gray-300'}`}
    >
      <Icon size={20} className="mb-1" />
      <span className="text-[8px] font-black uppercase text-center leading-none">{label}</span>
    </button>
  );

  if (initializing) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
        <ShieldCheck className="text-brand-600" size={32} /> Shift Clock
      </h2>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-brand-900 text-white">
          <h3 className="font-black text-lg uppercase tracking-widest">Safety Compliance</h3>
          <p className="text-brand-300 text-[10px] font-black uppercase">REQUIRED PPE & PROTOCOLS</p>
        </div>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
            <PPECARD id="highVis" label="Vest" icon={Construction} />
            <PPECARD id="helmet" label="Helmet" icon={HardHat} />
            <PPECARD id="goggles" label="Goggles" icon={Glasses} />
            <PPECARD id="gloves" label="Gloves" icon={HandMetal} />
            <PPECARD id="mask" label="Mask" icon={Wind} />
            <PPECARD id="earMuffs" label="Ears" icon={Ear} />
            <PPECARD id="faceGuard" label="Face" icon={ScanEye} />
            <PPECARD id="harness" label="Harness" icon={Strikethrough} />
            <PPECARD id="boots" label="Boots" icon={Construction} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {Object.keys(INITIAL_CHECKLIST).slice(9).map((key) => (
               <CheckItem key={key} id={key as keyof SafetyChecklist} label={key.replace(/([A-Z])/g, ' $1')} />
             ))}
          </div>
        </div>
      </div>

      {!activeSession ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          <select
            className="w-full rounded-2xl border-gray-100 p-5 bg-gray-50 font-black text-gray-900 appearance-none uppercase text-xs tracking-widest"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          >
            <option value="">-- Select Location --</option>
            {availableLocations.map((loc, i) => <option key={i} value={loc.name}>{loc.name}</option>)}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer bg-gray-50 hover:bg-white transition-all overflow-hidden group">
               {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <div className="text-center text-gray-400"><Camera className="mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-[10px] font-black uppercase">Site Photo</p></div>}
               <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handlePhotoSelect(e, false)} />
            </label>
            <Button onClick={handleStartShift} className="h-44 rounded-3xl text-2xl font-black uppercase tracking-tighter shadow-2xl bg-brand-600 hover:bg-brand-700">
               <PlayCircle className="mr-3" size={32} /> Clock In
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-600 p-10 rounded-[3rem] text-center shadow-2xl animate-fade-in border-8 border-green-500/50">
           <p className="text-green-100 font-black uppercase text-xs tracking-widest mb-4">Shift in Progress • {activeSession.locationName}</p>
           <div className="text-8xl font-black text-white tracking-tighter mb-8 tabular-nums">{formatTime(elapsedTime)}</div>
           <Button onClick={handleEndShift} className="w-full h-24 rounded-3xl text-xl font-black uppercase bg-red-600 hover:bg-red-700 text-white shadow-2xl">
              <StopCircle className="mr-3" /> Finish Shift
           </Button>
        </div>
      )}
    </div>
  );
};
