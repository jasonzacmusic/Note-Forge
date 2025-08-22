import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MusicTheory } from "./music-theory";
import { AudioEngine } from "./audio-engine";
import type { ProgressionsModeSettings, Chord } from "@shared/schema";

interface ProgressionsModeProps {
  settings: ProgressionsModeSettings;
  onSettingsChange: (settings: ProgressionsModeSettings) => void;
  audioContext: AudioContext | null;
}

export function ProgressionsMode({ settings, onSettingsChange, audioContext }: ProgressionsModeProps) {
  const [audioEngine] = useState(() => new AudioEngine());
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioContext) {
      audioEngine.initialize();
    }

    // Listen for global stop event
    const handleStopAllAudio = () => {
      audioEngine.stop();
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      setCurrentChordIndex(0);
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => window.removeEventListener('stopAllAudio', handleStopAllAudio);
  }, [audioContext, audioEngine]);

  useEffect(() => {
    // Generate progression when key or progression type changes
    const progression = MusicTheory.getProgression(settings.selectedProgression, settings.selectedKey);
    onSettingsChange({ ...settings, currentProgression: progression });
  }, [settings.selectedKey, settings.selectedProgression]);

  useEffect(() => {
    if (settings.playback.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [settings.playback.isPlaying]);

  // Restart playback when BPM changes to apply new tempo immediately
  useEffect(() => {
    if (settings.playback.isPlaying) {
      stopPlayback();
      const timer = setTimeout(() => {
        startPlayback();
      }, 50); // Small delay to ensure cleanup completes
      
      return () => clearTimeout(timer);
    }
  }, [settings.playback.bpm]);

  // Restart playback when subdivision or swing changes to apply new timing immediately
  useEffect(() => {
    if (settings.playback.isPlaying) {
      stopPlayback();
      const timer = setTimeout(() => {
        startPlayback();
      }, 50); // Small delay to ensure cleanup completes
      
      return () => clearTimeout(timer);
    }
  }, [settings.playback.subdivision, settings.playback.swing]);

  const startPlayback = () => {
    if (!settings.currentProgression) return;

    let currentChordIndex = settings.cycleStart;
    let playbackRepetition = 0;
    
    const scheduleChord = () => {
      if (!settings.playback.isPlaying || !settings.currentProgression) return;

      // Dynamically calculate repetitions per bar based on current subdivision  
      const getRepetitionsPerBar = (subdivision: string) => {
        switch (subdivision) {
          case "1": return 4;  // Quarter notes: 4 per bar
          case "2": return 8;  // Quavers: 8 per bar
          case "3": return 12; // Triplets: 12 per bar  
          case "4": return 16; // Semiquavers: 16 per bar
          default: return 4;
        }
      };
      
      const repetitionsPerBar = getRepetitionsPerBar(settings.playback.subdivision);
      const chordInterval = (60 / settings.playback.bpm) / (repetitionsPerBar / 4); // Time between repetitions

      const chord = settings.currentProgression.chords[currentChordIndex];
      setCurrentChordIndex(currentChordIndex);
      
      // Play chord notes simultaneously  
      chord.notes.forEach((noteName, noteIndex) => {
        const frequency = AudioEngine.midiToFrequency(MusicTheory.getMidiFromNote(noteName, 4));
        const delay = noteIndex * 0.03; // Slight arpeggio effect
        audioEngine.playNote(frequency, 0.8, (audioContext?.currentTime || 0) + delay);
      });

      playbackRepetition++;
      
      // Move to next chord after completing all repetitions for current chord
      if (playbackRepetition >= repetitionsPerBar) {
        currentChordIndex = (currentChordIndex + 1) % settings.currentProgression.chords.length;
        playbackRepetition = 0;
      }
      
      playbackTimeoutRef.current = setTimeout(scheduleChord, chordInterval * 1000);
    };

    scheduleChord();
  };

  const stopPlayback = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    audioEngine.stop();
    setCurrentChordIndex(0);
  };

  const togglePlayback = () => {
    onSettingsChange({
      ...settings,
      playback: {
        ...settings.playback,
        isPlaying: !settings.playback.isPlaying
      }
    });
  };

  const updateKey = (selectedKey: string) => {
    onSettingsChange({ ...settings, selectedKey });
  };

  const updateProgression = (selectedProgression: 'dorian' | 'pop' | 'jazz') => {
    onSettingsChange({ ...settings, selectedProgression });
  };

  const updateCycleStart = (cycleStart: number) => {
    onSettingsChange({ ...settings, cycleStart });
  };

  const updateBPM = (bpm: number[]) => {
    onSettingsChange({
      ...settings,
      playback: { ...settings.playback, bpm: bpm[0] }
    });
  };

  const updateSubdivision = (subdivision: "1" | "2" | "3" | "4") => {
    onSettingsChange({
      ...settings,
      playback: { ...settings.playback, subdivision }
    });
  };

  const keys = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F',
    'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'
  ];

  const progressionOptions = [
    { value: 'dorian', label: 'Dorian Rock (i – ♭III – ♭VII – IV)' },
    { value: 'pop', label: 'Pop (vi – IV – I – V)' },
    { value: 'jazz', label: 'Jazz (vi – ii – V – I)' }
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--app-primary)]">
              🎵 Chord Progressions
            </h3>
            
            {/* Key Selection */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-2">Key</Label>
              <Select value={settings.selectedKey} onValueChange={updateKey}>
                <SelectTrigger className="w-full app-bg border-[var(--app-elevated)]" data-testid="select-key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="app-surface border-[var(--app-elevated)]">
                  {keys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key.includes('m') ? `${key} Minor` : `${key} Major`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Progression Selection */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-2">Progression</Label>
              <Select value={settings.selectedProgression} onValueChange={updateProgression}>
                <SelectTrigger className="w-full app-bg border-[var(--app-elevated)]" data-testid="select-progression">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="app-surface border-[var(--app-elevated)]">
                  {progressionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Cycle Start */}
            {(settings.selectedProgression === 'pop' || settings.selectedProgression === 'jazz') && (
              <div className="mb-6">
                <Label className="block app-text-secondary font-medium mb-2">Start From</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((start) => (
                    <Button
                      key={start}
                      onClick={() => updateCycleStart(start)}
                      className={`p-2 rounded font-medium ${
                        settings.cycleStart === start
                          ? 'app-primary text-white'
                          : 'app-bg app-text-secondary hover:app-elevated'
                      }`}
                      data-testid={`button-cycle-start-${start}`}
                    >
                      Chord {start + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Playback Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium app-text-secondary">Playback</h4>
                <Button
                  onClick={togglePlayback}
                  disabled={!settings.currentProgression}
                  className="px-4 py-2 app-success hover:bg-green-600 rounded-lg font-medium transition-colors text-white"
                  data-testid="button-toggle-playback-progressions"
                >
                  {settings.playback.isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {settings.playback.isPlaying ? 'Stop' : 'Play'}
                </Button>
              </div>
              
              {/* BPM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="app-text-secondary font-medium">BPM</Label>
                  <span className="text-lg font-mono" data-testid="text-progressions-bpm">{settings.playback.bpm}</span>
                </div>
                <Slider
                  value={[settings.playback.bpm]}
                  onValueChange={updateBPM}
                  min={20}
                  max={240}
                  step={1}
                  className="w-full"
                  data-testid="slider-progressions-bpm"
                />
              </div>
              
              {/* Subdivision */}
              <div>
                <Label className="block app-text-secondary font-medium mb-2">Subdivision</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "1", label: "1× Quarter" },
                    { value: "2", label: "2× Quavers" },
                    { value: "3", label: "3× Triplets" },
                    { value: "4", label: "4× Semiquavers" }
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      onClick={() => updateSubdivision(value as "1" | "2" | "3" | "4")}
                      className={`p-2 rounded font-medium ${
                        settings.playback.subdivision === value
                          ? 'subdivision-button active'
                          : 'subdivision-button'
                      }`}
                      data-testid={`button-subdivision-progressions-${value}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chord Display */}
        <div className="lg:col-span-2">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 text-[var(--app-secondary)]">Chord Progression</h3>
            
            {settings.currentProgression ? (
              <>
                {/* Roman Numeral Display */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold app-accent mb-2" data-testid="text-roman-numerals">
                    {settings.currentProgression.chords.map(chord => chord.romanNumeral).join(' – ')}
                  </div>
                  <div className="app-text-secondary">
                    {settings.currentProgression.name} in {settings.selectedKey} {settings.currentProgression.mode}
                  </div>
                </div>
                
                {/* Chord Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {settings.currentProgression.chords.map((chord, index) => (
                    <div
                      key={index}
                      className={`app-bg rounded-lg p-4 text-center border-2 transition-all ${
                        currentChordIndex === index && settings.playback.isPlaying
                          ? 'border-[var(--app-primary)] shadow-lg'
                          : 'border-transparent'
                      }`}
                      data-testid={`chord-card-${index}`}
                    >
                      <div className="text-xl font-bold mb-2 app-text-primary">
                        {chord.root}{chord.quality === 'minor' ? 'm' : chord.quality === 'diminished' ? '°' : ''}
                        {chord.extension || ''}
                      </div>
                      <div className="app-text-secondary text-sm mb-2">{chord.romanNumeral}</div>
                      <div className="text-xs app-text-secondary space-y-1">
                        <div>{chord.notes.join(' - ')}</div>
                        <div>(R - {chord.quality === 'minor' ? 'm3' : 'M3'} - P5{chord.extension ? ` - ${chord.extension}` : ''})</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Theory Information */}
                <div className="app-bg rounded-lg p-4">
                  <h4 className="font-medium mb-2 app-accent">Harmonic Analysis</h4>
                  <div className="app-text-secondary text-sm space-y-1">
                    {settings.selectedProgression === 'dorian' && (
                      <>
                        <p>• Modal interchange from {settings.selectedKey} Dorian mode</p>
                        <p>• Natural minor i chord establishes tonic</p>
                        <p>• ♭VII creates characteristic Dorian sound</p>
                      </>
                    )}
                    {settings.selectedProgression === 'pop' && (
                      <>
                        <p>• Popular vi-IV-I-V progression in {settings.selectedKey}</p>
                        <p>• Creates strong sense of resolution to tonic</p>
                        <p>• Commonly used in contemporary music</p>
                      </>
                    )}
                    {settings.selectedProgression === 'jazz' && (
                      <>
                        <p>• Classic jazz ii-V-I turnaround in {settings.selectedKey}</p>
                        <p>• Strong harmonic movement through circle of fifths</p>
                        <p>• Foundation of jazz harmony</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 app-text-secondary">
                Select a key and progression to view chords
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
