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

const INTERVAL_INFO: Record<string, { facts: string[]; songs: string[]; theory: string }> = {
  'P5': {
    facts: ['Most consonant interval after the octave', 'Foundation of Western harmony', 'Used to tune instruments'],
    songs: ['Twinkle Twinkle Little Star (opening)', 'Star Wars Theme', 'Scarborough Fair'],
    theory: 'Start on any note and count up 7 semitones (half steps). On the piano, skip 6 keys total.'
  },
  'P4': {
    facts: ['Inverts to a Perfect 5th', 'Called "perfect" because it sounds pure', 'Used in church music for centuries'],
    songs: ['Here Comes the Bride', 'Amazing Grace', 'We Wish You a Merry Christmas'],
    theory: 'Start on any note and count up 5 semitones. On the piano, skip 4 keys total.'
  },
  'M3': {
    facts: ['Defines major chords', 'Sounds bright and happy', 'Two whole steps apart'],
    songs: ['When the Saints Go Marching In', 'Kumbaya', 'Morning Has Broken'],
    theory: 'Start on any note and count up 4 semitones. On the piano, skip 3 keys total.'
  },
  'm3': {
    facts: ['Defines minor chords', 'Sounds dark and somber', 'One and a half steps apart'],
    songs: ['Greensleeves', 'Hey Jude (chorus)', 'Smoke on the Water'],
    theory: 'Start on any note and count up 3 semitones. On the piano, skip 2 keys total.'
  },
  'M6': {
    facts: ['Inverts to a minor 3rd', 'Sounds sweet and nostalgic', 'Common in romantic melodies'],
    songs: ['My Bonnie Lies Over the Ocean', 'It Came Upon a Midnight Clear', 'Take On Me'],
    theory: 'Start on any note and count up 9 semitones. On the piano, skip 8 keys total.'
  },
  'm6': {
    facts: ['Sounds melancholic', 'Inverts to a major 3rd', 'Common in minor key progressions'],
    songs: ['The Entertainer', 'Love Story (Where Do I Begin)', 'Black Orpheus'],
    theory: 'Start on any note and count up 8 semitones. On the piano, skip 7 keys total.'
  },
  'M2': {
    facts: ['A whole step', 'Most common melodic interval', 'Foundation of major scales'],
    songs: ['Silent Night', 'Happy Birthday', 'Frère Jacques'],
    theory: 'Start on any note and count up 2 semitones. On the piano, skip 1 key.'
  },
  'm2': {
    facts: ['A half step', 'Smallest interval in Western music', 'Creates tension and dissonance'],
    songs: ['Jaws Theme', 'Pink Panther Theme', 'Für Elise (opening)'],
    theory: 'Start on any note and move to the very next key on the piano (no keys skipped).'
  },
  'M7': {
    facts: ['Very dissonant', 'Creates tension', 'Wants to resolve upward'],
    songs: ['Take On Me (synth riff)', 'Somewhere (West Side Story)', 'Fantasy (Earth Wind & Fire)'],
    theory: 'Start on any note and count up 11 semitones. Almost an octave, just one key down.'
  },
  'm7': {
    facts: ['Used in dominant 7th chords', 'Sounds bluesy', 'Less dissonant than Major 7th'],
    songs: ['Somewhere Over the Rainbow', 'Star Trek Theme', 'Watermelon Man'],
    theory: 'Start on any note and count up 10 semitones. Skip 9 keys on the piano.'
  },
  'TT': {
    facts: ['Exactly half an octave', 'Called "diabolus in musica" (devil in music)', 'Splits the octave evenly'],
    songs: ['The Simpsons Theme', 'Black Sabbath', 'Maria (West Side Story)'],
    theory: 'Start on any note and count up 6 semitones. Divides the octave perfectly in half.'
  },
  'A5': {
    facts: ['One semitone wider than Perfect 5th', 'Creates an augmented chord', 'Sounds tense and unstable'],
    songs: ['Oh Darling (Beatles)', 'Dancing Queen (ABBA)', 'Whole Lotta Love (Led Zeppelin)'],
    theory: 'Start on any note and count up 8 semitones. One semitone more than a Perfect 5th.'
  },
  'P8': {
    facts: ['Same note, different octave', 'Most consonant interval', 'Frequency doubles'],
    songs: ['Somewhere Over the Rainbow (first two notes)', 'Singin\' in the Rain', 'Bali Hai'],
    theory: 'Start on any note and count up 12 semitones. Same letter name, one octave higher.'
  }
};

