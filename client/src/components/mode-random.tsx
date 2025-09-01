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
  globalAudioSettings: { waveType: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano' };
}

export function RandomMode({ settings, onSettingsChange, audioContext, globalAudioSettings }: RandomModeProps) {
  const [audioEngine] = useState(() => new AudioEngine());
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [intervalAnalysis, setIntervalAnalysis] = useState<Interval[]>([]);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioContext) {
      audioEngine.initialize(audioContext);
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
      startPlayback();
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
    // Generate random notes using selected note type (white/black/all)
    const newNotes = MusicTheory.generateRandomSequence(settings.noteSelection, 4);
    
    // Update notes and start playback
    onSettingsChange({
      ...settings,
      generatedNotes: newNotes,
      playback: { ...settings.playback, isPlaying: true }
    });
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
      
      // Schedule note at precise Web Audio time (with swing already applied)
      const playTime = nextNoteTime;
      
      // Play note across multiple octaves for beginner mode
      if (settings.difficulty === 'beginner') {
        for (let octave = 3; octave <= 6; octave++) {
          const frequency = AudioEngine.midiToFrequency(note.midi + (octave - 4) * 12);
          audioEngine.playNote(frequency, 0.2, playTime, globalAudioSettings.waveType);
        }
      } else {
        // Intermediate mode: play note + selected interval simultaneously
        const frequency = AudioEngine.midiToFrequency(note.midi);
        audioEngine.playNote(frequency, 0.3, playTime, globalAudioSettings.waveType);
        
        // Play the selected interval with the note
        if (settings.selectedInterval !== undefined) {
          const intervalFreq = AudioEngine.midiToFrequency(note.midi + settings.selectedInterval);
          audioEngine.playNote(intervalFreq, 0.2, playTime, globalAudioSettings.waveType);
        }
      }

      playbackRepetition++;
      
      // Move to next note after completing all repetitions for current note
      if (playbackRepetition >= repetitionsPerBar) {
        currentNoteIndex = (currentNoteIndex + 1) % currentNotes.length;
        playbackRepetition = 0;
      }
      
      // Apply swing only to quavers (eighth notes) - affects timing placement, not tempo
      let swingDelay = 0;
      if (settings.playback.subdivision === "2" && settings.playback.swing !== 50) {
        swingDelay = AudioEngine.getSwingDelay(playbackRepetition, settings.playback.swing, noteInterval);
      }
      
      // Schedule next note using Web Audio precision with swing delay
      nextNoteTime += noteInterval + swingDelay;
      
      // Only continue if still playing
      if (settings.playback.isPlaying) {
        // Schedule callback slightly before next note time
        const timeUntilNext = Math.max(50, (nextNoteTime - audioContext.currentTime) * 1000 - 25);
        playbackTimeoutRef.current = setTimeout(scheduleNote, timeUntilNext);
      }
    };

    scheduleNote();
  };

  const stopPlayback = () => {
    // Clear any pending timeouts immediately
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    
    // Force stop audio engine
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

  const updateSelectedInterval = (selectedInterval: number) => {
    onSettingsChange({ ...settings, selectedInterval });
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
    <section className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="app-surface rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl app-primary flex items-center justify-center mr-4">
                <span className="text-white text-xl">🎲</span>
              </div>
              <div>
                <h3 className="text-xl font-bold app-text-primary">Random Notes</h3>
                <p className="text-sm app-text-secondary">Generate random note sequences</p>
              </div>
            </div>
            
            {/* Difficulty Level */}
            <div className="mb-8">
              <Label className="block app-text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
                Difficulty Level
              </Label>
              <RadioGroup
                value={settings.difficulty}
                onValueChange={updateDifficulty}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  settings.difficulty === 'beginner' 
                    ? 'border-[var(--app-primary)] app-elevated shadow-md' 
                    : 'border-[var(--app-border)] hover:border-[var(--app-primary)] app-elevated'
                }`}>
                  <RadioGroupItem value="beginner" id="beginner" className="sr-only" />
                  <Label htmlFor="beginner" className="cursor-pointer block">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌟</div>
                      <div className={`font-bold ${settings.difficulty === 'beginner' ? 'text-[var(--app-primary)]' : 'app-text-primary'}`}>Beginner</div>
                      <div className="text-xs app-text-secondary mt-1">Basic intervals</div>
                    </div>
                  </Label>
                </div>
                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  settings.difficulty === 'intermediate' 
                    ? 'border-[var(--app-secondary)] app-elevated shadow-md' 
                    : 'border-[var(--app-border)] hover:border-[var(--app-secondary)] app-elevated'
                }`}>
                  <RadioGroupItem value="intermediate" id="intermediate" className="sr-only" />
                  <Label htmlFor="intermediate" className="cursor-pointer block">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className={`font-bold ${settings.difficulty === 'intermediate' ? 'text-[var(--app-secondary)]' : 'app-text-primary'}`}>Intermediate</div>
                      <div className="text-xs app-text-secondary mt-1">Complex intervals</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Note Selection - Only for Beginner */}
            {settings.difficulty === 'beginner' && (
              <div className="mb-8">
                <Label className="block app-text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
                  Note Selection
                </Label>
                <RadioGroup
                  value={settings.noteSelection}
                  onValueChange={updateNoteSelection}
                  className="space-y-3"
                >
                  <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    settings.noteSelection === 'all' 
                      ? 'border-[var(--app-accent)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-accent)] app-elevated'
                  }`}>
                    <RadioGroupItem value="all" id="all-notes" className="sr-only" />
                    <Label htmlFor="all-notes" className="cursor-pointer flex items-center">
                      <span className="text-xl mr-3">🎹</span>
                      <div>
                        <div className={`font-bold ${settings.noteSelection === 'all' ? 'text-[var(--app-accent)]' : 'app-text-primary'}`}>All 12 Notes</div>
                        <div className="text-xs app-text-secondary">Chromatic scale</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    settings.noteSelection === 'white' 
                      ? 'border-[var(--app-secondary)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-secondary)] app-elevated'
                  }`}>
                    <RadioGroupItem value="white" id="white-notes" className="sr-only" />
                    <Label htmlFor="white-notes" className="cursor-pointer flex items-center">
                      <span className="text-xl mr-3">⚪</span>
                      <div>
                        <div className={`font-bold ${settings.noteSelection === 'white' ? 'text-[var(--app-secondary)]' : 'app-text-primary'}`}>White Keys Only</div>
                        <div className="text-xs app-text-secondary">Natural notes</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    settings.noteSelection === 'accidentals' 
                      ? 'border-[var(--app-warning)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-warning)] app-elevated'
                  }`}>
                    <RadioGroupItem value="accidentals" id="black-notes" className="sr-only" />
                    <Label htmlFor="black-notes" className="cursor-pointer flex items-center">
                      <span className="text-xl mr-3">⚫</span>
                      <div>
                        <div className={`font-bold ${settings.noteSelection === 'accidentals' ? 'text-[var(--app-warning)]' : 'app-text-primary'}`}>Black Keys Only</div>
                        <div className="text-xs app-text-secondary">Sharps and flats</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Interval Selection for Intermediate */}
            {settings.difficulty === 'intermediate' && (
              <div className="mb-6">
                <Label className="block app-text-secondary font-medium mb-3">Select Interval</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Resolutions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Resolutions</h4>
                    <RadioGroup
                      value={settings.selectedInterval?.toString()}
                      onValueChange={(value) => updateSelectedInterval(parseInt(value))}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="unison" />
                        <Label htmlFor="unison" className="app-text-primary text-sm">Unison</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="5" id="perfect-4th" />
                        <Label htmlFor="perfect-4th" className="app-text-primary text-sm">Perfect 4th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7" id="perfect-5th" />
                        <Label htmlFor="perfect-5th" className="app-text-primary text-sm">Perfect 5th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="12" id="octave" />
                        <Label htmlFor="octave" className="app-text-primary text-sm">Octave</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Tensions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Tensions</h4>
                    <RadioGroup
                      value={settings.selectedInterval?.toString()}
                      onValueChange={(value) => updateSelectedInterval(parseInt(value))}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="minor-2nd" />
                        <Label htmlFor="minor-2nd" className="app-text-primary text-sm">Minor 2nd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6" id="tritone" />
                        <Label htmlFor="tritone" className="app-text-primary text-sm">Tritone</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10" id="minor-7th" />
                        <Label htmlFor="minor-7th" className="app-text-primary text-sm">Minor 7th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="11" id="major-7th" />
                        <Label htmlFor="major-7th" className="app-text-primary text-sm">Major 7th</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Anticipations */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Anticipations</h4>
                    <RadioGroup
                      value={settings.selectedInterval?.toString()}
                      onValueChange={(value) => updateSelectedInterval(parseInt(value))}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="major-2nd" />
                        <Label htmlFor="major-2nd" className="app-text-primary text-sm">Major 2nd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4" id="major-3rd" />
                        <Label htmlFor="major-3rd" className="app-text-primary text-sm">Major 3rd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="9" id="major-6th" />
                        <Label htmlFor="major-6th" className="app-text-primary text-sm">Major 6th</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Mystery */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Mystery</h4>
                    <RadioGroup
                      value={settings.selectedInterval?.toString()}
                      onValueChange={(value) => updateSelectedInterval(parseInt(value))}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="minor-3rd" />
                        <Label htmlFor="minor-3rd" className="app-text-primary text-sm">Minor 3rd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="8" id="minor-6th" />
                        <Label htmlFor="minor-6th" className="app-text-primary text-sm">Minor 6th</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generate Button */}
            <Button
              onClick={generateRandomNotes}
              className="w-full app-primary text-white hover:opacity-90 transition-all hover:scale-105 shadow-lg py-4 text-lg font-semibold rounded-xl mb-8"
              data-testid="button-generate-random"
            >
              <span className="text-xl mr-3">🎲</span>
              Generate New Notes
            </Button>
            
            {/* Playback Controls */}
            <div className="space-y-6 app-elevated rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold app-text-primary text-lg">Playback Controls</h4>
                <Button
                  onClick={togglePlayback}
                  disabled={settings.generatedNotes.length === 0}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                    settings.playback.isPlaying 
                      ? 'app-danger text-white hover:opacity-90' 
                      : 'app-secondary text-white hover:opacity-90 hover:scale-105'
                  }`}
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
