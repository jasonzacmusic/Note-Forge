export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private lookaheadTime = 0.1; // 100ms
  private scheduleAheadTime = 0.025; // 25ms
  private nextNoteTime = 0;
  private currentBeat = 0;
  private tempo = 120;
  private isPlaying = false;
  private timerWorker: Worker | null = null;
  private scheduledNotes: Array<{ time: number; note: number; velocity: number }> = [];
  private activeOscillators: Map<string, { oscillators: OscillatorNode[], gains: GainNode[], masterGain: GainNode, cleanupTimeout?: number }> = new Map();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    // Create a Web Worker for precise timing
    const workerBlob = new Blob([`
      let timerID = null;
      let interval = 100;

      self.onmessage = function(e) {
        if (e.data === "start") {
          timerID = setInterval(() => self.postMessage("tick"), interval);
        } else if (e.data === "stop") {
          clearInterval(timerID);
          timerID = null;
        } else if (e.data.interval) {
          interval = e.data.interval;
          if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(() => self.postMessage("tick"), interval);
          }
        }
      };
    `], { type: 'application/javascript' });

    this.timerWorker = new Worker(URL.createObjectURL(workerBlob));
    this.timerWorker.onmessage = () => {
      if (this.isPlaying) {
        this.scheduler();
      }
    };
  }

  async initialize(providedContext?: AudioContext): Promise<AudioContext> {
    if (providedContext) {
      this.audioContext = providedContext;
    } else if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (mobile requirement)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
    return this.audioContext;
  }

  private scheduler() {
    if (!this.audioContext) return;

    // Schedule notes that fall within the lookahead window
    while (this.nextNoteTime < this.audioContext.currentTime + this.lookaheadTime) {
      this.scheduleNote(this.nextNoteTime, this.currentBeat);
      this.nextNote();
    }
  }

  private scheduleNote(time: number, beat: number) {
    // This will be overridden by the implementing class
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat++;
  }

  createPianoSound(frequency: number, startTime: number, duration: number = 0.5, trackKey?: string): void {
    if (!this.audioContext) return;

    // Create multiple oscillators for a richer piano-like sound
    const fundamental = this.audioContext.createOscillator();
    const harmonic2 = this.audioContext.createOscillator();
    const harmonic3 = this.audioContext.createOscillator();
    
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();

    // Connect oscillators to gains
    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);
    
    fundamentalGain.connect(masterGain);
    harmonic2Gain.connect(masterGain);
    harmonic3Gain.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    // Set frequencies (fundamental + harmonics)
    fundamental.frequency.setValueAtTime(frequency, startTime);
    harmonic2.frequency.setValueAtTime(frequency * 2, startTime);
    harmonic3.frequency.setValueAtTime(frequency * 3, startTime);

    // Use triangle waves for warmer sound
    fundamental.type = 'triangle';
    harmonic2.type = 'sine';
    harmonic3.type = 'sine';

    // Set volumes for each harmonic
    fundamentalGain.gain.setValueAtTime(0.5, startTime);
    harmonic2Gain.gain.setValueAtTime(0.2, startTime);
    harmonic3Gain.gain.setValueAtTime(0.1, startTime);

    // Piano-like envelope (quick attack, longer decay)
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.1);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Track active oscillators for crossfading
    if (trackKey) {
      this.activeOscillators.set(trackKey, {
        oscillators: [fundamental, harmonic2, harmonic3],
        gains: [fundamentalGain, harmonic2Gain, harmonic3Gain],
        masterGain
      });
      
      // Clean up after the note ends
      setTimeout(() => {
        this.activeOscillators.delete(trackKey);
      }, (startTime - this.audioContext!.currentTime + duration) * 1000);
    }

    // Start and stop all oscillators
    [fundamental, harmonic2, harmonic3].forEach(osc => {
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  createOscillator(frequency: number, startTime: number, duration: number = 0.1, waveType: OscillatorType | 'piano' = 'sine', trackKey?: string): void {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    if (waveType === 'piano') {
      this.createPianoSound(frequency, startTime, duration, trackKey);
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = waveType as OscillatorType;

    // Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Track active oscillators for crossfading
    if (trackKey) {
      this.activeOscillators.set(trackKey, {
        oscillators: [oscillator],
        gains: [gainNode],
        masterGain: gainNode
      });
      
      // Clean up after the note ends
      setTimeout(() => {
        this.activeOscillators.delete(trackKey);
      }, (startTime - this.audioContext!.currentTime + duration) * 1000);
    }

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  createClick(isAccent: boolean = false, startTime: number): void {
    if (!this.audioContext) return;

    const frequency = isAccent ? 1000 : 800;
    const duration = isAccent ? 0.1 : 0.05;
    
    this.createOscillator(frequency, startTime, duration);
  }

  playNote(frequency: number, duration: number = 0.5, startTime?: number, waveType: OscillatorType | 'piano' = 'sine', trackKey?: string): void {
    if (!this.audioContext) return;

    const time = startTime || this.audioContext.currentTime;
    this.createOscillator(frequency, time, duration, waveType, trackKey);
  }

  // Crossfade between wave types for seamless transition
  crossfadeToWaveType(frequency: number, newWaveType: OscillatorType | 'piano', crossfadeDuration: number = 0.3): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const trackKey = 'preview';
    
    // Fade out existing preview if it exists
    const existingPreview = this.activeOscillators.get(trackKey);
    if (existingPreview) {
      // Clear any existing cleanup timeout to prevent stale cleanup
      if (existingPreview.cleanupTimeout !== undefined) {
        clearTimeout(existingPreview.cleanupTimeout);
      }
      
      // Fade out old wave type
      existingPreview.masterGain.gain.cancelScheduledValues(currentTime);
      const currentGain = existingPreview.masterGain.gain.value;
      existingPreview.masterGain.gain.setValueAtTime(currentGain, currentTime);
      
      // Guard against exponential ramp from zero - use linear ramp if gain is too low
      if (currentGain > 0.001) {
        existingPreview.masterGain.gain.exponentialRampToValueAtTime(0.001, currentTime + crossfadeDuration);
      } else {
        existingPreview.masterGain.gain.linearRampToValueAtTime(0, currentTime + crossfadeDuration);
      }
      
      // Stop old oscillators after fadeout
      existingPreview.oscillators.forEach(osc => {
        try {
          osc.stop(currentTime + crossfadeDuration);
        } catch (e) {
          // Already stopped
        }
      });
      
      // Remove from tracking after fadeout - don't use setTimeout to avoid stale cleanup
      this.activeOscillators.delete(trackKey);
    }

    // Create new wave type with fade in
    if (newWaveType === 'piano') {
      this.createPianoSoundWithCrossfade(frequency, currentTime, 1.0, crossfadeDuration, trackKey);
    } else {
      this.createOscillatorWithCrossfade(frequency, currentTime, 1.0, newWaveType, crossfadeDuration, trackKey);
    }
  }

  private createOscillatorWithCrossfade(frequency: number, startTime: number, duration: number, waveType: OscillatorType, crossfadeDuration: number, trackKey: string): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = waveType;

    // Crossfade in envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + crossfadeDuration);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    // Track for future crossfading with cleanup timeout
    const cleanupTimeout = setTimeout(() => {
      this.activeOscillators.delete(trackKey);
    }, (duration) * 1000) as unknown as number;

    this.activeOscillators.set(trackKey, {
      oscillators: [oscillator],
      gains: [gainNode],
      masterGain: gainNode,
      cleanupTimeout
    });
  }

  private createPianoSoundWithCrossfade(frequency: number, startTime: number, duration: number, crossfadeDuration: number, trackKey: string): void {
    if (!this.audioContext) return;

    const fundamental = this.audioContext.createOscillator();
    const harmonic2 = this.audioContext.createOscillator();
    const harmonic3 = this.audioContext.createOscillator();
    
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();

    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);
    
    fundamentalGain.connect(masterGain);
    harmonic2Gain.connect(masterGain);
    harmonic3Gain.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    fundamental.frequency.setValueAtTime(frequency, startTime);
    harmonic2.frequency.setValueAtTime(frequency * 2, startTime);
    harmonic3.frequency.setValueAtTime(frequency * 3, startTime);

    fundamental.type = 'triangle';
    harmonic2.type = 'sine';
    harmonic3.type = 'sine';

    fundamentalGain.gain.setValueAtTime(0.5, startTime);
    harmonic2Gain.gain.setValueAtTime(0.2, startTime);
    harmonic3Gain.gain.setValueAtTime(0.1, startTime);

    // Crossfade in envelope
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.4, startTime + crossfadeDuration);
    masterGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.1 + crossfadeDuration);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    [fundamental, harmonic2, harmonic3].forEach(osc => {
      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Track for future crossfading with cleanup timeout
    const cleanupTimeout = setTimeout(() => {
      this.activeOscillators.delete(trackKey);
    }, (duration) * 1000) as unknown as number;

    this.activeOscillators.set(trackKey, {
      oscillators: [fundamental, harmonic2, harmonic3],
      gains: [fundamentalGain, harmonic2Gain, harmonic3Gain],
      masterGain,
      cleanupTimeout
    });
  }

  start(bpm: number = 120) {
    if (!this.audioContext) return;

    this.tempo = bpm;
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    this.timerWorker?.postMessage("start");
  }

  stop() {
    this.isPlaying = false;
    this.timerWorker?.postMessage("stop");
    this.scheduledNotes = [];
  }

  setBPM(bpm: number) {
    this.tempo = Math.max(20, Math.min(240, bpm));
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  // Convert MIDI note number to frequency
  static midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Apply swing to eighth note timing (simple ON/OFF for 2/3 timing)
  static getSwingDelay(noteIndex: number, swingEnabled: boolean, eighthNoteInterval: number): number {
    if (!swingEnabled) return 0; // No swing delay when OFF
    
    const isOffBeatEighth = noteIndex % 2 === 1;
    
    if (isOffBeatEighth) {
      // Move eighth notes (off beats) to the 66.67% (2/3rd) mark of the beat
      return eighthNoteInterval / 3; // Delay by 1/3 of eighth interval to reach 2/3 of beat
    }
    
    return 0; // On-beat notes stay exactly on beat
  }

  destroy() {
    this.stop();
    this.timerWorker?.terminate();
    this.audioContext?.close();
  }
}
