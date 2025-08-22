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

  async initialize(): Promise<AudioContext> {
    if (!this.audioContext) {
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

  createOscillator(frequency: number, startTime: number, duration: number = 0.1): OscillatorNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'sine';

    // Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    return oscillator;
  }

  createClick(isAccent: boolean = false, startTime: number): void {
    if (!this.audioContext) return;

    const frequency = isAccent ? 1000 : 800;
    const duration = isAccent ? 0.1 : 0.05;
    
    this.createOscillator(frequency, startTime, duration);
  }

  playNote(frequency: number, duration: number = 0.5, startTime?: number): void {
    if (!this.audioContext) return;

    const time = startTime || this.audioContext.currentTime;
    this.createOscillator(frequency, time, duration);
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

  // Apply swing to timing
  static applySwing(noteIndex: number, swingPercent: number, baseInterval: number): number {
    if (swingPercent === 50) return baseInterval; // No swing
    
    const swingRatio = swingPercent / 100;
    const isOffBeat = noteIndex % 2 === 1;
    
    if (isOffBeat) {
      // Delay off-beat notes
      return baseInterval * (1 + (swingRatio - 0.5));
    }
    
    return baseInterval;
  }

  destroy() {
    this.stop();
    this.timerWorker?.terminate();
    this.audioContext?.close();
  }
}
