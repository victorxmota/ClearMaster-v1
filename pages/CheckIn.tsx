
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { Database } from '../services/database';
import { TimeRecord, SafetyChecklist } from '../types';
import { Button } from '../components/ui/Button';
import { Camera, ShieldCheck, PlayCircle, StopCircle, Check, MapPin, Loader2 } from 'lucide-react';

export const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeRecord | null>(null);
  const [locationName, setLocationName] = useState('');
  const [availableLocations, setAvailableLocations] = useState<{name: string, address: string}[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Start Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // End Photo
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);
  const [endPhotoFile, setEndPhotoFile] = useState<File | null>(null);

  const [checklist, setChecklist] = useState<SafetyChecklist>({
    gloves: false,
    boots: false,
    vest: false,
    chemicalsSafe: false
  });
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
          
          // Verificação explícita para garantir que o checklist existe e corresponde ao tipo
          if (session.safetyChecklist) {
            setChecklist(session.safetyChecklist);
          }
          
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
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error(err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleStartShift = async () => {
    if (!user || !locationName || !photoFile) {
      alert("Location and Photo are required.");
      return;
    }

    setIsProcessing(true);
    const location = await getCurrentLocation();
    
    try {
        const recordData: Omit<TimeRecord, 'id' | 'photoUrl'> = {
          userId: user.id,
          locationName,
          startTime: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          safetyChecklist: checklist,
          startLocation: location || undefined
        };

        const newRecord = await Database.startShift(recordData, photoFile);
        setActiveSession(newRecord);
    } catch (error) {
        console.error(error);
        alert("Error starting shift. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeSession || !endPhotoFile) {
        alert("Final photo required.");
        return;
    }
    
    setIsProcessing(true);
    const location = await getCurrentLocation();

    try {
      await Database.endShift(activeSession.id, {
        endTime: new Date().toISOString(),
        endLocation: location || undefined
      }, endPhotoFile);
      
      setActiveSession(null);
      setPhotoPreview(null);
      setPhotoFile(null);
      setEndPhotoPreview(null);
      setEndPhotoFile(null);
      setLocationName('');
      setChecklist({ gloves: false, boots: false, vest: false, chemicalsSafe: false });
    } catch (error) {
      console.error(error);
      alert("Error ending shift.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCheck = (key: keyof SafetyChecklist) => {
    if (!activeSession) {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  if (initializing) return <div className="text-center p-8">Loading session...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <ShieldCheck className="text-brand-600" />
        Time Tracking
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Safety Checklist</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'gloves', label: 'Protective Gloves' },
            { key: 'boots', label: 'Non-slip Boots' },
            { key: 'vest', label: 'Reflective Vest' },
            { key: 'chemicalsSafe', label: 'Safe Chemicals' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => toggleCheck(item.key as keyof SafetyChecklist)}
              disabled={!!activeSession}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 transition-all
                ${checklist[item.key as keyof SafetyChecklist] 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 text-gray-500 hover:border-brand-200'}
              `}
            >
              <span className="font-medium">{item.label}</span>
              {checklist[item.key as keyof SafetyChecklist] && <Check size={20} />}
            </button>
          ))}
        </div>
      </div>

      {!activeSession && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
            <div className="relative">
              <select
                className="w-full rounded-md border-gray-300 p-2 appearance-none bg-white border"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              >
                <option value="">Select a location...</option>
                {availableLocations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>{loc.name} - {loc.address}</option>
                ))}
              </select>
              <MapPin className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Photo</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {photoPreview ? <img src={photoPreview} alt="Preview" className="h-28 object-contain" /> : <Camera className="w-8 h-8 text-gray-500" />}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoSelect(e, false)} />
            </label>
          </div>
        </div>
      )}

      <div className={`p-8 rounded-xl text-center transition-all ${activeSession ? 'bg-green-50 border border-green-200' : 'bg-brand-50 border border-brand-200'}`}>
        {activeSession ? (
          <div className="space-y-6">
             <div className="animate-pulse">
                <p className="text-green-800 font-semibold uppercase">In Progress</p>
                <div className="text-5xl font-mono font-bold text-green-700 mt-2">{formatTime(elapsedTime)}</div>
             </div>
             
             <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {endPhotoPreview ? <img src={endPhotoPreview} alt="Preview" className="h-28 object-contain" /> : <Camera className="w-8 h-8 text-gray-500" />}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoSelect(e, true)} />
                </label>
             </div>

             <Button 
                onClick={handleEndShift} 
                variant="danger" 
                size="lg" 
                className="w-full"
                disabled={!endPhotoFile || isProcessing}
             >
                 {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <StopCircle className="mr-2"/>} End Shift
             </Button>
          </div>
        ) : (
          <Button 
            onClick={handleStartShift} 
            size="lg" 
            className="w-full"
            disabled={isProcessing}
            >
            {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <PlayCircle className="mr-2"/>} Start Work
          </Button>
        )}
      </div>
    </div>
  );
};
