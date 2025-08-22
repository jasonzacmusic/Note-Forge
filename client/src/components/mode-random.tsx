import { useState, useEffect, useRef } from "react";
import { Shuffle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MusicTheory } from "./music-theory";
import { AudioEngine } from "./audio-engine";
import type { RandomModeSettings, Note, Interval } from "@shared/schema";

interface RandomModeProps {
  settings: RandomModeSettings;
  onSettingsChange: (settings: RandomModeSettings) => void;
  audioContext: AudioContext | null;
}

export function RandomMode({ settings, onSettingsChange, audioContext }: RandomModeProps) {
  const [audioEngine] = useState(() => new AudioEngine());
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [intervalAnalysis, setIntervalAnalysis] = useState<Interval[]>([]);
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
      setCurrentNoteIndex(0);
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => window.removeEventListener('stopAllAudio', handleStopAllAudio);
  }, [audioContext, audioEngine]);

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

  useEffect(() => {
    if (settings.generatedNotes.length > 1 && settings.difficulty === 'intermediate') {
      // For intermediate mode, show ALL intervals between consecutive notes
      const analysis: Interval[] = [];
      for (let i = 1; i < settings.generatedNotes.length; i++) {
        const allIntervals = MusicTheory.getAllIntervalsBetween(
          settings.generatedNotes[i - 1],
          settings.generatedNotes[i]
        );
        analysis.push(...allIntervals);
      }
      setIntervalAnalysis(analysis);
    } else if (settings.generatedNotes.length > 1) {
      // For beginner mode, show basic interval
      const analysis: Interval[] = [];
      for (let i = 1; i < settings.generatedNotes.length; i++) {
        const interval = MusicTheory.getInterval(
          settings.generatedNotes[i - 1].name,
          settings.generatedNotes[i].name
        );
        analysis.push(interval);
      }
      setIntervalAnalysis(analysis);
    }
  }, [settings.generatedNotes, settings.difficulty]);

  const generateRandomNotes = () => {
    // Generate new notes
    const newNotes = MusicTheory.generateRandomSequence(settings.noteSelection, 4);
    
    // Stop current playback immediately and set new notes
    onSettingsChange({
      ...settings,
      generatedNotes: newNotes,
      playback: { ...settings.playback, isPlaying: false }
    });
    
    // Restart playback with new notes after brief delay to ensure cleanup
    setTimeout(() => {
      onSettingsChange({
        ...settings,
        generatedNotes: newNotes,
        playback: { ...settings.playback, isPlaying: true }
      });
    }, 100);
  };

  const startPlayback = () => {
    if (settings.generatedNotes.length === 0 || !audioContext) return;

    let currentNoteIndex = 0;
    let playbackRepetition = 0;
    let nextNoteTime = audioContext.currentTime;
    
    const scheduleNote = () => {
      // Always check current settings, don't cache
      if (!settings.playback.isPlaying || settings.generatedNotes.length === 0) return;

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
      const noteInterval = (60 / settings.playback.bpm) / (repetitionsPerBar / 4); // Time between repetitions

      // Always use current notes from settings
      const currentNotes = settings.generatedNotes;
      if (currentNoteIndex >= currentNotes.length) {
        currentNoteIndex = 0; // Reset if index is out of bounds
      }
      
      const note = currentNotes[currentNoteIndex];
      setCurrentNoteIndex(currentNoteIndex);
      
      // Schedule note at precise Web Audio time
      const playTime = nextNoteTime;
      
      // Play note across multiple octaves for beginner mode
      if (settings.difficulty === 'beginner') {
        for (let octave = 3; octave <= 6; octave++) {
          const frequency = AudioEngine.midiToFrequency(note.midi + (octave - 4) * 12);
          audioEngine.playNote(frequency, 0.2, playTime);
        }
      } else {
        // Intermediate mode: play note + interval
        const frequency = AudioEngine.midiToFrequency(note.midi);
        audioEngine.playNote(frequency, 0.3, playTime);
        
        // If there's a next note, play the interval
        if (currentNoteIndex < currentNotes.length - 1) {
          const nextNote = currentNotes[currentNoteIndex + 1];
          const intervalFreq = AudioEngine.midiToFrequency(nextNote.midi);
          audioEngine.playNote(intervalFreq, 0.2, playTime + 0.15);
        }
      }

      playbackRepetition++;
      
      // Move to next note after completing all repetitions for current note
      if (playbackRepetition >= repetitionsPerBar) {
        currentNoteIndex = (currentNoteIndex + 1) % currentNotes.length;
        playbackRepetition = 0;
      }
      
      // Apply swing only to quavers (2x)
      let adjustedInterval = noteInterval;
      if (settings.playback.subdivision === "2" && settings.playback.swing !== 50) {
        adjustedInterval = AudioEngine.applySwing(playbackRepetition, settings.playback.swing, noteInterval);
      }
      
      // Schedule next note using Web Audio precision
      nextNoteTime += adjustedInterval;
      
      // Schedule callback slightly before next note time
      const timeUntilNext = Math.max(0, (nextNoteTime - audioContext.currentTime) * 1000 - 25);
      playbackTimeoutRef.current = setTimeout(scheduleNote, timeUntilNext);
    };

    scheduleNote();
  };

  const stopPlayback = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    audioEngine.stop();
    setCurrentNoteIndex(0);
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

  const updateDifficulty = (difficulty: 'beginner' | 'intermediate') => {
    onSettingsChange({ ...settings, difficulty });
  };

  const updateNoteSelection = (noteSelection: 'all' | 'white' | 'accidentals') => {
    onSettingsChange({ ...settings, noteSelection });
  };

  const updateIntervalCategory = (intervalCategory: 'resolutions' | 'tensions' | 'anticipations' | 'mystery') => {
    onSettingsChange({ ...settings, intervalCategory });
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

  const updateSwing = (swing: number[]) => {
    onSettingsChange({
      ...settings,
      playback: { ...settings.playback, swing: swing[0] }
    });
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--app-primary)]">
              🎲 Random Generation
            </h3>
            
            {/* Difficulty Level */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-2">Difficulty Level</Label>
              <RadioGroup
                value={settings.difficulty}
                onValueChange={updateDifficulty}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="app-text-primary">Beginner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="app-text-primary">Intermediate</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Note Selection */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-3">Note Selection</Label>
              <RadioGroup
                value={settings.noteSelection}
                onValueChange={updateNoteSelection}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-notes" />
                  <Label htmlFor="all-notes" className="app-text-primary">All 12 Notes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="white-notes" />
                  <Label htmlFor="white-notes" className="app-text-primary">White Notes Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accidentals" id="black-notes" />
                  <Label htmlFor="black-notes" className="app-text-primary">Black Notes Only</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Interval Category for Intermediate */}
            {settings.difficulty === 'intermediate' && (
              <div className="mb-6">
                <Label className="block app-text-secondary font-medium mb-2">Interval Category</Label>
                <Select value={settings.intervalCategory} onValueChange={updateIntervalCategory}>
                  <SelectTrigger className="w-full app-bg border-[var(--app-elevated)]" data-testid="select-interval-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="app-surface border-[var(--app-elevated)]">
                    <SelectItem value="resolutions">Resolutions</SelectItem>
                    <SelectItem value="tensions">Tensions</SelectItem>
                    <SelectItem value="anticipations">Anticipations</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Generate Button */}
            <Button
              onClick={generateRandomNotes}
              className="w-full app-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
              data-testid="button-generate-random"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Generate Random
            </Button>
            
            {/* Playback Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium app-text-secondary">Playback</h4>
                <Button
                  onClick={togglePlayback}
                  disabled={settings.generatedNotes.length === 0}
                  className="px-4 py-2 app-success hover:bg-green-600 rounded-lg font-medium transition-colors text-white"
                  data-testid="button-toggle-playback-random"
                >
                  {settings.playback.isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {settings.playback.isPlaying ? 'Stop' : 'Play'}
                </Button>
              </div>
              
              {/* BPM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="app-text-secondary font-medium">BPM</Label>
                  <span className="text-lg font-mono" data-testid="text-random-bpm">{settings.playback.bpm}</span>
                </div>
                <Slider
                  value={[settings.playback.bpm]}
                  onValueChange={updateBPM}
                  min={20}
                  max={240}
                  step={1}
                  className="w-full"
                  data-testid="slider-random-bpm"
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
                      data-testid={`button-subdivision-${value}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Swing - Only for Quavers */}
              {settings.playback.subdivision === "2" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="app-text-secondary font-medium">Swing %</Label>
                    <span className="text-lg font-mono" data-testid="text-random-swing">{settings.playback.swing}</span>
                  </div>
                  <Slider
                    value={[settings.playback.swing]}
                    onValueChange={updateSwing}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    data-testid="slider-random-swing"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Generated Sequence Display */}
        <div className="lg:col-span-2">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 text-[var(--app-secondary)]">Generated Sequence</h3>
            
            {/* Note Display */}
            {settings.generatedNotes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {settings.generatedNotes.map((note, index) => (
                  <div
                    key={index}
                    className={`note-card rounded-lg p-6 text-center ${
                      currentNoteIndex === index && settings.playback.isPlaying ? 'active' : ''
                    }`}
                    data-testid={`note-card-${index}`}
                  >
                    <div className="text-3xl font-bold mb-2 app-text-primary">
                      {MusicTheory.formatNoteForDisplay(note)}
                    </div>
                    <div className="app-text-secondary text-sm">
                      {settings.difficulty === 'beginner' ? '4 octaves' : '2 octaves + interval'}
                    </div>
                    {settings.difficulty === 'intermediate' && index < settings.generatedNotes.length - 1 && (
                      <div className="app-accent text-xs mt-2" data-testid={`interval-${index}`}>
                        →{settings.generatedNotes[index + 1].name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 app-text-secondary">
                Click "Generate Random" to create a sequence
              </div>
            )}
            
            {/* Theory Information */}
            {settings.generatedNotes.length > 0 && (
              <div className="app-bg rounded-lg p-4">
                <h4 className="font-medium mb-2 app-accent">Music Theory Analysis</h4>
                <div className="app-text-secondary text-sm space-y-1">
                  <p>• No more than 2 consecutive seconds (M2/m2)</p>
                  <p>• Preferred intervals: P5, P4, M3, m3, M6, m6</p>
                  {intervalAnalysis.length > 0 && settings.difficulty === 'intermediate' && (
                    <div>
                      <p>• All possible intervals:</p>
                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                        {intervalAnalysis.map((interval, i) => (
                          <div key={i} className="app-elevated p-1 rounded">
                            {interval.abbreviation}: {interval.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {intervalAnalysis.length > 0 && settings.difficulty === 'beginner' && (
                    <p>• Intervals: {intervalAnalysis.map(interval => interval.abbreviation).join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
