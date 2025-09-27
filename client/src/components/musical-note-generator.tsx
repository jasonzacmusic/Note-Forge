import { useState, useEffect, useRef } from "react";
import { Music, Download, Upload, Play, Pause, Volume2 } from "lucide-react";
import { AudioEngine } from "./audio-engine";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlobalMetronome } from "./metronome";
import { ThemeToggle } from "./theme-toggle";
import { RandomMode } from "./mode-random";
import { ProgressionsMode } from "./mode-progressions";
import { PatternsMode } from "./mode-patterns";
import { GlossaryMode } from "./mode-glossary";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAudio } from "@/hooks/use-audio";
import type { AppSettings } from "@shared/schema";

const defaultSettings: AppSettings = {
  globalMetronome: {
    isActive: false,
    volume: 75
  },
  globalAudio: {
    waveType: "piano"
  },
  currentMode: "random",
  randomMode: {
    difficulty: "beginner",
    noteSelection: "all",
    generatedNotes: [],
    playback: {
      isPlaying: false,
      bpm: 120,
      subdivision: "1",
      swing: 50,
      volume: 75
    }
  },
  progressionsMode: {
    selectedKey: "C",
    selectedProgression: "dorian",
    cycleStart: 0,
    playback: {
      isPlaying: false,
      bpm: 100,
      subdivision: "1",
      swing: 50,
      volume: 75
    }
  },
  patternsMode: {
    patternType: "circle-cw",
    startingNote: "C",
    currentPattern: [],
    playback: {
      isPlaying: false,
      bpm: 80,
      subdivision: "1",
      swing: 50,
      volume: 75
    }
  },
  history: []
};

