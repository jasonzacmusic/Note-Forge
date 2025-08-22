import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioEngine } from "./audio-engine";
import type { AppSettings } from "@shared/schema";

interface GlobalMetronomeProps {
  settings: AppSettings['globalMetronome'];
  onSettingsChange: (settings: AppSettings['globalMetronome']) => void;
  audioContext: AudioContext | null;
  currentBpm: number;
  isCurrentModePlayingBack: boolean;
}

export function GlobalMetronome({ settings, onSettingsChange, audioContext, currentBpm, isCurrentModePlayingBack }: GlobalMetronomeProps) {
  const [currentBeat, setCurrentBeat] = useState(0);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioContext && !audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine();
      audioEngineRef.current.initialize();
    }
  }, [audioContext]);

  // Only play metronome when it's active AND the current mode is playing
  const shouldPlayMetronome = settings.isActive && isCurrentModePlayingBack;
  
  useEffect(() => {
    if (shouldPlayMetronome) {
      startMetronomeBeats();
    } else {
      stopMetronomeBeats();
    }
  }, [shouldPlayMetronome, currentBpm, isCurrentModePlayingBack]);

  // Listen for global stop event and stop metronome
  useEffect(() => {
    const handleStopAllAudio = () => {
      stopMetronomeBeats();
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => window.removeEventListener('stopAllAudio', handleStopAllAudio);
  }, []);

  const startMetronomeBeats = () => {
    if (!audioContext) return;
    
    stopMetronomeBeats(); // Clear any existing interval
    
    // Metronome ALWAYS plays quarter notes regardless of subdivision
    const beatInterval = 60 / currentBpm; // Quarter note intervals in seconds
    let beatCount = 0;
    let nextBeatTime = audioContext.currentTime;
    
    const playBeat = () => {
      if (!settings.isActive) return;
      
      // Accent on beats 1 and 3 (standard quarter note accenting)
      const isAccent = (beatCount % 4) === 0 || (beatCount % 4) === 2;
      const frequency = isAccent ? 1200 : 800;
      const duration = isAccent ? 0.1 : 0.05;
      
      // Schedule click at precise Web Audio time
      const playTime = nextBeatTime;
      
      // Create click sound with proper volume
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, playTime);
        oscillator.type = 'square';
        
        const volume = (settings.volume / 100) * 0.3; // Scale volume
        gainNode.gain.setValueAtTime(0, playTime);
        gainNode.gain.linearRampToValueAtTime(volume, playTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + duration);
        
        oscillator.start(playTime);
        oscillator.stop(playTime + duration);
      }
      
      setCurrentBeat(beatCount % 4);
      beatCount++;
      
      // Schedule next beat using Web Audio precision
      nextBeatTime += beatInterval;
      
      // Schedule callback slightly before next beat time
      const timeUntilNext = Math.max(0, (nextBeatTime - audioContext.currentTime) * 1000 - 25);
      metronomeIntervalRef.current = setTimeout(playBeat, timeUntilNext);
    };
    
    // Start immediately
    playBeat();
  };

  const stopMetronomeBeats = () => {
    if (metronomeIntervalRef.current) {
      clearTimeout(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    setCurrentBeat(0);
  };

  const toggleMetronome = () => {
    const newState = !settings.isActive;
    onSettingsChange({ ...settings, isActive: newState });
  };



  const updateVolume = (newVolume: number[]) => {
    onSettingsChange({ ...settings, volume: newVolume[0] });
  };

  return (
    <div className="app-surface rounded-xl p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-[var(--app-secondary)]">
            🕐 Global Metronome
          </h2>
          <Button
            onClick={toggleMetronome}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              settings.isActive 
                ? 'app-success hover:bg-green-600' 
                : 'app-primary hover:bg-blue-600'
            } text-white`}
            data-testid="button-toggle-metronome"
          >
            {settings.isActive ? 'ON' : 'OFF'}
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Volume */}
          <div className="flex items-center space-x-3">
            <Volume2 className="h-4 w-4 app-text-secondary" />
            <Slider
              value={[settings.volume]}
              onValueChange={updateVolume}
              min={0}
              max={100}
              step={1}
              className="w-20"
              data-testid="slider-metronome-volume"
            />
          </div>
        </div>
      </div>

      {/* Beat Indicator */}
      {settings.isActive && (
        <div className="flex justify-center mt-4 space-x-2">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                beat === currentBeat
                  ? beat === 0 
                    ? 'metronome-beat accent' 
                    : 'metronome-beat subdivision'
                  : 'bg-[var(--app-elevated)]'
              }`}
              data-testid={`beat-indicator-${beat}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
