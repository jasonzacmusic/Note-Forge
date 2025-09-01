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
      audioEngine.initialize();
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
            <div className="flex items-center space-x-3">
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

          {/* Global Controls Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div className="app-elevated rounded-xl p-4">
              <h3 className="text-sm font-semibold app-text-primary mb-3 flex items-center">
                <Keyboard className="w-4 h-4 mr-2 text-[var(--app-accent)]" />
                Audio Sample
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 'piano', label: '🎹', name: 'Piano', testId: 'audio-piano' },
                  { value: 'sine', label: '🌊', name: 'Sine', testId: 'audio-sine' },
                  { value: 'triangle', label: '📐', name: 'Triangle', testId: 'audio-triangle' },
                  { value: 'sawtooth', label: '🔺', name: 'Sawtooth', testId: 'audio-sawtooth' },
                  { value: 'square', label: '🔲', name: 'Square', testId: 'audio-square' }
                ].map(({ value, label, name, testId }) => (
                  <Button
                    key={value}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const waveType = value as 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano';
                      setSettings(prev => ({ 
                        ...prev, 
                        globalAudio: { waveType }
                      }));
                      previewAudioSample(waveType);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      settings.globalAudio?.waveType === value 
                        ? 'app-primary text-white shadow-md' 
                        : 'hover:border-[var(--app-primary)] app-text-secondary border border-[var(--app-border)]'
                    }`}
                    data-testid={testId}
                  >
                    <span className="text-lg mb-1">{label}</span>
                    <span className="text-xs font-medium">{name}</span>
                  </Button>
                ))}
              </div>
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
                className="app-elevated hover:app-primary-light rounded-full shadow-lg"
                data-testid="button-show-shortcuts"
              >
                <Keyboard className="h-4 w-4 app-text-secondary" />
              </Button>
            </DialogTrigger>
            <DialogContent className="app-surface border-[var(--app-border)]">
              <DialogHeader>
                <DialogTitle className="app-text-primary">Keyboard Shortcuts</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="app-text-primary">Play/Stop</span>
                  <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-primary">BPM Up/Down</span>
                  <div className="space-x-1">
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">↑</kbd>
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">↓</kbd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="app-text-primary">Subdivisions</span>
                  <div className="space-x-1">
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">1</kbd>
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">2</kbd>
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">3</kbd>
                    <kbd className="app-elevated px-3 py-1 rounded text-xs font-mono">4</kbd>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
