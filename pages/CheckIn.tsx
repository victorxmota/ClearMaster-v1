import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { MockDB } from '../services/mockDatabase';
import { TimeRecord } from '../types';
import { Button } from '../components/ui/Button';
import { Camera, ShieldCheck, PlayCircle, StopCircle, Check, MapPin } from 'lucide-react';

export const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeRecord | null>(null);
  const [locationName, setLocationName] = useState('');
  const [availableLocations, setAvailableLocations] = useState<{name: string, address: string}[]>([]);
  
  // Start Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // End Photo State
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    gloves: false,
    boots: false,
    vest: false,
    chemicalsSafe: false
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Restore session
    const session = MockDB.getActiveSession();
    if (session) {
      setActiveSession(session);
      setLocationName(session.locationName);
      setChecklist(session.safetyChecklist);
      setPhotoPreview(session.photoUrl || null);
    }

    // Load user schedules for location dropdown
    if (user) {
      const schedules = MockDB.getSchedulesByUser(user.id);
      // Deduplicate locations
      const uniqueLocs = new Map();
      schedules.forEach(s => {
        if (!uniqueLocs.has(s.locationName)) {
          uniqueLocs.set(s.locationName, s.address);
        }
      });
      
      const locs = Array.from(uniqueLocs.entries()).map(([name, address]) => ({
        name,
        address
      }));
      setAvailableLocations(locs);
    }
  }, [user]);

  useEffect(() => {
    // Timer logic
    if (activeSession) {
      const startTime = new Date(activeSession.startTime).getTime();
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEndPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEndPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartShift = () => {
    if (!user || !locationName) {
      alert("Please select the work location.");
      return;
    }
    
    if (!photoPreview) {
      alert("The initial photo of the location is required.");
      return;
    }

    const newRecord: TimeRecord = {
      id: Date.now().toString(),
      userId: user.id,
      locationName,
      startTime: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      safetyChecklist: checklist,
      photoUrl: photoPreview || undefined,
    };

    setActiveSession(newRecord);
    MockDB.setActiveSession(newRecord);
  };

  const handleEndShift = () => {
    if (!activeSession) return;
    
    if (!endPhotoPreview) {
      alert("Please add the final photo of the completed service before ending.");
      return;
    }
    
    // Logic updated: Removed window.confirm to prevent blocking issues on mobile devices.
    // The requirement for the photo serves as enough confirmation.
    
    try {
      const completedRecord: TimeRecord = {
        ...activeSession,
        endTime: new Date().toISOString(),
        endPhotoUrl: endPhotoPreview || undefined
      };
      
      MockDB.saveTimeRecord(completedRecord);
      MockDB.setActiveSession(null);
      setActiveSession(null);
      
      // Reset local state
      setLocationName('');
      setPhotoPreview(null);
      setEndPhotoPreview(null);
      setChecklist({ gloves: false, boots: false, vest: false, chemicalsSafe: false });
    } catch (error) {
      console.error("Error ending shift:", error);
      alert("An error occurred while trying to end the shift. Please try again.");
    }
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    if (!activeSession) {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <ShieldCheck className="text-brand-600" />
        Time Tracking
      </h2>

      {/* Safety Checklist Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Safety Checklist</h3>
        <p className="text-sm text-gray-500 mb-4">Check the safety items used (Optional).</p>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'gloves', label: 'Protective Gloves' },
            { key: 'boots', label: 'Non-slip Boots' },
            { key: 'vest', label: 'Reflective Vest' },
            { key: 'chemicalsSafe', label: 'Safe Chemicals' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => toggleCheck(item.key as keyof typeof checklist)}
              disabled={!!activeSession}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 transition-all
                ${checklist[item.key as keyof typeof checklist] 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 text-gray-500 hover:border-brand-200'}
              `}
            >
              <span className="font-medium">{item.label}</span>
              {checklist[item.key as keyof typeof checklist] && <Check size={20} />}
            </button>
          ))}
        </div>
      </div>

      {/* Location & Photo (Start Phase) */}
      {!activeSession && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
            <div className="relative">
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 appearance-none bg-white"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              >
                <option value="">Select a location...</option>
                {availableLocations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>
                    {loc.name} - {loc.address}
                  </option>
                ))}
              </select>
              <MapPin className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
            </div>
            {availableLocations.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No scheduled location. Contact administrator.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Photo (Required)</label>
            <div className="flex items-center gap-4">
               <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-28 object-contain" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">Click to take photo</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Area (Active Phase) */}
      <div className={`p-8 rounded-xl text-center transition-all ${activeSession ? 'bg-green-50 border border-green-200' : 'bg-brand-50 border border-brand-200'}`}>
        {activeSession ? (
          <div className="space-y-6">
             <div className="animate-pulse">
                <p className="text-green-800 font-semibold uppercase tracking-wider text-sm">In Progress</p>
                <div className="text-5xl font-mono font-bold text-green-700 mt-2">
                  {formatTime(elapsedTime)}
                </div>
             </div>
             <p className="text-gray-600">Location: <strong>{activeSession.locationName}</strong></p>
             
             {/* End Photo Section */}
             <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Photo (Required)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {endPhotoPreview ? (
                      <img src={endPhotoPreview} alt="End Preview" className="h-28 object-contain" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">Click for finished service photo</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleEndPhotoUpload} />
                </label>
             </div>

             <div className="pt-2">
               <Button 
                type="button"
                onClick={handleEndShift} 
                variant="danger" 
                size="lg" 
                className="shadow-lg shadow-red-200 w-full md:w-auto"
                disabled={!endPhotoPreview}
               >
                 <StopCircle className="mr-2" /> End Shift
               </Button>
             </div>
          </div>
        ) : (
          <Button 
            type="button"
            onClick={handleStartShift} 
            size="lg" 
            className="w-full md:w-auto shadow-lg shadow-brand-200 py-4 text-lg"
            >
            <PlayCircle className="mr-2" /> Start Work
          </Button>
        )}
      </div>
    </div>
  );
};