export function MusicalNoteGenerator() {
  const [settings, setSettings] = useLocalStorage<AppSettings>("musical-note-generator", defaultSettings);
  const { initializeAudio, audioContext } = useAudio();
  const [audioEngine] = useState(() => new AudioEngine());
  const [metronomeAudioEngine] = useState(() => new AudioEngine());
  const [currentBeat, setCurrentBeat] = useState(0);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [initializeAudio]);

  // Initialize audio engine with context
  useEffect(() => {
    if (audioContext) {
      audioEngine.initialize(audioContext);
    }
  }, [audioContext, audioEngine]);

  // Initialize metronome audio engine
  useEffect(() => {
    if (audioContext) {
      metronomeAudioEngine.initialize(audioContext);
    }
  }, [audioContext, metronomeAudioEngine]);

  // Get current BPM for metronome
  const getCurrentBpm = () => {
    const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
    const modeSettings = settings[modeKey] as any;
    return modeSettings?.playback?.bpm || 120;
  };

  // Check if current mode is playing
  const isCurrentModePlayingBack = () => {
    const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
    const modeSettings = settings[modeKey] as any;
    return modeSettings?.playback?.isPlaying || false;
  };

  // Metronome functionality
  const shouldPlayMetronome = settings.globalMetronome.isActive && isCurrentModePlayingBack();
  
  useEffect(() => {
    if (shouldPlayMetronome) {
      startMetronomeBeats();
    } else {
      stopMetronomeBeats();
    }
  }, [shouldPlayMetronome, getCurrentBpm(), isCurrentModePlayingBack()]);

  const startMetronomeBeats = () => {
    if (!audioContext) return;
    
    stopMetronomeBeats();
    
    const currentBpm = getCurrentBpm();
    const beatInterval = 60 / currentBpm;
    let beatCount = 0;
    let nextBeatTime = audioContext.currentTime + 0.1;
    
    const playBeat = () => {
      if (!settings.globalMetronome.isActive || !audioContext) return;
      
      const frequency = 1000;
      const duration = 0.08;
      const playTime = nextBeatTime;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, playTime);
      oscillator.type = 'square';
      
      const volume = (settings.globalMetronome.volume / 100) * 0.3;
      gainNode.gain.setValueAtTime(0, playTime);
      gainNode.gain.linearRampToValueAtTime(volume, playTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + duration);
      
      oscillator.start(playTime);
      oscillator.stop(playTime + duration);
      
      setCurrentBeat(beatCount % 4);
      beatCount++;
      
      nextBeatTime += beatInterval;
      const timeUntilNext = Math.max(0, (nextBeatTime - audioContext.currentTime) * 1000 - 25);
      metronomeIntervalRef.current = setTimeout(playBeat, timeUntilNext);
    };
    
    playBeat();
  };

  const stopMetronomeBeats = () => {
    if (metronomeIntervalRef.current) {
      clearTimeout(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    setCurrentBeat(0);
  };

  // Listen for global stop event
  useEffect(() => {
    const handleStopAllAudio = () => {
      stopMetronomeBeats();
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => window.removeEventListener('stopAllAudio', handleStopAllAudio);
  }, []);

  // Preview audio sample function
  const previewAudioSample = (waveType: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano') => {
    if (audioContext && audioEngine.isInitialized()) {
      // Play middle C (261.63 Hz) for half a second as preview
      audioEngine.playNote(261.63, 0.5, undefined, waveType);
    }
  };


  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'musical-note-generator-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setSettings({ ...defaultSettings, ...imported });
          } catch (error) {
            console.error('Failed to import settings:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const switchTab = (mode: AppSettings['currentMode']) => {
    // Immediately stop ALL playback in all modes
    setSettings(prev => ({
      ...prev,
      currentMode: mode,
      randomMode: {
        ...prev.randomMode,
        playback: { ...prev.randomMode.playback, isPlaying: false }
      },
      progressionsMode: {
        ...prev.progressionsMode,
        playback: { ...prev.progressionsMode.playback, isPlaying: false }
      },
      patternsMode: {
        ...prev.patternsMode,
        playback: { ...prev.patternsMode.playback, isPlaying: false }
      }
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-surface border-b-2 border-[var(--app-border)] mb-8">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl app-primary flex items-center justify-center shadow-lg">
                <Music className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold app-text-primary">Musical Note Generator</h1>
                <p className="text-lg app-text-secondary">Professional practice tool for music students</p>
              </div>
            </div>

            {/* Global Controls */}
            <div className="flex items-center space-x-4">
              {/* Audio Sample Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium app-text-primary">🎵 Audio:</span>
                <Select
                  value={settings.globalAudio?.waveType || 'piano'}
                  onValueChange={(value) => {
                    const waveType = value as 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano';
                    setSettings(prev => ({ 
                      ...prev, 
                      globalAudio: { waveType }
                    }));
                    previewAudioSample(waveType);
                  }}
                >
                  <SelectTrigger className="w-32 app-elevated border-[var(--app-border)]" data-testid="select-audio-sample">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piano" data-testid="audio-piano">🎹 Piano</SelectItem>
                    <SelectItem value="sine" data-testid="audio-sine">🌊 Sine</SelectItem>
                    <SelectItem value="triangle" data-testid="audio-triangle">📐 Triangle</SelectItem>
                    <SelectItem value="sawtooth" data-testid="audio-sawtooth">🔺 Sawtooth</SelectItem>
                    <SelectItem value="square" data-testid="audio-square">🔲 Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ThemeToggle />
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportSettings}
                className="app-elevated border-[var(--app-border)] hover:border-[var(--app-primary)] hover:font-semibold"
                data-testid="button-export-settings"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={importSettings}
                className="app-elevated border-[var(--app-border)] hover:border-[var(--app-primary)] hover:font-semibold"
                data-testid="button-import-settings"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>

        </div>
      </header>

      {/* Tab Navigation */}
      <div className="container mx-auto px-6 max-w-7xl">
        <nav className="mb-8">
          <div className="flex flex-wrap gap-3 p-2 app-elevated rounded-xl">
            {[
              { key: 'random', label: 'Random Notes', icon: '🎲', color: 'app-primary' },
              { key: 'progressions', label: 'Chord Progressions', icon: '🎵', color: 'app-secondary' },
              { key: 'patterns', label: 'Circle Patterns', icon: '🔄', color: 'app-accent' },
              { key: 'glossary', label: 'Music Glossary', icon: '📚', color: 'app-warning' }
            ].map(({ key, label, icon, color }) => (
              <Button
                key={key}
                variant="ghost"
                size="lg"
                onClick={() => switchTab(key as AppSettings['currentMode'])}
                className={`flex-1 min-w-fit px-6 py-4 rounded-lg transition-all duration-200 ${
                  settings.currentMode === key
                    ? `${color} text-white shadow-lg transform scale-105 font-semibold`
                    : `hover:border-2 hover:border-[var(--${color.replace('app-', 'app-')})] app-text-secondary hover:app-text-primary border border-[var(--app-border)] hover:font-semibold`
                }`}
                data-testid={`tab-${key}`}
              >
                <span className="mr-3 text-xl">{icon}</span>
                <span className="font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </nav>

        {/* Mode Content */}
        <main className="container mx-auto px-6 max-w-7xl">
          {settings.currentMode === 'random' && (
            <RandomMode
              settings={settings.randomMode}
              onSettingsChange={(randomMode) => setSettings(prev => ({ ...prev, randomMode }))}
              audioContext={audioContext}
              globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
              sharedAudioEngine={audioEngine}
            />
          )}
          {settings.currentMode === 'progressions' && (
            <ProgressionsMode
              settings={settings.progressionsMode}
              onSettingsChange={(progressionsMode) => setSettings(prev => ({ ...prev, progressionsMode }))}
              audioContext={audioContext}
              globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
              sharedAudioEngine={audioEngine}
            />
          )}
          {settings.currentMode === 'patterns' && (
            <PatternsMode
              settings={settings.patternsMode}
              onSettingsChange={(patternsMode) => setSettings(prev => ({ ...prev, patternsMode }))}
              audioContext={audioContext}
              globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
              sharedAudioEngine={audioEngine}
            />
          )}
          {settings.currentMode === 'glossary' && <GlossaryMode />}
        </main>

        {/* Floating Metronome Button */}
        <div className="fixed top-6 right-6 z-50">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`app-elevated hover:app-primary-light rounded-full shadow-lg transition-all ${
                  settings.globalMetronome.isActive 
                    ? 'app-primary text-white shadow-lg' 
                    : 'app-text-secondary hover:app-text-primary'
                }`}
                data-testid="button-floating-metronome"
              >
                {settings.globalMetronome.isActive ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 app-surface border-[var(--app-border)]" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium app-text-primary">🥁 Global Metronome</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newIsActive = !settings.globalMetronome.isActive;
                      setSettings(prev => ({
                        ...prev,
                        globalMetronome: {
                          ...prev.globalMetronome,
                          isActive: newIsActive
                        }
                      }));
                    }}
                    className={`text-xs ${
                      settings.globalMetronome.isActive 
                        ? 'app-primary text-white' 
                        : 'app-text-secondary hover:app-text-primary'
                    }`}
                    data-testid="button-toggle-metronome"
                  >
                    {settings.globalMetronome.isActive ? 'Stop' : 'Start'}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium app-text-secondary mb-2 block">
                      Volume: {settings.globalMetronome.volume}%
                    </label>
                    <Slider
                      value={[settings.globalMetronome.volume]}
                      onValueChange={([value]) => {
                        setSettings(prev => ({
                          ...prev,
                          globalMetronome: {
                            ...prev.globalMetronome,
                            volume: value
                          }
                        }));
                      }}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                      data-testid="slider-metronome-volume"
                    />
                  </div>
                  
                  <div className="text-xs app-text-light">
                    Plays quarter notes at current mode BPM
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>
    </div>
  );
}
