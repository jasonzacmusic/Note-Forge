import type { Note, Interval, Chord, Progression } from "@shared/schema";

export class MusicTheory {
  // Note names and their chromatic positions
  private static readonly noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  private static readonly enharmonicFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Interval definitions
  private static readonly intervals: Record<string, Interval> = {
    'm2': { name: 'Minor Second', abbreviation: 'm2', semitones: 1 },
    'M2': { name: 'Major Second', abbreviation: 'M2', semitones: 2 },
    'm3': { name: 'Minor Third', abbreviation: 'm3', semitones: 3 },
    'M3': { name: 'Major Third', abbreviation: 'M3', semitones: 4 },
    'P4': { name: 'Perfect Fourth', abbreviation: 'P4', semitones: 5 },
    'TT': { name: 'Tritone', abbreviation: 'TT', semitones: 6 },
    'P5': { name: 'Perfect Fifth', abbreviation: 'P5', semitones: 7 },
    'm6': { name: 'Minor Sixth', abbreviation: 'm6', semitones: 8 },
    'M6': { name: 'Major Sixth', abbreviation: 'M6', semitones: 9 },
    'm7': { name: 'Minor Seventh', abbreviation: 'm7', semitones: 10 },
    'M7': { name: 'Major Seventh', abbreviation: 'M7', semitones: 11 },
    'P8': { name: 'Perfect Octave', abbreviation: 'P8', semitones: 12 }
  };

