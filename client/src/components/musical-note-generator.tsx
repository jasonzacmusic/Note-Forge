import { useState, useEffect, useRef } from "react";
import { AudioEngine } from "./audio-engine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "./theme-provider";
import { RandomMode } from "./mode-random";
import { ProgressionsMode } from "./mode-progressions";
import { PatternsMode } from "./mode-patterns";
import { GlossaryMode } from "./mode-glossary";
import { DonationSection } from "./donation-section";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAudio } from "@/hooks/use-audio";
import type { AppSettings } from "@shared/schema";
import nsmWhiteLogo from "@assets/NSM White_1759673454530.png";
import nsmBlackLogo from "@assets/NSM Black_1759673454530.png";

const LANDING_PAGE_URL = "https://music-practice.nathanielschool.com";

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

  const waveTypes = [
    { value: 'piano', label: 'Piano' },
    { value: 'sine', label: 'Sine' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'sawtooth', label: 'Saw' },
    { value: 'square', label: 'Square' },
  ] as const;

  const tabs = [
    { key: 'random' as const, label: 'Random', color: 'var(--app-primary)' },
    { key: 'progressions' as const, label: 'Progressions', color: 'var(--app-secondary)' },
    { key: 'patterns' as const, label: 'Patterns', color: 'var(--app-accent)' },
    { key: 'glossary' as const, label: 'Glossary', color: 'var(--app-warning)' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--app-border)]">
        <div className="container mx-auto px-3 md:px-6 max-w-7xl">
          {/* Top bar: controls */}
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <span className="text-xs app-text-secondary font-medium uppercase tracking-wider">Sound</span>
              <Select
                value={settings.globalAudio?.waveType || 'piano'}
                onValueChange={(value) => {
                  const waveType = value as 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano';
                  currentWaveTypeRef.current = waveType;
                  setSettings(prev => ({
                    ...prev,
                    globalAudio: { waveType }
                  }));
                }}
              >
                <SelectTrigger className="w-28 h-8 text-xs app-elevated border-[var(--app-border)]" data-testid="select-audio-sample">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {waveTypes.map(({ value, label }) => (
                    <SelectItem key={value} value={value} data-testid={`audio-${value}`}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ThemeToggle />
          </div>

          {/* Hero area */}
          <div className="py-6 md:py-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <a href={LANDING_PAGE_URL} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity inline-block mb-3">
                <img
                  src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
                  alt="Nathaniel School of Music"
                  className="h-8 md:h-10 w-auto object-contain"
                  data-testid="nsm-logo"
                />
              </a>
              <h1 className="text-3xl md:text-5xl font-bold app-text-primary tracking-tight leading-tight">
                Note<br className="sm:hidden" /> Generator
              </h1>
              <p className="app-text-secondary text-sm md:text-base mt-2 max-w-lg">
                Generate random notes, explore chord progressions, or trace patterns
                through the circle of fifths. Pick a mode and hit play.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation — underline style */}
      <div className="container mx-auto px-3 md:px-6 max-w-7xl">
        <nav className="mb-6 md:mb-8 border-b border-[var(--app-border)]">
          <div className="flex">
            {tabs.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`relative px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-colors ${
                  settings.currentMode === key
                    ? 'app-text-primary'
                    : 'app-text-secondary hover:app-text-primary'
                }`}
                data-testid={`tab-${key}`}
              >
                {label}
                {settings.currentMode === key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full transition-all"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Mode Content */}
        <main className="container mx-auto px-3 md:px-6 max-w-7xl">
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

        <DonationSection />

        {/* Footer */}
        <footer className="mt-12 mb-6">
          <div className="container mx-auto px-3 md:px-6 max-w-7xl">
            <div className="border-t border-[var(--app-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={LANDING_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
                  alt="Nathaniel School of Music"
                  className="h-8 w-auto object-contain"
                />
              </a>
              <p className="app-text-secondary text-xs">
                <kbd className="px-1.5 py-0.5 app-elevated rounded text-[10px] font-mono">Space</kbd> Play / Stop
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
