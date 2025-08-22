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
}

export function GlobalMetronome({ settings, onSettingsChange, audioContext }: GlobalMetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (audioContext && !audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine();
      audioEngineRef.current.initialize();
    }
  }, [audioContext]);

  useEffect(() => {
    if (settings.isActive && !isPlaying) {
      startMetronome();
    } else if (!settings.isActive && isPlaying) {
      stopMetronome();
    }
  }, [settings.isActive]);

  const startMetronome = async () => {
    if (!audioEngineRef.current || !audioContext) return;

    setIsPlaying(true);
    setCurrentBeat(0);
    
    const countInBeats = parseInt(settings.countIn);
    let beatCount = 0;
    let isCountingIn = true;
    
    const scheduleNextBeat = () => {
      if (!isPlaying) return;
      
      const now = audioContext.currentTime;
      const beatInterval = 60 / settings.bpm;
      const nextBeatTime = now + beatInterval;
      
      // Create metronome click
      const isAccent = (beatCount % 4) === 0;
      audioEngineRef.current?.createClick(isAccent, nextBeatTime);
      
      // Update visual beat indicator
      setCurrentBeat(beatCount % 4);
      
      beatCount++;
      
      // Check if count-in is complete
      if (isCountingIn && beatCount >= countInBeats) {
        isCountingIn = false;
        beatCount = 0;
      }
      
      // Schedule next beat
      const timeoutDelay = (nextBeatTime - audioContext.currentTime) * 1000;
      setTimeout(scheduleNextBeat, Math.max(0, timeoutDelay - 5)); // 5ms early for precision
    };
    
    scheduleNextBeat();
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
    audioEngineRef.current?.stop();
  };

  const toggleMetronome = () => {
    const newState = !settings.isActive;
    onSettingsChange({ ...settings, isActive: newState });
  };

  const updateBPM = (newBpm: number[]) => {
    onSettingsChange({ ...settings, bpm: newBpm[0] });
  };

  const updateCountIn = (value: string) => {
    onSettingsChange({ ...settings, countIn: value as "4" | "8" });
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
            {settings.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {settings.isActive ? 'Stop' : 'Start'}
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* BPM Control */}
          <div className="flex items-center space-x-3">
            <label className="app-text-secondary font-medium">BPM:</label>
            <span className="text-xl font-mono app-bg px-3 py-1 rounded" data-testid="text-metronome-bpm">
              {settings.bpm}
            </span>
            <Slider
              value={[settings.bpm]}
              onValueChange={updateBPM}
              min={20}
              max={240}
              step={1}
              className="w-24 sm:w-32"
              data-testid="slider-metronome-bpm"
            />
          </div>
          
          {/* Count-in */}
          <div className="flex items-center space-x-3">
            <label className="app-text-secondary font-medium">Count-in:</label>
            <Select value={settings.countIn} onValueChange={updateCountIn}>
              <SelectTrigger className="w-32 app-bg border-[var(--app-elevated)]" data-testid="select-count-in">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="app-surface border-[var(--app-elevated)]">
                <SelectItem value="4">1 Bar (4 beats)</SelectItem>
                <SelectItem value="8">2 Bars (8 beats)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
      {isPlaying && (
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
