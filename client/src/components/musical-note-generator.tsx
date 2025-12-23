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
import { DonationSection } from "./donation-section";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAudio } from "@/hooks/use-audio";
import type { AppSettings } from "@shared/schema";
import nsmWhiteLogo from "@assets/NSM White_1759673454530.png";
import nsmBlackLogo from "@assets/NSM Black_1759673454530.png";
import schoolLogoWhite from "@/assets/nsm-logo-white.png";
import schoolLogoBlack from "@/assets/nsm-logo-black.png";

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-surface border-b-2 border-[var(--app-border)] mb-4 md:mb-8">
        <div className="container mx-auto px-3 md:px-6 py-4 md:py-8 max-w-7xl">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Logo at top on mobile */}
            <div className="flex justify-center mb-4">
              <a href={LANDING_PAGE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src={theme === 'dark' ? schoolLogoWhite : schoolLogoBlack}
                  alt="Nathaniel School of Music"
                  className="h-10 w-auto object-contain"
                />
                <img 
                  src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
                  alt="Nathaniel School of Music"
                  className="h-14 w-auto object-contain"
                  data-testid="nsm-logo"
                />
              </a>
            </div>
            
            {/* Title and controls on mobile */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-10 h-10 rounded-xl app-primary flex items-center justify-center shadow-lg flex-shrink-0">
                  <Music className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold app-text-primary truncate">Musical Note Generator</h1>
                  <p className="text-xs app-text-secondary">4 notes with many possibilities</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            
            {/* Audio controls on mobile */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs font-medium app-text-primary">🎵 Audio:</span>
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
                <SelectTrigger className="w-28 app-elevated border-[var(--app-border)]" data-testid="select-audio-sample">
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
            
            {/* Shortcuts hint on mobile - collapsible */}
            <div className="mt-3 app-bg rounded-lg px-2 py-1 text-xs app-text-secondary border border-[var(--app-border)] text-center">
              <span className="font-semibold app-text-primary">Shortcuts:</span> Space = Play/Stop
            </div>
          </div>
          
          {/* Desktop Layout (unchanged) */}
          <div className="hidden lg:grid grid-cols-3 gap-4 items-center">
            {/* Left: Title and Shortcuts */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl app-primary flex items-center justify-center shadow-lg">
                <Music className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold app-text-primary">Musical Note Generator</h1>
                <p className="text-sm md:text-base app-text-secondary">4 notes with many creative possibilities</p>
                <div className="mt-2 app-bg rounded-lg px-3 py-1 text-xs md:text-sm app-text-secondary border border-[var(--app-border)] inline-block">
                  <span className="font-semibold app-text-primary">Shortcuts:</span> Space = Play/Stop
                </div>
              </div>
            </div>

            {/* Center: Logo */}
            <div className="flex justify-center">
              <a href={LANDING_PAGE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <img 
                  src={theme === 'dark' ? schoolLogoWhite : schoolLogoBlack}
                  alt="Nathaniel School of Music"
                  className="h-16 w-auto object-contain"
                />
                <img 
                  src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
                  alt="Nathaniel School of Music"
                  className="h-20 w-auto object-contain"
                  data-testid="nsm-logo"
                />
              </a>
            </div>

            {/* Right: Audio Controls */}
            <div className="flex justify-end items-center space-x-4">
              {/* Audio Sample Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium app-text-primary">🎵 Audio:</span>
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
      <div className="container mx-auto px-3 md:px-6 max-w-7xl">
        <nav className="mb-4 md:mb-8">
          <div className="flex flex-wrap gap-2 md:gap-3 p-2 app-elevated rounded-xl">
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
                className={`flex-1 min-w-fit px-3 md:px-6 py-3 md:py-4 rounded-lg transition-all duration-200 text-sm md:text-base ${
                  settings.currentMode === key
                    ? `${color} text-white shadow-lg transform scale-105 font-semibold`
                    : `hover:border-2 hover:border-[var(--${color.replace('app-', 'app-')})] app-text-secondary hover:app-text-primary border border-[var(--app-border)] hover:font-semibold`
                }`}
                data-testid={`tab-${key}`}
              >
                <span className="mr-2 md:mr-3 text-lg md:text-xl">{icon}</span>
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

        <DonationSection />

        {/* Footer */}
        <footer className="mt-8 mb-4">
          <div className="container mx-auto px-3 md:px-6 max-w-7xl">
            <div className="app-surface rounded-xl p-6 text-center">
              <a 
                href={LANDING_PAGE_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity mb-4"
              >
                <img 
                  src={theme === 'dark' ? schoolLogoWhite : schoolLogoBlack}
                  alt="Nathaniel School of Music"
                  className="h-12 w-auto object-contain"
                />
                <img 
                  src={theme === 'dark' ? nsmWhiteLogo : nsmBlackLogo}
                  alt="Nathaniel School of Music"
                  className="h-16 w-auto object-contain"
                />
              </a>
              <p className="app-text-secondary text-sm">
                Explore more music practice tools and resources at{" "}
                <a 
                  href={LANDING_PAGE_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--app-primary)] hover:underline font-medium"
                >
                  Nathaniel School of Music
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