  // Circle of Fifths
  private static readonly circleOfFifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  // Key signatures
  private static readonly keySignatures = {
    'C': { sharps: 0, flats: 0, notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
    'G': { sharps: 1, flats: 0, notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
    'D': { sharps: 2, flats: 0, notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
    'A': { sharps: 3, flats: 0, notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
    'E': { sharps: 4, flats: 0, notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
    'B': { sharps: 5, flats: 0, notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] },
    'F#': { sharps: 6, flats: 0, notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'] },
    'F': { sharps: 0, flats: 1, notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'] },
    'Bb': { sharps: 0, flats: 2, notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'] },
    'Eb': { sharps: 0, flats: 3, notes: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'] },
    'Ab': { sharps: 0, flats: 4, notes: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'] },
    'Db': { sharps: 0, flats: 5, notes: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'] }
  };

  static getNoteFromMidi(midi: number): Note {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return {
      name: this.noteNames[noteIndex],
      midi,
      octave
    };
  }

  static getMidiFromNote(noteName: string, octave: number = 4): number {
    const noteIndex = this.noteNames.indexOf(noteName);
    if (noteIndex === -1) {
      // Try flats
      const flatIndex = this.enharmonicFlats.indexOf(noteName);
      if (flatIndex === -1) throw new Error(`Invalid note name: ${noteName}`);
      return (octave + 1) * 12 + flatIndex;
    }
    return (octave + 1) * 12 + noteIndex;
  }

  static getInterval(fromNote: string, toNote: string): Interval {
    const fromMidi = this.getMidiFromNote(fromNote, 4);
    const toMidi = this.getMidiFromNote(toNote, 4);
    const semitones = Math.abs(toMidi - fromMidi) % 12;
    
    const intervalKey = Object.keys(this.intervals).find(key => 
      this.intervals[key].semitones === semitones
    );
    
    return intervalKey ? this.intervals[intervalKey] : {
      name: `${semitones} semitones`,
      abbreviation: `${semitones}st`,
      semitones
    };
  }

  static generateRandomSequence(
    noteSelection: 'all' | 'white' | 'accidentals' = 'all',
    length: number = 4
  ): Note[] {
    let availableNotes: string[];
    
    switch (noteSelection) {
      case 'white':
        availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        break;
      case 'accidentals':
        // Randomly mix sharps and flats for black keys
        availableNotes = [];
        const blackKeyPairs = [
          ['C#', 'Db'], ['D#', 'Eb'], ['F#', 'Gb'], ['G#', 'Ab'], ['A#', 'Bb']
        ];
        blackKeyPairs.forEach(([sharp, flat]) => {
          availableNotes.push(Math.random() < 0.5 ? sharp : flat);
        });
        break;
      default:
        // For 'all', randomly mix sharps and flats for all chromatic notes
        availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const chromaticPairs = [
          ['C#', 'Db'], ['D#', 'Eb'], ['F#', 'Gb'], ['G#', 'Ab'], ['A#', 'Bb']
        ];
        chromaticPairs.forEach(([sharp, flat]) => {
          availableNotes.push(Math.random() < 0.5 ? sharp : flat);
        });
    }

    const sequence: Note[] = [];
    const usedSemitones = new Set<number>(); // Prevent enharmonic duplicates
    let consecutiveSeconds = 0;

    for (let i = 0; i < length; i++) {
      let attempts = 0;
      let validNote = false;
      
      while (!validNote && attempts < 50) {
        const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
        const noteMidi = this.getMidiFromNote(randomNote, 4);
        const semitone = noteMidi % 12; // Get pitch class only
        
        // Skip if we already used this pitch class (enharmonic equivalent)
        if (usedSemitones.has(semitone)) {
          attempts++;
          continue;
        }
        
        const note: Note = {
          name: randomNote,
          midi: noteMidi,
          octave: 4
        };

        if (sequence.length === 0) {
          sequence.push(note);
          usedSemitones.add(semitone);
          validNote = true;
        } else {
          const lastNote = sequence[sequence.length - 1];
          const interval = this.getInterval(lastNote.name, note.name);
          
          // Rule: No more than 2 consecutive seconds
          if (interval.semitones === 1 || interval.semitones === 2) {
            consecutiveSeconds++;
            if (consecutiveSeconds >= 2) {
              attempts++;
              continue;
            }
          } else {
            consecutiveSeconds = 0;
          }

          // Prefer good intervals
          const preferredIntervals = [3, 4, 5, 7, 8, 9]; // m3, M3, P4, P5, m6, M6
          if (preferredIntervals.includes(interval.semitones) || Math.random() > 0.3) {
            sequence.push(note);
            usedSemitones.add(semitone);
            validNote = true;
          }
        }
        
        attempts++;
      }

      // Fallback if no valid note found
      if (!validNote && sequence.length > 0) {
        const lastNote = sequence[sequence.length - 1];
        const safeSemitones = [5, 7]; // P4, P5
        const randomSemitones = safeSemitones[Math.floor(Math.random() * safeSemitones.length)];
        let newMidi = (lastNote.midi + randomSemitones) % 12;
        
        // Ensure we don't use an already used semitone
        while (usedSemitones.has(newMidi)) {
          newMidi = (newMidi + 1) % 12;
        }
        
        const newNote = this.getNoteFromMidi(newMidi + 60); // Keep in 5th octave
        sequence.push({ ...newNote, octave: 4 });
        usedSemitones.add(newMidi);
      }
    }

    return sequence;
  }

  static getChordFromRomanNumeral(key: string, romanNumeral: string): Chord {
    const keyNotes = this.keySignatures[key as keyof typeof this.keySignatures]?.notes || this.keySignatures['C'].notes;
    
    // Parse roman numeral
    const isMinor = romanNumeral === romanNumeral.toLowerCase();
    const isDiminished = romanNumeral.includes('°');
    const isAugmented = romanNumeral.includes('+');
    const has7th = romanNumeral.includes('7');
    
    // Get scale degree
    const numeralMap: Record<string, number> = {
      'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6,
      'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6
    };
    
    const cleanNumeral = romanNumeral.replace(/[°+7♭]/g, '');
    const scaleDegree = numeralMap[cleanNumeral] || 0;
    const root = keyNotes[scaleDegree];

    // Build chord tones
    const chordTones = [root];
    const rootMidi = this.getMidiFromNote(root, 4);
    
    // Third
    let thirdInterval = isMinor || isDiminished ? 3 : 4; // m3 or M3
    chordTones.push(this.getNoteFromMidi(rootMidi + thirdInterval).name);
    
    // Fifth
    let fifthInterval = isDiminished ? 6 : isAugmented ? 8 : 7; // dim5, aug5, or P5
    chordTones.push(this.getNoteFromMidi(rootMidi + fifthInterval).name);
    
    // Seventh if specified
    if (has7th) {
      const seventhInterval = isMinor || romanNumeral.includes('7') ? 10 : 11; // m7 or M7
      chordTones.push(this.getNoteFromMidi(rootMidi + seventhInterval).name);
    }

    let quality = 'major';
    if (isMinor) quality = 'minor';
    if (isDiminished) quality = 'diminished';
    if (isAugmented) quality = 'augmented';

    return {
      root,
      quality,
      extension: has7th ? '7' : undefined,
      notes: chordTones,
      romanNumeral
    };
  }

  static getProgression(type: 'dorian' | 'pop' | 'jazz', key: string): Progression {
    const progressions = {
      dorian: {
        name: 'Dorian Rock',
        numerals: ['i', '♭III', '♭VII', 'IV']
      },
      pop: {
        name: 'Pop Progression',
        numerals: ['vi', 'IV', 'I', 'V']
      },
      jazz: {
        name: 'Jazz Progression',
        numerals: ['vi', 'ii', 'V', 'I']
      }
    };

    const prog = progressions[type];
    const chords = prog.numerals.map(numeral => 
      this.getChordFromRomanNumeral(key, numeral)
    );

    return {
      name: prog.name,
      chords,
      key,
      mode: type === 'dorian' ? 'dorian' : 'major'
    };
  }

  static getCircleOfFifthsPattern(startNote: string, direction: 'clockwise' | 'counterclockwise', length: number = 4): Note[] {
    // Handle enharmonic equivalents
    const enharmonicMap: Record<string, string> = {
      'C#': 'Db',
      'D#': 'Eb', 
      'F#': 'F#', // Already in circle
      'G#': 'Ab',
      'A#': 'Bb',
      'Db': 'Db', // Already in circle
      'Eb': 'Eb', // Already in circle
      'Gb': 'F#',
      'Ab': 'Ab', // Already in circle
      'Bb': 'Bb'  // Already in circle
    };
    
    const circleNote = enharmonicMap[startNote] || startNote;
    const startIndex = this.circleOfFifths.indexOf(circleNote);
    if (startIndex === -1) throw new Error(`Note ${startNote} not found in circle of fifths`);

    const pattern: Note[] = [];
    for (let i = 0; i < length; i++) {
      const index = direction === 'clockwise' 
        ? (startIndex + i) % 12 
        : (startIndex - i + 12) % 12;
      const noteName = this.circleOfFifths[index];
      pattern.push({
        name: noteName,
        midi: this.getMidiFromNote(noteName, 4),
        octave: 4
      });
    }

    return pattern;
  }

  static getTrianglePattern(startNote: string, length: number = 4): Note[] {
    // Major thirds (4 semitones apart)
    const pattern: Note[] = [];
    let currentMidi = this.getMidiFromNote(startNote, 4);
    
    for (let i = 0; i < length; i++) {
      const note = this.getNoteFromMidi(currentMidi);
      pattern.push({ ...note, octave: 4 });
      currentMidi = (currentMidi + 4) % 12 + 60; // Keep in 5th octave
    }

    return pattern;
  }

  static getSquarePattern(startNote: string, length: number = 4): Note[] {
    // Minor thirds (3 semitones apart)
    const pattern: Note[] = [];
    let currentMidi = this.getMidiFromNote(startNote, 4);
    
    for (let i = 0; i < length; i++) {
      const note = this.getNoteFromMidi(currentMidi);
      pattern.push({ ...note, octave: 4 });
      currentMidi = (currentMidi + 3) % 12 + 60; // Keep in 5th octave
    }

    return pattern;
  }

  static getWholeTonePattern(startNote: string, direction: 'up' | 'down', length: number = 4): Note[] {
    const pattern: Note[] = [];
    let currentMidi = this.getMidiFromNote(startNote, 4);
    
    for (let i = 0; i < length; i++) {
      const note = this.getNoteFromMidi(currentMidi);
      pattern.push({ ...note, octave: 4 });
      currentMidi += direction === 'up' ? 2 : -2; // Whole tone = 2 semitones
    }

    return pattern;
  }

  static getDiminishedPattern(startNote: string, direction: 'up' | 'down', length: number = 4): Note[] {
    // Half-Whole diminished scale pattern
    const pattern: Note[] = [];
    let currentMidi = this.getMidiFromNote(startNote, 4);
    
    for (let i = 0; i < length; i++) {
      const note = this.getNoteFromMidi(currentMidi);
      pattern.push({ ...note, octave: 4 });
      
      // Alternate between half step (1) and whole step (2)
      const step = i % 2 === 0 ? 1 : 2;
      currentMidi += direction === 'up' ? step : -step;
    }

    return pattern;
  }

  static getChromaticPattern(startNote: string, direction: 'up' | 'down', length: number = 4): Note[] {
    const pattern: Note[] = [];
    let currentMidi = this.getMidiFromNote(startNote, 4);
    
    for (let i = 0; i < length; i++) {
      const note = this.getNoteFromMidi(currentMidi);
      pattern.push({ ...note, octave: 4 });
      currentMidi += direction === 'up' ? 1 : -1; // Semitone
    }

    return pattern;
  }

  static getDiminishedFamily(note: string): string[] {
    // Returns all notes in the same diminished 7th chord family
    const rootMidi = this.getMidiFromNote(note, 4);
    const family = [];
    
    for (let i = 0; i < 4; i++) {
      const familyMidi = (rootMidi + i * 3) % 12;
      family.push(this.getNoteFromMidi(familyMidi + 60).name);
    }
    
    return family;
  }

  static formatNoteForDisplay(note: Note): string {
    // Display without octave number as per requirements
    return note.name;
  }

  static getAllIntervalsBetween(note1: Note, note2: Note): Interval[] {
    // For intermediate mode - show ALL possible intervals between notes
    const midi1 = note1.midi;
    const midi2 = note2.midi;
    const intervals: Interval[] = [];
    
    // Calculate intervals in both directions across multiple octaves
    for (let octaveOffset = -1; octaveOffset <= 1; octaveOffset++) {
      const adjustedMidi2 = midi2 + (octaveOffset * 12);
      const semitones = Math.abs(adjustedMidi2 - midi1);
      
      if (semitones <= 12) {
        const intervalKey = Object.keys(this.intervals).find(key => 
          this.intervals[key].semitones === semitones
        );
        
        if (intervalKey && !intervals.some(i => i.semitones === semitones)) {
          intervals.push(this.intervals[intervalKey]);
        }
      }
    }
    
    return intervals.sort((a, b) => a.semitones - b.semitones);
  }
}
