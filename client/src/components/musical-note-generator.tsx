import { useState, useEffect } from "react";
import { Music, Download, Upload, Keyboard } from "lucide-react";
import { AudioEngine } from "./audio-engine";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlobalMetronome } from "./metronome";
import { RandomMode } from "./mode-random";
import { ProgressionsMode } from "./mode-progressions";
import { PatternsMode } from "./mode-patterns";
import { GlossaryMode } from "./mode-glossary";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { initializeAudio, audioContext } = useAudio();
  const [audioEngine] = useState(() => new AudioEngine());

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

  // Preview audio sample function
  const previewAudioSample = (waveType: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano') => {
    if (audioContext && audioEngine.isInitialized()) {
      // Play middle C (261.63 Hz) for half a second as preview
      audioEngine.playNote(261.63, 0.5, undefined, waveType);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    currentMode: settings.currentMode,
    onModeChange: (mode) => setSettings(prev => ({ ...prev, currentMode: mode })),
    onBpmChange: (delta) => {
      const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
      const modeSettings = settings[modeKey] as any;
      if (modeSettings?.playback) {
        const newBpm = Math.max(20, Math.min(240, modeSettings.playback.bpm + delta));
        setSettings(prev => ({
          ...prev,
          [modeKey]: {
            ...modeSettings,
            playback: { ...modeSettings.playback, bpm: newBpm }
          }
        }));
      }
    },
    onSubdivisionChange: (subdivision) => {
      const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
      const modeSettings = settings[modeKey] as any;
      if (modeSettings?.playback) {
        setSettings(prev => ({
          ...prev,
          [modeKey]: {
            ...modeSettings,
            playback: { ...modeSettings.playback, subdivision }
          }
        }));
      }
    },
    onTogglePlayback: () => {
      const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
      const modeSettings = settings[modeKey] as any;
      if (modeSettings?.playback) {
        setSettings(prev => ({
          ...prev,
          [modeKey]: {
            ...modeSettings,
            playback: { ...modeSettings.playback, isPlaying: !modeSettings.playback.isPlaying }
          }
        }));
      }
    }
  });

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
    // Force stop all audio immediately by dispatching stop events
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Music className="text-[var(--app-primary)] text-3xl" />
            <h1 className="text-2xl md:text-3xl font-bold app-text-primary">Musical Note Generator</h1>
          </div>

          {/* Global Controls */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={exportSettings}
              className="app-surface hover:app-elevated"
              data-testid="button-export-settings"
            >
              <Download className="h-4 w-4 app-text-secondary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={importSettings}
              className="app-surface hover:app-elevated"
              data-testid="button-import-settings"
            >
              <Upload className="h-4 w-4 app-text-secondary" />
            </Button>
          </div>
        </div>

        {/* Global Controls Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <GlobalMetronome
            settings={settings.globalMetronome}
            onSettingsChange={(metronome) => setSettings(prev => ({ ...prev, globalMetronome: metronome }))}
            audioContext={audioContext}
            currentBpm={(() => {
              const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
              const modeSettings = settings[modeKey] as any;
              return modeSettings?.playback?.bpm || 120;
            })()}
            isCurrentModePlayingBack={(() => {
              const modeKey = `${settings.currentMode}Mode` as keyof AppSettings;
              const modeSettings = settings[modeKey] as any;
              return modeSettings?.playback?.isPlaying || false;
            })()}
          />
          
          {/* Global Audio Sample Selection */}
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium app-text-secondary">Audio Sample:</h3>
            <div className="flex gap-2">
              {[
                { value: 'piano', label: '🎹 Piano', testId: 'audio-piano' },
                { value: 'sine', label: '🌊 Sine', testId: 'audio-sine' },
                { value: 'triangle', label: '📐 Triangle', testId: 'audio-triangle' },
                { value: 'sawtooth', label: '🔺 Sawtooth', testId: 'audio-sawtooth' },
                { value: 'square', label: '🔲 Square', testId: 'audio-square' }
              ].map(({ value, label, testId }) => (
                <Button
                  key={value}
                  variant={settings.globalAudio?.waveType === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const waveType = value as 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano';
                    setSettings(prev => ({ 
                      ...prev, 
                      globalAudio: { waveType }
                    }));
                    previewAudioSample(waveType);
                  }}
                  className={`text-xs ${
                    settings.globalAudio?.waveType === value 
                      ? 'app-primary text-white' 
                      : 'app-text-secondary border-[var(--app-elevated)] hover:app-text-primary'
                  }`}
                  data-testid={testId}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="mb-8">
        <div className="flex flex-wrap border-b border-[var(--app-elevated)]">
          {[
            { key: 'random', label: 'Random', icon: '🎲' },
            { key: 'progressions', label: 'Progressions', icon: '🎵' },
            { key: 'patterns', label: 'Patterns', icon: '🔄' },
            { key: 'glossary', label: 'Glossary', icon: '📚' }
          ].map(({ key, label, icon }) => (
            <Button
              key={key}
              variant="ghost"
              className={`px-6 py-3 border-b-2 ${
                settings.currentMode === key
                  ? 'text-[var(--app-primary)] border-[var(--app-primary)]'
                  : 'app-text-secondary border-transparent hover:app-text-primary'
              }`}
              onClick={() => switchTab(key as AppSettings['currentMode'])}
              data-testid={`tab-${key}`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Mode Content */}
      <main>
        {settings.currentMode === 'random' && (
          <RandomMode
            settings={settings.randomMode}
            onSettingsChange={(randomMode) => setSettings(prev => ({ ...prev, randomMode }))}
            audioContext={audioContext}
            globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
          />
        )}
        {settings.currentMode === 'progressions' && (
          <ProgressionsMode
            settings={settings.progressionsMode}
            onSettingsChange={(progressionsMode) => setSettings(prev => ({ ...prev, progressionsMode }))}
            audioContext={audioContext}
            globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
          />
        )}
        {settings.currentMode === 'patterns' && (
          <PatternsMode
            settings={settings.patternsMode}
            onSettingsChange={(patternsMode) => setSettings(prev => ({ ...prev, patternsMode }))}
            audioContext={audioContext}
            globalAudioSettings={settings.globalAudio || { waveType: 'piano' }}
          />
        )}
        {settings.currentMode === 'glossary' && <GlossaryMode />}
      </main>

      {/* Keyboard Shortcuts Button */}
      <div className="fixed bottom-6 right-6">
        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="app-surface hover:app-elevated rounded-full shadow-lg"
              data-testid="button-show-shortcuts"
            >
              <Keyboard className="h-4 w-4 app-text-secondary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="app-surface border-[var(--app-elevated)]">
            <DialogHeader>
              <DialogTitle className="app-text-primary">Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="app-text-primary">Play/Stop</span>
                <kbd className="app-bg px-2 py-1 rounded text-xs">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="app-text-primary">BPM Up/Down</span>
                <div className="space-x-1">
                  <kbd className="app-bg px-2 py-1 rounded text-xs">↑</kbd>
                  <kbd className="app-bg px-2 py-1 rounded text-xs">↓</kbd>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="app-text-primary">Subdivisions</span>
                <div className="space-x-1">
                  <kbd className="app-bg px-2 py-1 rounded text-xs">1</kbd>
                  <kbd className="app-bg px-2 py-1 rounded text-xs">2</kbd>
                  <kbd className="app-bg px-2 py-1 rounded text-xs">3</kbd>
                  <kbd className="app-bg px-2 py-1 rounded text-xs">4</kbd>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
