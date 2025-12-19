import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { Database } from '../services/database.ts';
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
  AlertCircle,
  HardHat,
  Glasses,
  HandMetal,
  Wind,
  Ear,
  ScanEye,
  Construction,
  Strikethrough
} from 'lucide-react';

const INITIAL_CHECKLIST: SafetyChecklist = {
  highVis: false,
  helmet: false,
  goggles: false,
  gloves: false,
  mask: false,
  earMuffs: false,
  faceGuard: false,
  harness: false,
  boots: false,
  knowSafeJob: false,
  weatherCheck: false,
  safePassInDate: false,
  slipTripAware: false,
  wetFloorsCleaned: false,
  manualHandlingCert: false,
  heavyLiftingAssistance: false,
  anchorPointsTie: false,
  ladderFooted: false,
  safetySigns: false,
  commWithOthers: false,
  ladderCheck: false,
  sharpEdgesCheck: false,
  scraperBladeCovers: false,
  hotSurfacesCheck: false,
  chemicalCourseComplete: false,
  chemicalDilutionAware: false,
  equipmentTidy: false,
  laddersPutAway: false
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
          setChecklist(session.safetyChecklist);
          setPhotoPreview(session.photoUrl || null);
        }

        const schedules = await Database.getSchedulesByUser(user.id);
        const uniqueLocs = new Map();
        schedules.forEach(s => {
          if (!uniqueLocs.has(s.locationName)) {
            uniqueLocs.set(s.locationName, s.address);
          }
        });
        
        setAvailableLocations(Array.from(uniqueLocs.entries()).map(([name, address]) => ({
          name,
          address
        })));
      } catch (e) {
        console.error("Error initializing check-in", e);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isEnd: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEnd) {
          setEndPhotoPreview(reader.result as string);
          setEndPhotoFile(file);
        } else {
          setPhotoPreview(reader.result as string);
          setPhotoFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = (): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      const safetyTimeout = setTimeout(() => resolve(null), 7000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(safetyTimeout);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(safetyTimeout);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );
    });
  };

  const handleStartShift = async () => {
    if (!user || !locationName) {
      alert("Location is mandatory.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
        const location = await getCurrentLocation();
        const recordData: any = {
          userId: user.id,
          locationName,
          startTime: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          safetyChecklist: checklist,
          startLocation: location || undefined
        };

        const newRecord = await Database.startShift(recordData, photoFile || undefined);
        setActiveSession(newRecord);
    } catch (error: any) {
        console.error(error);
        setErrorMsg("Error starting shift. Check console.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    try {
      const location = await getCurrentLocation();
      await Database.endShift(activeSession.id, {
        endTime: new Date().toISOString(),
        endLocation: location || undefined
      }, endPhotoFile || undefined);
      
      setActiveSession(null);
      setPhotoPreview(null);
      setPhotoFile(null);
      setEndPhotoPreview(null);
      setEndPhotoFile(null);
      setLocationName('');
      setChecklist(INITIAL_CHECKLIST);
    } catch (error: any) {
      console.error(error);
      setErrorMsg("Error ending shift.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCheck = (key: keyof SafetyChecklist) => {
    if (!activeSession) {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const CheckItem = ({ id, label }: { id: keyof SafetyChecklist, label: string }) => (
    <button
      onClick={() => toggleCheck(id)}
      disabled={!!activeSession}
      className={`
        flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left group
        ${checklist[id] 
          ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
          : 'border-gray-200 text-gray-500 hover:border-brand-200 hover:bg-brand-50/30'}
      `}
    >
      <span className="text-xs font-bold leading-tight uppercase pr-2">{label}</span>
      {checklist[id] ? <Check size={16} className="flex-shrink-0" /> : <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 group-hover:border-brand-400" />}
    </button>
  );

  const PPECARD = ({ id, label, icon: Icon }: { id: keyof SafetyChecklist, label: string, icon: any }) => (
    <button
      onClick={() => toggleCheck(id)}
      disabled={!!activeSession}
      className={`
        flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all aspect-square
        ${checklist[id] 
          ? 'border-brand-600 bg-brand-50 text-brand-600 shadow-inner' 
          : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200'}
      `}
    >
      <Icon size={24} className="mb-2" />
      <span className="text-[9px] font-black uppercase text-center leading-none">{label}</span>
    </button>
  );

  if (initializing) return <div className="flex flex-col items-center justify-center p-20 text-gray-400"><Loader2 className="animate-spin mb-4" /> Loading tracking session...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
          <ShieldCheck className="text-brand-600 w-8 h-8" />
          Shift Clock
        </h2>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
          <AlertCircle className="flex-shrink-0" />
          <p className="text-sm font-bold">{errorMsg}</p>
        </div>
      )}

      {/* SAFETY CHECKLIST CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-brand-900 text-white">
          <h3 className="font-black text-xl uppercase tracking-widest">Pre-Shift Safety Check</h3>
          <p className="text-brand-300 text-[10px] font-bold mt-1 uppercase">COMPLIANCE WITH SAFETY PLAN OF ACTION & PPE REQUIREMENTS</p>
        </div>

        <div className="p-6 space-y-8">
          {/* PPE SECTION */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-xs">01</span>
              <h4 className="font-black text-gray-800 uppercase tracking-tighter text-sm">PPE Required (Please Tick Box)</h4>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
              <PPECARD id="highVis" label="High Vis" icon={Construction} />
              <PPECARD id="helmet" label="Helmet" icon={HardHat} />
              <PPECARD id="goggles" label="Safety Goggles" icon={Glasses} />
              <PPECARD id="gloves" label="Correct Gloves" icon={HandMetal} />
              <PPECARD id="mask" label="Mask" icon={Wind} />
              <PPECARD id="earMuffs" label="Ear Muffs" icon={Ear} />
              <PPECARD id="faceGuard" label="Face Guard" icon={ScanEye} />
              <PPECARD id="harness" label="Harness" icon={Strikethrough} />
              <PPECARD id="boots" label="Boots" icon={Construction} />
            </div>
          </div>

          {/* SAFETY PLAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">02</span>
                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-sm">Safety Plan of Action</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <CheckItem id="knowSafeJob" label="Know how to complete job safely?" />
                <CheckItem id="weatherCheck" label="Weather conditions appropriate?" />
                <CheckItem id="safePassInDate" label="Safe Pass in date?" />
                <CheckItem id="slipTripAware" label="Aware of slip, trip, fall hazards?" />
                <CheckItem id="wetFloorsCleaned" label="Wet floors cleaned in advance?" />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">03</span>
                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-sm">Lifting Plan</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <CheckItem id="manualHandlingCert" label="Manual Handling Cert completed?" />
                <CheckItem id="heavyLiftingAssistance" label="2 people needed for heavy lifting?" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs">04</span>
                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-sm">Working at Heights</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <CheckItem id="anchorPointsTie" label="Tie onto anchor points?" />
                <CheckItem id="ladderFooted" label="One person to foot end of ladder?" />
                <CheckItem id="safetySigns" label="Safety cones/signs necessary?" />
                <CheckItem id="commWithOthers" label="Pedestrians/vehicles informed?" />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xs">05</span>
                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-sm">Equipment Checked</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <CheckItem id="ladderCheck" label="Ladders check complete?" />
                <CheckItem id="sharpEdgesCheck" label="Check for sharp edges?" />
                <CheckItem id="scraperBladeCovers" label="Check covers on scraper blades?" />
                <CheckItem id="hotSurfacesCheck" label="Check for hot surfaces?" />
                <CheckItem id="chemicalCourseComplete" label="Chemical Awareness course complete?" />
                <CheckItem id="chemicalDilutionAware" label="Aware of dilution rates & safety?" />
                <CheckItem id="equipmentTidy" label="All equipment tidy during work?" />
                <CheckItem id="laddersPutAway" label="Ladders dismantled & put away?" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHIFT ACTIONS */}
      {!activeSession && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-brand-600 mb-2 uppercase tracking-widest">Active Work Location</label>
            <div className="relative">
              <select
                className="w-full rounded-xl border-gray-200 p-4 appearance-none bg-gray-50 border font-black text-gray-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-lg"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              >
                <option value="">-- Choose Assigned Location --</option>
                {availableLocations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>{loc.name} ({loc.address})</option>
                ))}
              </select>
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-600 pointer-events-none" size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex flex-col justify-end">
                <Button 
                    onClick={handleStartShift} 
                    size="lg" 
                    className="w-full h-44 text-2xl font-black bg-brand-600 text-white hover:bg-brand-700 border-none shadow-2xl flex flex-col items-center justify-center gap-2 rounded-2xl"
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={48} /> : (
                        <>
                            <PlayCircle size={48} />
                            <span className="uppercase tracking-tighter">Start Shift Now</span>
                        </>
                    )}
                </Button>
             </div>
          </div>
        </div>
      )}

      {activeSession && (
        <div className="bg-green-600 p-10 rounded-3xl text-center shadow-2xl space-y-8 animate-fade-in border-4 border-green-500/50">
           <div>
              <p className="text-green-100 font-black uppercase text-xs tracking-[0.2em] mb-4">Shift in Progress • {activeSession.locationName}</p>
              <div className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">{formatTime(elapsedTime)}</div>
           </div>
           
           <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
              <Button 
                  onClick={handleEndShift} 
                  variant="danger" 
                  className="w-full h-20 text-xl font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 border-none bg-red-600 hover:bg-red-700"
                  disabled={isProcessing}
              >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <StopCircle size={28} className="text-white" />} 
                  <span className="uppercase tracking-tighter text-white">Finish and Clock Out</span>
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};