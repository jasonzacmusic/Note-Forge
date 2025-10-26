import { z } from "zod";

// Music theory types
export const noteSchema = z.object({
  name: z.string(), // e.g., "C", "F#", "Bb"
  midi: z.number().min(0).max(127),
  octave: z.number().min(0).max(10)
});

export const intervalSchema = z.object({
  name: z.string(), // e.g., "Perfect Fifth", "Minor Third"
  abbreviation: z.string(), // e.g., "P5", "m3"
  semitones: z.number().min(0).max(12)
});

export const chordSchema = z.object({
  root: z.string(),
  quality: z.string(), // "major", "minor", "diminished", "augmented"
  extension: z.string().optional(), // "7", "maj7", etc.
  notes: z.array(z.string()),
  romanNumeral: z.string()
});

export const progressionSchema = z.object({
  name: z.string(),
  chords: z.array(chordSchema),
  key: z.string(),
  mode: z.string()
});

// Application state types
export const playbackStateSchema = z.object({
  isPlaying: z.boolean(),
  bpm: z.number().min(20).max(240),
  subdivision: z.enum(["1", "2", "3", "4"]),
  swing: z.number().min(0).max(100),
  swingEnabled: z.boolean(),
  volume: z.number().min(0).max(100)
});

export const randomModeSettingsSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate"]),
  noteSelection: z.enum(["all", "white", "accidentals", "enharmonics"]),
  intervalCategory: z.enum(["resolutions", "tensions", "anticipations", "mystery"]).optional(),
  selectedInterval: z.number().optional(),
  selectedIntervalKey: z.string().optional(),
  generatedNotes: z.array(noteSchema),
  playback: playbackStateSchema
});

export const progressionsModeSettingsSchema = z.object({
  selectedKey: z.string(),
  selectedProgression: z.enum(["major", "harmonic-minor", "andalusian", "dorian", "pop", "jazz"]),
  cycleStart: z.number().min(0).max(3),
  currentProgression: progressionSchema.optional(),
  playback: playbackStateSchema
});

export const patternsModeSettingsSchema = z.object({
  patternType: z.enum([
    "circle-cw", "circle-ccw", "triangles", "squares",
    "whole-up", "whole-down", "dim-up", "dim-down",
    "chromatic-up", "chromatic-down"
  ]),
  startingNote: z.string(),
  currentPattern: z.array(noteSchema),
  playback: playbackStateSchema
});

export const appSettingsSchema = z.object({
  globalMetronome: z.object({
    isActive: z.boolean(),
    volume: z.number().min(0).max(100)
  }),
  globalAudio: z.object({
    waveType: z.enum(["sine", "triangle", "sawtooth", "square", "piano"])
  }),
  currentMode: z.enum(["random", "progressions", "patterns", "glossary"]),
  randomMode: randomModeSettingsSchema,
  progressionsMode: progressionsModeSettingsSchema,
  patternsMode: patternsModeSettingsSchema,
  history: z.array(z.any()).max(20)
});

// Export types
export type Note = z.infer<typeof noteSchema>;
export type Interval = z.infer<typeof intervalSchema>;
export type Chord = z.infer<typeof chordSchema>;
export type Progression = z.infer<typeof progressionSchema>;
export type PlaybackState = z.infer<typeof playbackStateSchema>;
export type RandomModeSettings = z.infer<typeof randomModeSettingsSchema>;
export type ProgressionsModeSettings = z.infer<typeof progressionsModeSettingsSchema>;
export type PatternsModeSettings = z.infer<typeof patternsModeSettingsSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