interface RandomModeProps {
  settings: RandomModeSettings;
  onSettingsChange: (settings: RandomModeSettings) => void;
  audioContext: AudioContext | null;
  globalAudioSettings: { waveType: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano' };
  sharedAudioEngine: AudioEngine;
  currentWaveTypeRef: React.MutableRefObject<'sine' | 'triangle' | 'sawtooth' | 'square' | 'piano'>;
}

export function RandomMode({ settings, onSettingsChange, audioContext, globalAudioSettings, sharedAudioEngine, currentWaveTypeRef }: RandomModeProps) {
  const audioEngine = sharedAudioEngine;
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [intervalAnalysis, setIntervalAnalysis] = useState<Interval[]>([]);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldContinuePlaybackRef = useRef(false);
  
  // Use refs to store current playback settings for dynamic updates without restart
  const currentBpmRef = useRef(settings.playback.bpm);
  const currentSubdivisionRef = useRef(settings.playback.subdivision);
  const currentSwingRef = useRef(settings.playback.swingEnabled);

  // Update refs whenever settings change
  useEffect(() => {
    currentBpmRef.current = settings.playback.bpm;
    currentSubdivisionRef.current = settings.playback.subdivision;
    currentSwingRef.current = settings.playback.swingEnabled;
  }, [settings.playback.bpm, settings.playback.subdivision, settings.playback.swingEnabled]);

  useEffect(() => {
    // Listen for global stop event
    const handleStopAllAudio = () => {
      stopPlayback();
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => window.removeEventListener('stopAllAudio', handleStopAllAudio);
  }, []);

  useEffect(() => {
    if (settings.playback.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [settings.playback.isPlaying]);

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
    // For intermediate mode, don't use rare enharmonics unless explicitly selecting "enharmonics"
    let noteSelectionForGeneration = settings.noteSelection;
    if (settings.difficulty === 'intermediate' && settings.noteSelection === 'enharmonics') {
      // In intermediate mode, treat enharmonics as 'all' to exclude rare enharmonics
      noteSelectionForGeneration = 'all';
    }
    const newNotes = MusicTheory.generateRandomSequence(noteSelectionForGeneration, 4);
    
    // Update notes but don't auto-play (user must press Play button)
    onSettingsChange({
      ...settings,
      generatedNotes: newNotes,
      playback: { ...settings.playback, isPlaying: false }
    });
  };

  const startPlayback = () => {
    if (settings.generatedNotes.length === 0 || !audioContext) return;

    // Enable playback in audio engine
    audioEngine.enablePlayback();
    
    // Set flag to allow playback continuation
    shouldContinuePlaybackRef.current = true;
    
    let currentNoteIndex = 0;
    let playbackRepetition = 0;
    let nextNoteTime = audioContext.currentTime;
    
    const scheduleNote = () => {
      // Check ref flag to prevent old closures from continuing
      if (!shouldContinuePlaybackRef.current || settings.generatedNotes.length === 0) return;

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
      
      // Use refs to get latest values dynamically
      const repetitionsPerBar = getRepetitionsPerBar(currentSubdivisionRef.current);
      const noteInterval = (60 / currentBpmRef.current) / (repetitionsPerBar / 4); // Time between repetitions

      // Always use current notes from settings
      const currentNotes = settings.generatedNotes;
      if (currentNoteIndex >= currentNotes.length) {
        currentNoteIndex = 0; // Reset if index is out of bounds
      }
      
      const note = currentNotes[currentNoteIndex];
      setCurrentNoteIndex(currentNoteIndex);
      
      // Schedule note immediately with no delay  
      const playTime = Math.max(nextNoteTime, audioContext.currentTime);
      
      // Play note across multiple octaves for beginner mode
      if (settings.difficulty === 'beginner') {
        for (let octave = 3; octave <= 6; octave++) {
          const frequency = AudioEngine.midiToFrequency(note.midi + (octave - 4) * 12);
          audioEngine.playNote(frequency, 0.2, playTime, currentWaveTypeRef.current);
        }
      } else {
        // Intermediate mode: play note + selected interval simultaneously
        const frequency = AudioEngine.midiToFrequency(note.midi);
        audioEngine.playNote(frequency, 0.3, playTime, currentWaveTypeRef.current);
        
        // Play the selected interval with the note
        if (settings.selectedInterval !== undefined) {
          const intervalFreq = AudioEngine.midiToFrequency(note.midi + settings.selectedInterval);
          audioEngine.playNote(intervalFreq, 0.2, playTime, currentWaveTypeRef.current);
        }
      }

      playbackRepetition++;
      
      // Move to next note after completing all repetitions for current note
      if (playbackRepetition >= repetitionsPerBar) {
        currentNoteIndex = (currentNoteIndex + 1) % currentNotes.length;
        playbackRepetition = 0;
      }
      
      // Apply swing only to quavers (eighth notes) when enabled
      let swingDelay = 0;
      if (currentSubdivisionRef.current === "2" && currentSwingRef.current) {
        swingDelay = AudioEngine.getSwingDelay(playbackRepetition, currentSwingRef.current, noteInterval);
      }
      
      // Schedule next note using Web Audio precision with swing delay
      nextNoteTime += noteInterval + swingDelay;
      
      // Only continue if still playing
      if (settings.playback.isPlaying) {
        // Use immediate callback for better timing  
        const timeUntilNext = Math.max(10, (nextNoteTime - audioContext.currentTime) * 1000 - 10);
        playbackTimeoutRef.current = setTimeout(scheduleNote, timeUntilNext);
      }
    };

    scheduleNote();
  };

  const stopPlayback = () => {
    // Immediately stop playback continuation flag
    shouldContinuePlaybackRef.current = false;
    
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

  const resetRandomModeState = () => {
    // Clear local state
    setCurrentNoteIndex(0);
    setIntervalAnalysis([]);
    
    // Clear playback timeouts
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    shouldContinuePlaybackRef.current = false;
    
    // Stop audio engine
    audioEngine.stop();
  };

  const updateDifficulty = (difficulty: 'beginner' | 'intermediate') => {
    // Reset all state when switching difficulty levels
    resetRandomModeState();
    
    // For intermediate mode, generate random notes
    if (difficulty === 'intermediate') {
      const newNotes = MusicTheory.generateRandomSequence('all', 4);
      
      onSettingsChange({ 
        ...settings, 
        difficulty,
        generatedNotes: newNotes,
        selectedInterval: 7,
        selectedIntervalKey: 'P5',
        playback: { ...settings.playback, isPlaying: false }
      });
    } else {
      // Beginner mode: clear everything
      onSettingsChange({ 
        ...settings, 
        difficulty,
        generatedNotes: [],
        selectedInterval: undefined,
        selectedIntervalKey: undefined,
        playback: { ...settings.playback, isPlaying: false }
      });
    }
  };

  const updateNoteSelection = (noteSelection: 'all' | 'white' | 'accidentals' | 'enharmonics') => {
    // Generate new notes when note selection changes, but don't auto-play
    // For intermediate mode, don't use rare enharmonics unless explicitly selecting "enharmonics"
    let noteSelectionForGeneration = noteSelection;
    if (settings.difficulty === 'intermediate' && noteSelection === 'enharmonics') {
      // In intermediate mode, treat enharmonics as 'all' to exclude rare enharmonics
      noteSelectionForGeneration = 'all';
    }
    const newNotes = MusicTheory.generateRandomSequence(noteSelectionForGeneration, 4);
    
    onSettingsChange({ 
      ...settings, 
      noteSelection,
      generatedNotes: newNotes,
      playback: { ...settings.playback, isPlaying: false }
    });
  };

  const updateSelectedInterval = (selectedInterval: number, intervalKey?: string) => {
    // Generate random notes - interval selection only affects playback, not note generation
    const newNotes = MusicTheory.generateRandomSequence('all', 4);
    
    onSettingsChange({ 
      ...settings, 
      selectedInterval,
      selectedIntervalKey: intervalKey,
      generatedNotes: newNotes,
      playback: { ...settings.playback, isPlaying: false }
    });
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

  const updateSwing = (swingEnabled: boolean) => {
    onSettingsChange({
      ...settings,
      playback: { ...settings.playback, swingEnabled }
    });
  };


  return (
    <section className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="app-surface rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="w-10 h-10 rounded-xl app-primary flex items-center justify-center mr-3 md:mr-4">
                <span className="text-white text-xl">🎲</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold app-text-primary">Random Notes</h3>
                <p className="text-xs md:text-sm app-text-secondary">Generate random note sequences</p>
              </div>
            </div>
            
            {/* Difficulty Level */}
            <div className="mb-4 md:mb-8">
              <Label className="block app-text-primary font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">
                Difficulty Level
              </Label>
              <RadioGroup
                value={settings.difficulty}
                onValueChange={updateDifficulty}
                className="grid grid-cols-2 gap-3 md:gap-4"
              >
                <div className={`p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  settings.difficulty === 'beginner' 
                    ? 'border-[var(--app-primary)] app-elevated shadow-md' 
                    : 'border-[var(--app-border)] hover:border-[var(--app-primary)] app-elevated'
                }`}>
                  <RadioGroupItem value="beginner" id="beginner" className="sr-only" />
                  <Label htmlFor="beginner" className="cursor-pointer block">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl mb-1 md:mb-2">🌟</div>
                      <div className={`font-bold text-sm md:text-base ${settings.difficulty === 'beginner' ? 'text-[var(--app-primary)]' : 'app-text-primary'}`}>Beginner</div>
                      <div className="text-xs app-text-secondary mt-1">Note Recognition</div>
                    </div>
                  </Label>
                </div>
                <div className={`p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  settings.difficulty === 'intermediate' 
                    ? 'border-[var(--app-secondary)] app-elevated shadow-md' 
                    : 'border-[var(--app-border)] hover:border-[var(--app-secondary)] app-elevated'
                }`}>
                  <RadioGroupItem value="intermediate" id="intermediate" className="sr-only" />
                  <Label htmlFor="intermediate" className="cursor-pointer block">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl mb-1 md:mb-2">🎯</div>
                      <div className={`font-bold text-sm md:text-base ${settings.difficulty === 'intermediate' ? 'text-[var(--app-secondary)]' : 'app-text-primary'}`}>Intermediate</div>
                      <div className="text-xs app-text-secondary mt-1">Interval Practice</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Note Selection - Only for Beginner */}
            {settings.difficulty === 'beginner' && (
              <div className="mb-4 md:mb-8">
                <Label className="block app-text-primary font-semibold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">
                  Note Selection
                </Label>
                <RadioGroup
                  value={settings.noteSelection}
                  onValueChange={updateNoteSelection}
                  disabled={settings.playback.isPlaying}
                  className="space-y-2 md:space-y-3"
                >
                  <div className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                    settings.playback.isPlaying 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                      : 'cursor-pointer'
                  } ${
                    settings.noteSelection === 'all' 
                      ? 'border-[var(--app-accent)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-accent)] app-elevated'
                  }`}>
                    <RadioGroupItem value="all" id="all-notes" className="sr-only" />
                    <Label htmlFor="all-notes" className="cursor-pointer flex items-center">
                      <span className="text-lg md:text-xl mr-2 md:mr-3">🎹</span>
                      <div>
                        <div className={`font-bold text-sm md:text-base ${settings.noteSelection === 'all' ? 'text-[var(--app-accent)]' : 'app-text-primary'}`}>All 12 Notes</div>
                        <div className="text-xs app-text-secondary">Chromatic scale</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                    settings.playback.isPlaying 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                      : 'cursor-pointer'
                  } ${
                    settings.noteSelection === 'white' 
                      ? 'border-[var(--app-secondary)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-secondary)] app-elevated'
                  }`}>
                    <RadioGroupItem value="white" id="white-notes" className="sr-only" />
                    <Label htmlFor="white-notes" className="cursor-pointer flex items-center">
                      <span className="text-lg md:text-xl mr-2 md:mr-3">⚪</span>
                      <div>
                        <div className={`font-bold text-sm md:text-base ${settings.noteSelection === 'white' ? 'text-[var(--app-secondary)]' : 'app-text-primary'}`}>White Keys Only</div>
                        <div className="text-xs app-text-secondary">Natural notes</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                    settings.playback.isPlaying 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                      : 'cursor-pointer'
                  } ${
                    settings.noteSelection === 'accidentals' 
                      ? 'border-[var(--app-warning)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-warning)] app-elevated'
                  }`}>
                    <RadioGroupItem value="accidentals" id="black-notes" className="sr-only" />
                    <Label htmlFor="black-notes" className="cursor-pointer flex items-center">
                      <span className="text-lg md:text-xl mr-2 md:mr-3">⚫</span>
                      <div>
                        <div className={`font-bold text-sm md:text-base ${settings.noteSelection === 'accidentals' ? 'text-[var(--app-warning)]' : 'app-text-primary'}`}>Black Keys Only</div>
                        <div className="text-xs app-text-secondary">Sharps and flats</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                    settings.playback.isPlaying 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                      : 'cursor-pointer'
                  } ${
                    settings.noteSelection === 'enharmonics' 
                      ? 'border-[var(--app-primary)] app-elevated shadow-md' 
                      : 'border-[var(--app-border)] hover:border-[var(--app-primary)] app-elevated'
                  }`}>
                    <RadioGroupItem value="enharmonics" id="enharmonic-notes" className="sr-only" />
                    <Label htmlFor="enharmonic-notes" className="cursor-pointer flex items-center">
                      <span className="text-lg md:text-xl mr-2 md:mr-3">🎭</span>
                      <div>
                        <div className={`font-bold text-sm md:text-base ${settings.noteSelection === 'enharmonics' ? 'text-[var(--app-primary)]' : 'app-text-primary'}`}>Include Enharmonics</div>
                        <div className="text-xs app-text-secondary">E#, Fb, B#, Cb</div>
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
                      value={settings.selectedIntervalKey || settings.selectedInterval?.toString()}
                      onValueChange={(value) => {
                        if (value === 'P8') {
                          updateSelectedInterval(12, 'P8');
                        } else if (value === 'P5') {
                          updateSelectedInterval(7, 'P5');
                        } else if (value === 'M3') {
                          updateSelectedInterval(4, 'M3');
                        } else if (value === 'm3') {
                          updateSelectedInterval(3, 'm3');
                        } else {
                          updateSelectedInterval(parseInt(value));
                        }
                      }}
                      disabled={settings.playback.isPlaying}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="unison" />
                        <Label htmlFor="unison" className="app-text-primary text-sm">Unison</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="P8" id="octave" />
                        <Label htmlFor="octave" className="app-text-primary text-sm">Octave</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="P5" id="perfect-5th" />
                        <Label htmlFor="perfect-5th" className="app-text-primary text-sm">Perfect 5th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M3" id="major-3rd" />
                        <Label htmlFor="major-3rd" className="app-text-primary text-sm">Major 3rd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="m3" id="minor-3rd" />
                        <Label htmlFor="minor-3rd" className="app-text-primary text-sm">Minor 3rd</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Tensions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Tensions</h4>
                    <RadioGroup
                      value={settings.selectedIntervalKey || settings.selectedInterval?.toString()}
                      onValueChange={(value) => {
                        if (value === 'm2') {
                          updateSelectedInterval(1, 'm2');
                        } else if (value === 'TT') {
                          updateSelectedInterval(6, 'TT');
                        } else if (value === 'M7') {
                          updateSelectedInterval(11, 'M7');
                        } else {
                          updateSelectedInterval(parseInt(value));
                        }
                      }}
                      disabled={settings.playback.isPlaying}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="m2" id="minor-2nd" />
                        <Label htmlFor="minor-2nd" className="app-text-primary text-sm">Minor 2nd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="TT" id="tritone" />
                        <Label htmlFor="tritone" className="app-text-primary text-sm">Tritone</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M7" id="major-7th" />
                        <Label htmlFor="major-7th" className="app-text-primary text-sm">Major 7th</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Anticipations */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Anticipations</h4>
                    <RadioGroup
                      value={settings.selectedIntervalKey || settings.selectedInterval?.toString()}
                      onValueChange={(value) => {
                        if (value === 'P4') {
                          updateSelectedInterval(5, 'P4');
                        } else if (value === 'm7') {
                          updateSelectedInterval(10, 'm7');
                        } else if (value === 'M2') {
                          updateSelectedInterval(2, 'M2');
                        } else {
                          updateSelectedInterval(parseInt(value));
                        }
                      }}
                      disabled={settings.playback.isPlaying}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="P4" id="perfect-4th" />
                        <Label htmlFor="perfect-4th" className="app-text-primary text-sm">Perfect 4th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="m7" id="minor-7th" />
                        <Label htmlFor="minor-7th" className="app-text-primary text-sm">Minor 7th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M2" id="major-2nd" />
                        <Label htmlFor="major-2nd" className="app-text-primary text-sm">Major 2nd</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Mystery */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium app-text-primary border-b border-[var(--app-elevated)] pb-1">Mystery</h4>
                    <RadioGroup
                      value={settings.selectedIntervalKey || settings.selectedInterval?.toString()}
                      onValueChange={(value) => {
                        // Check if it's an interval key (like 'A5', 'm6') or a number
                        if (value === 'A5') {
                          updateSelectedInterval(8, 'A5');
                        } else if (value === 'm6') {
                          updateSelectedInterval(8, 'm6');
                        } else if (value === 'M6') {
                          updateSelectedInterval(9, 'M6');
                        } else {
                          updateSelectedInterval(parseInt(value));
                        }
                      }}
                      disabled={settings.playback.isPlaying}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="A5" id="aug-5th" />
                        <Label htmlFor="aug-5th" className="app-text-primary text-sm">Augmented 5th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="m6" id="minor-6th" />
                        <Label htmlFor="minor-6th" className="app-text-primary text-sm">Minor 6th</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M6" id="major-6th" />
                        <Label htmlFor="major-6th" className="app-text-primary text-sm">Major 6th</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Generated Sequence Display */}
        <div className="lg:col-span-2">
          <div className="app-surface rounded-xl md:rounded-xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-[var(--app-secondary)]">Generated Sequence</h3>
            
            {/* Note Display */}
            {settings.generatedNotes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                {settings.generatedNotes.map((note, index) => {
                  // Calculate interval partner note (e.g., Major 6th of current note)
                  let intervalPartnerNote = null;
                  if (settings.difficulty === 'intermediate' && settings.selectedIntervalKey) {
                    intervalPartnerNote = MusicTheory.generateNoteWithInterval(note.name, settings.selectedIntervalKey);
                  }
                  
                  // Calculate next note in sequence for intermediate mode
                  let nextSequenceNote = null;
                  if (settings.difficulty === 'intermediate' && index < settings.generatedNotes.length - 1) {
                    nextSequenceNote = settings.generatedNotes[index + 1].name;
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`note-card rounded-lg p-4 md:p-6 text-center ${
                        currentNoteIndex === index && settings.playback.isPlaying ? 'active' : ''
                      }`}
                      data-testid={`note-card-${index}`}
                    >
                      <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 app-text-primary">
                        {MusicTheory.formatNoteForDisplay(note)}
                      </div>
                      {intervalPartnerNote && (
                        <div className="app-text-secondary text-xs md:text-sm mb-1 md:mb-2">
                          {note.name} - {intervalPartnerNote}
                        </div>
                      )}
                      {nextSequenceNote && (
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[var(--app-elevated)]" data-testid={`interval-${index}`}>
                          <div className="app-accent text-xs md:text-sm font-semibold">→ {nextSequenceNote}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 app-text-secondary text-sm md:text-base">
                Click "Generate Random Notes" to create a 4 note sequence
              </div>
            )}
            
            {/* Theory Information */}
            {settings.generatedNotes.length > 0 && settings.difficulty === 'intermediate' && settings.selectedIntervalKey && INTERVAL_INFO[settings.selectedIntervalKey] && (
              <div className="app-bg rounded-lg p-3 md:p-4">
                <h4 className="font-medium mb-2 md:mb-3 app-accent text-base md:text-lg">
                  {MusicTheory.getIntervalByKey(settings.selectedIntervalKey)?.name || 'Interval'} Information
                </h4>
                <div className="app-text-secondary text-xs md:text-sm space-y-2 md:space-y-3">
                  <div>
                    <h5 className="font-semibold app-text-primary mb-1">📚 Facts:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {INTERVAL_INFO[settings.selectedIntervalKey].facts.map((fact, i) => (
                        <li key={i}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold app-text-primary mb-1">🎵 Famous Songs:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {INTERVAL_INFO[settings.selectedIntervalKey].songs.map((song, i) => (
                        <li key={i}>{song}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold app-text-primary mb-1">🎹 How to Form It:</h5>
                    <p className="italic">{INTERVAL_INFO[settings.selectedIntervalKey].theory}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generate Button */}
            <Button
              onClick={generateRandomNotes}
              disabled={settings.playback.isPlaying}
              className="w-full app-primary text-white hover:opacity-90 transition-all hover:scale-105 shadow-lg py-3 md:py-4 text-base md:text-lg font-semibold rounded-xl mt-4 md:mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              data-testid="button-generate-random"
            >
              <span className="text-lg md:text-xl mr-2 md:mr-3">🎲</span>
              Generate New Notes
            </Button>
            
            {/* Playback Controls */}
            <div className="space-y-4 md:space-y-6 app-elevated rounded-xl p-4 md:p-6 mt-4 md:mt-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h4 className="font-semibold app-text-primary text-base md:text-lg">Playback Controls</h4>
                <Button
                  onClick={togglePlayback}
                  disabled={settings.generatedNotes.length === 0}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all shadow-md text-sm md:text-base ${
                    settings.playback.isPlaying 
                      ? 'app-danger text-white hover:opacity-90' 
                      : 'app-secondary text-white hover:opacity-90 hover:scale-105'
                  }`}
                  data-testid="button-toggle-playback-random"
                >
                  {settings.playback.isPlaying ? <Pause className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" /> : <Play className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />}
                  {settings.playback.isPlaying ? 'Stop' : 'Play'}
                </Button>
              </div>
              
              {/* BPM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="app-text-secondary font-medium text-sm md:text-base">BPM</Label>
                  <span className="text-base md:text-lg font-mono" data-testid="text-random-bpm">{settings.playback.bpm}</span>
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
                <Label className="block app-text-secondary font-medium mb-2 text-sm md:text-base">Subdivision</Label>
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
                    <Label className="app-text-secondary font-medium">Swing Feel</Label>
                    <Button
                      onClick={() => updateSwing(!settings.playback.swingEnabled)}
                      className={`px-3 py-1 rounded font-medium text-sm ${
                        settings.playback.swingEnabled
                          ? 'app-accent-light text-[var(--app-accent)]'
                          : 'app-elevated border-[var(--app-border)]'
                      }`}
                      data-testid="button-random-swing"
                    >
                      {settings.playback.swingEnabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  {settings.playback.swingEnabled && (
                    <div className="text-xs app-text-secondary">8th notes at 2/3 timing</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
