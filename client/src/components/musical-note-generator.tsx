import { useState, useEffect, useRef } from "react";
import { Music } from "lucide-react";
import { AudioEngine } from "./audio-engine";
import { MusicTheory } from "./music-theory";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "./theme-provider";
import { RandomMode } from "./mode-random";
import { ProgressionsMode } from "./mode-progressions";
import { PatternsMode } from "./mode-patterns";
import { GlossaryMode } from "./mode-glossary";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAudio } from "@/hooks/use-audio";
import type { AppSettings } from "@shared/schema";
import nsmWhiteLogo from "@assets/NSM White_1759673454530.png";
import nsmBlackLogo from "@assets/NSM Black_1759673454530.png";

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
      swingEnabled: false,
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
      swingEnabled: false,
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
      swingEnabled: false,
      volume: 75
    }
  },
  history: []
};

export function MusicalNoteGenerator() {
  const [settings, setSettings] = useLocalStorage<AppSettings>("musical-note-generator", defaultSettings);
  const { initializeAudio, audioContext } = useAudio();
  const { theme } = useTheme();
  
  // Create separate audio engines for each mode
  const [randomAudioEngine] = useState(() => new AudioEngine());
  const [progressionsAudioEngine] = useState(() => new AudioEngine());
  const [patternsAudioEngine] = useState(() => new AudioEngine());
  const [metronomeAudioEngine] = useState(() => new AudioEngine());
  
  const [currentBeat, setCurrentBeat] = useState(0);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref for current wave type so closures can access it dynamically
  const currentWaveTypeRef = useRef<'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano'>('piano');

  // Keep wave type ref in sync with settings
  useEffect(() => {
    currentWaveTypeRef.current = settings.globalAudio?.waveType || 'piano';
  }, [settings.globalAudio?.waveType]);

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

  // Initialize all audio engines with context
  useEffect(() => {
    if (audioContext) {
      randomAudioEngine.initialize(audioContext);
      progressionsAudioEngine.initialize(audioContext);
      patternsAudioEngine.initialize(audioContext);
      metronomeAudioEngine.initialize(audioContext);
    }
  }, [audioContext, randomAudioEngine, progressionsAudioEngine, patternsAudioEngine, metronomeAudioEngine]);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault(); // Prevent page scroll
          // Toggle playback for current mode
          if (settings.currentMode === 'random') {
            setSettings(prev => ({
              ...prev,
              randomMode: {
                ...prev.randomMode,
                playback: { ...prev.randomMode.playback, isPlaying: !prev.randomMode.playback.isPlaying }
              }
            }));
          } else if (settings.currentMode === 'progressions') {
            setSettings(prev => ({
              ...prev,
              progressionsMode: {
                ...prev.progressionsMode,
                playback: { ...prev.progressionsMode.playback, isPlaying: !prev.progressionsMode.playback.isPlaying }
              }
            }));
          } else if (settings.currentMode === 'patterns') {
            setSettings(prev => ({
              ...prev,
              patternsMode: {
                ...prev.patternsMode,
                playback: { ...prev.patternsMode.playback, isPlaying: !prev.patternsMode.playback.isPlaying }
              }
            }));
          }
          break;
        
        case 'KeyR':
          // Randomize for current mode
          if (settings.currentMode === 'random') {
            // Generate new random notes and start playback
            // For intermediate mode, don't use rare enharmonics unless explicitly selecting "enharmonics"
            let noteSelectionForGeneration = settings.randomMode.noteSelection;
            if (settings.randomMode.difficulty === 'intermediate' && settings.randomMode.noteSelection === 'enharmonics') {
              // In intermediate mode, treat enharmonics as 'all' to exclude rare enharmonics
              noteSelectionForGeneration = 'all';
            }
            const newNotes = MusicTheory.generateRandomSequence(noteSelectionForGeneration, 4);
            setSettings(prev => ({
              ...prev,
              randomMode: {
                ...prev.randomMode,
                generatedNotes: newNotes,
                playback: { ...prev.randomMode.playback, isPlaying: true }
              }
            }));
          } else if (settings.currentMode === 'progressions') {
            // Randomize progression
            const progressionNames = ['pop', 'dorian', 'jazz'];
            const randomProgression = progressionNames[Math.floor(Math.random() * progressionNames.length)] as 'pop' | 'dorian' | 'jazz';
            setSettings(prev => ({
              ...prev,
              progressionsMode: {
                ...prev.progressionsMode,
                selectedProgression: randomProgression,
                playback: { ...prev.progressionsMode.playback, isPlaying: true }
              }
            }));
          } else if (settings.currentMode === 'patterns') {
            // Randomize pattern type and starting note
            const patternTypes = ['circle-cw', 'circle-ccw', 'triangles', 'squares', 'whole-up', 'whole-down', 'dim-up', 'dim-down', 'chromatic-up', 'chromatic-down'];
            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const randomPattern = patternTypes[Math.floor(Math.random() * patternTypes.length)];
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            setSettings(prev => ({
              ...prev,
              patternsMode: {
                ...prev.patternsMode,
                patternType: randomPattern as any,
                startingNote: randomNote,
                playback: { ...prev.patternsMode.playback, isPlaying: true }
              }
            }));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  // Reset function for Random Mode settings
  const resetRandomModeSettings = (prevSettings: AppSettings) => ({
    ...prevSettings.randomMode,
    generatedNotes: [],
    playback: { ...prevSettings.randomMode.playback, isPlaying: false }
  });

  // Reset function for Progressions Mode settings
  const resetProgressionsModeSettings = (prevSettings: AppSettings) => ({
    ...prevSettings.progressionsMode,
    currentProgression: undefined,
    playback: { ...prevSettings.progressionsMode.playback, isPlaying: false }
  });

  // Reset function for Patterns Mode settings
  const resetPatternsModeSettings = (prevSettings: AppSettings) => ({
    ...prevSettings.patternsMode,
    currentPattern: [],
    playback: { ...prevSettings.patternsMode.playback, isPlaying: false }
  });

  const switchTab = (mode: AppSettings['currentMode']) => {
    // FIRST: Dispatch global stop event to immediately stop all mode components' timeouts
    // This ensures stopPlayback() is called synchronously in each mode component
    // Each mode listens for 'stopAllAudio' and clears its timeouts and refs
    window.dispatchEvent(new Event('stopAllAudio'));
    
    // SECOND: Immediately stop ALL audio engines - each mode has its own independent engine
    // The global event above has already cleared timeouts, so this is safe
    randomAudioEngine.stop();
    progressionsAudioEngine.stop();
    patternsAudioEngine.stop();
    stopMetronomeBeats();
    
    // THIRD: Reset all modes using helper functions
    // This sets isPlaying: false and clears generated sequences
    setSettings(prev => ({
      ...prev,
      currentMode: mode,
      randomMode: resetRandomModeSettings(prev),
      progressionsMode: resetProgressionsModeSettings(prev),
      patternsMode: resetPatternsModeSettings(prev)
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-surface border-b-2 border-[var(--app-border)] mb-8">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
              alt="Nathaniel School of Music"
              className="h-24 w-auto object-contain mb-4"
              data-testid="nsm-logo"
            />
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl app-primary flex items-center justify-center shadow-lg">
                <Music className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold app-text-primary">Musical Note Generator</h1>
                <p className="text-lg app-text-secondary">4 notes with many creative possibilities</p>
                <div className="mt-2 app-bg rounded-lg px-3 py-1 text-sm app-text-secondary border border-[var(--app-border)] inline-block">
                  <span className="font-semibold app-text-primary">Shortcuts:</span> R = Randomize | Space = Play/Stop
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">

            {/* Global Controls */}
            <div className="flex items-center space-x-4">
              {/* Audio Sample Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium app-text-primary">🎵 Audio:</span>
                <Select
                  value={settings.globalAudio?.waveType || 'piano'}
                  onValueChange={(value) => {
                    const waveType = value as 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano';
                    // Update ref for seamless wave type switching during playback
                    currentWaveTypeRef.current = waveType;
                    setSettings(prev => ({ 
                      ...prev, 
                      globalAudio: { waveType }
                    }));
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
              sharedAudioEngine={randomAudioEngine}
              currentWaveTypeRef={currentWaveTypeRef}
            />
          )}
          {settings.currentMode === 'progressions' && (
            <ProgressionsMode
              settings={settings.progressionsMode}
              onSettingsChange={(progressionsMode) => setSettings(prev => ({ ...prev, progressionsMode }))}
              audioContext={audioContext}
              globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
              sharedAudioEngine={progressionsAudioEngine}
              currentWaveTypeRef={currentWaveTypeRef}
            />
          )}
          {settings.currentMode === 'patterns' && (
            <PatternsMode
              settings={settings.patternsMode}
              onSettingsChange={(patternsMode) => setSettings(prev => ({ ...prev, patternsMode }))}
              audioContext={audioContext}
              globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
              sharedAudioEngine={patternsAudioEngine}
              currentWaveTypeRef={currentWaveTypeRef}
            />
          )}
          {settings.currentMode === 'glossary' && <GlossaryMode />}
        </main>


      </div>
    </div>
  );
}
