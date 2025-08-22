import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { CircleOfFifths } from "./circle-of-fifths";
import { MusicTheory } from "./music-theory";
import { AudioEngine } from "./audio-engine";
import type { PatternsModeSettings, Note } from "@shared/schema";

interface PatternsModeProps {
  settings: PatternsModeSettings;
  onSettingsChange: (settings: PatternsModeSettings) => void;
  audioContext: AudioContext | null;
}

export function PatternsMode({ settings, onSettingsChange, audioContext }: PatternsModeProps) {
  const [audioEngine] = useState(() => new AudioEngine());
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
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
    // Generate pattern when type or starting note changes
    generatePattern();
  }, [settings.patternType, settings.startingNote]);

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

  // Subdivision changes should continue playback seamlessly with new timing
  useEffect(() => {
    if (settings.playback.isPlaying) {
      // Don't restart, the existing playback will pick up new subdivision timing automatically
    }
  }, [settings.playback.subdivision]);

  const generatePattern = () => {
    let pattern: Note[] = [];

    switch (settings.patternType) {
      case 'circle-cw':
        pattern = MusicTheory.getCircleOfFifthsPattern(settings.startingNote, 'clockwise', 4);
        break;
      case 'circle-ccw':
        pattern = MusicTheory.getCircleOfFifthsPattern(settings.startingNote, 'counterclockwise', 4);
        break;
      case 'triangles':
        pattern = MusicTheory.getTrianglePattern(settings.startingNote, 4);
        break;
      case 'squares':
        pattern = MusicTheory.getSquarePattern(settings.startingNote, 4);
        break;
      case 'whole-up':
        pattern = MusicTheory.getWholeTonePattern(settings.startingNote, 'up', 4);
        break;
      case 'whole-down':
        pattern = MusicTheory.getWholeTonePattern(settings.startingNote, 'down', 4);
        break;
      case 'dim-up':
        pattern = MusicTheory.getDiminishedPattern(settings.startingNote, 'up', 4);
        break;
      case 'dim-down':
        pattern = MusicTheory.getDiminishedPattern(settings.startingNote, 'down', 4);
        break;
      case 'chromatic-up':
        pattern = MusicTheory.getChromaticPattern(settings.startingNote, 'up', 4);
        break;
      case 'chromatic-down':
        pattern = MusicTheory.getChromaticPattern(settings.startingNote, 'down', 4);
        break;
    }

    onSettingsChange({ ...settings, currentPattern: pattern });
  };

  const startPlayback = () => {
    if (settings.currentPattern.length === 0) return;

    let currentNoteIndex = 0;
    let playbackRepetition = 0;
    
    const scheduleNote = () => {
      if (!settings.playback.isPlaying) return;

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

      const note = settings.currentPattern[currentNoteIndex];
      setCurrentNoteIndex(currentNoteIndex);
      
      const frequency = AudioEngine.midiToFrequency(note.midi);
      audioEngine.playNote(frequency, 0.3, audioContext?.currentTime);

      playbackRepetition++;
      
      // Move to next note after completing all repetitions for current note
      if (playbackRepetition >= repetitionsPerBar) {
        currentNoteIndex = (currentNoteIndex + 1) % settings.currentPattern.length;
        playbackRepetition = 0;
      }
      
      playbackTimeoutRef.current = setTimeout(scheduleNote, noteInterval * 1000);
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

  const updatePatternType = (patternType: PatternsModeSettings['patternType']) => {
    onSettingsChange({ ...settings, patternType });
  };

  const updateStartingNote = (startingNote: string) => {
    onSettingsChange({ ...settings, startingNote });
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

  const patternOptions = [
    { value: 'circle-cw', label: 'Circle of Fifths (Clockwise)' },
    { value: 'circle-ccw', label: 'Circle of Fifths (Counter-clockwise)' },
    { value: 'triangles', label: 'Triangles (M3 apart)' },
    { value: 'squares', label: 'Squares (m3 apart)' },
    { value: 'whole-up', label: 'Whole Tone (↑)' },
    { value: 'whole-down', label: 'Whole Tone (↓)' },
    { value: 'dim-up', label: 'Half-Whole Diminished (↑)' },
    { value: 'dim-down', label: 'Half-Whole Diminished (↓)' },
    { value: 'chromatic-up', label: 'Chromatic (↑)' },
    { value: 'chromatic-down', label: 'Chromatic (↓)' }
  ];

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const isCirclePattern = ['circle-cw', 'circle-ccw', 'triangles', 'squares'].includes(settings.patternType);
  const isDiminishedPattern = ['dim-up', 'dim-down'].includes(settings.patternType);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--app-primary)]">
              🔄 Patterns
            </h3>
            
            {/* Pattern Selection */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-2">Pattern Type</Label>
              <Select value={settings.patternType} onValueChange={updatePatternType}>
                <SelectTrigger className="w-full app-bg border-[var(--app-elevated)]" data-testid="select-pattern-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="app-surface border-[var(--app-elevated)]">
                  {patternOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Starting Note */}
            <div className="mb-6">
              <Label className="block app-text-secondary font-medium mb-2">Starting Note</Label>
              <Select value={settings.startingNote} onValueChange={updateStartingNote}>
                <SelectTrigger className="w-full app-bg border-[var(--app-elevated)]" data-testid="select-starting-note">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="app-surface border-[var(--app-elevated)]">
                  {notes.map((note) => (
                    <SelectItem key={note} value={note}>
                      {note}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Diminished Family Display */}
            {isDiminishedPattern && (
              <div className="mb-6">
                <div className="app-bg rounded-lg p-3">
                  <h4 className="font-medium mb-2 app-accent text-sm">Dim7 Family</h4>
                  <div className="text-xs app-text-secondary" data-testid="text-diminished-family">
                    {MusicTheory.getDiminishedFamily(settings.startingNote).join(', ')}
                  </div>
                </div>
              </div>
            )}
            
            {/* Playback Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium app-text-secondary">Playback</h4>
                <Button
                  onClick={togglePlayback}
                  disabled={settings.currentPattern.length === 0}
                  className="px-4 py-2 app-success hover:bg-green-600 rounded-lg font-medium transition-colors text-white"
                  data-testid="button-toggle-playback-patterns"
                >
                  {settings.playback.isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {settings.playback.isPlaying ? 'Stop' : 'Play'}
                </Button>
              </div>
              
              {/* BPM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="app-text-secondary font-medium">BPM</Label>
                  <span className="text-lg font-mono" data-testid="text-patterns-bpm">{settings.playback.bpm}</span>
                </div>
                <Slider
                  value={[settings.playback.bpm]}
                  onValueChange={updateBPM}
                  min={20}
                  max={240}
                  step={1}
                  className="w-full"
                  data-testid="slider-patterns-bpm"
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
                      data-testid={`button-subdivision-patterns-${value}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pattern Visualization */}
        <div className="lg:col-span-2">
          <div className="app-surface rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 text-[var(--app-secondary)]">Pattern Visualization</h3>
            
            {/* Circle of Fifths for circle patterns */}
            {isCirclePattern && (
              <div className="flex justify-center mb-6">
                <CircleOfFifths
                  activeNotes={settings.currentPattern.map(note => note.name)}
                  currentNote={settings.currentPattern[currentNoteIndex]?.name}
                  isPlaying={settings.playback.isPlaying}
                  patternType={settings.patternType}
                />
              </div>
            )}
            
            {/* Linear Pattern Display for non-circle patterns */}
            {!isCirclePattern && settings.currentPattern.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-4 gap-4">
                  {settings.currentPattern.map((note, index) => (
                    <div
                      key={index}
                      className={`app-bg rounded-lg p-4 text-center border-2 transition-all ${
                        currentNoteIndex === index && settings.playback.isPlaying
                          ? 'border-[var(--app-primary)] shadow-lg'
                          : 'border-transparent'
                      }`}
                      data-testid={`pattern-note-${index}`}
                    >
                      <div className="text-2xl font-bold app-text-primary">
                        {MusicTheory.formatNoteForDisplay(note)}
                      </div>
                      <div className="app-text-secondary text-sm">
                        {index === 0 ? 'Start' : getStepLabel(settings.patternType)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pattern Information */}
            <div className="app-bg rounded-lg p-4">
              <h4 className="font-medium mb-2 app-accent">Pattern Analysis</h4>
              <div className="app-text-secondary text-sm space-y-1">
                {getPatternDescription(settings.patternType, settings.currentPattern)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getStepLabel(patternType: PatternsModeSettings['patternType']): string {
  switch (patternType) {
    case 'triangles': return '+M3';
    case 'squares': return '+m3';
    case 'whole-up':
    case 'whole-down': return '+W';
    case 'dim-up':
    case 'dim-down': return '+H/W';
    case 'chromatic-up':
    case 'chromatic-down': return '+H';
    default: return '+P5';
  }
}

function getPatternDescription(patternType: PatternsModeSettings['patternType'], pattern: Note[]): JSX.Element[] {
  const descriptions: JSX.Element[] = [];
  
  switch (patternType) {
    case 'circle-cw':
      descriptions.push(<p key="1">• Circle of Fifths progression (clockwise)</p>);
      descriptions.push(<p key="2">• Interval pattern: Perfect Fifth (+7 semitones)</p>);
      break;
    case 'circle-ccw':
      descriptions.push(<p key="1">• Circle of Fifths progression (counter-clockwise)</p>);
      descriptions.push(<p key="2">• Interval pattern: Perfect Fourth (-7 semitones)</p>);
      break;
    case 'triangles':
      descriptions.push(<p key="1">• Major third intervals creating triangular shape</p>);
      descriptions.push(<p key="2">• Four notes return to starting note class</p>);
      break;
    case 'squares':
      descriptions.push(<p key="1">• Minor third intervals creating square shape</p>);
      descriptions.push(<p key="2">• Creates diminished 7th chord pattern</p>);
      break;
    case 'whole-up':
    case 'whole-down':
      descriptions.push(<p key="1">• Whole tone scale pattern</p>);
      descriptions.push(<p key="2">• Equal division of octave by 6</p>);
      break;
    case 'dim-up':
    case 'dim-down':
      descriptions.push(<p key="1">• Half-Whole diminished scale</p>);
      descriptions.push(<p key="2">• Alternating semitone and tone intervals</p>);
      break;
    case 'chromatic-up':
    case 'chromatic-down':
      descriptions.push(<p key="1">• Chromatic movement by semitones</p>);
      descriptions.push(<p key="2">• Equal division of octave by 12</p>);
      break;
  }
  
  if (pattern.length > 0) {
    descriptions.push(
      <p key="sequence">• Sequence: {pattern.map(note => MusicTheory.formatNoteForDisplay(note)).join(' → ')}</p>
    );
  }
  
  return descriptions;
}
