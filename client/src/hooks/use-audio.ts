import { useState, useCallback, useRef } from "react";
import { AudioEngine } from "@/components/audio-engine";

export function useAudio() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  const initializeAudio = useCallback(async () => {
    if (isInitialized) return audioContext;

    try {
      // Create AudioContext
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for mobile)
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Create audio engine instance
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
        await audioEngineRef.current.initialize();
      }

      setAudioContext(context);
      setIsInitialized(true);

      console.log('Audio context initialized successfully');
      return context;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return null;
    }
  }, [isInitialized, audioContext]);

  const unlockAudio = useCallback(async () => {
    if (!audioContext) return;

    try {
      // Create a silent sound to unlock audio on mobile
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.01);
      
      console.log('Audio unlocked for mobile');
    } catch (error) {
      console.error('Failed to unlock audio:', error);
    }
  }, [audioContext]);

  const createOscillator = useCallback((frequency: number, startTime?: number, duration: number = 0.1) => {
    if (!audioContext) return null;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime || audioContext.currentTime);
    oscillator.type = 'sine';

    // Envelope
    const start = startTime || audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(0.3, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.start(start);
    oscillator.stop(start + duration);

    return oscillator;
  }, [audioContext]);

  const createClick = useCallback((isAccent: boolean = false, startTime?: number) => {
    if (!audioContext) return;

    const frequency = isAccent ? 1000 : 800;
    const duration = isAccent ? 0.1 : 0.05;
    const start = startTime || audioContext.currentTime;
    
    createOscillator(frequency, start, duration);
  }, [audioContext, createOscillator]);

  const playNote = useCallback((frequency: number, duration: number = 0.5, startTime?: number) => {
    if (!audioContext) return;

    const start = startTime || audioContext.currentTime;
    createOscillator(frequency, start, duration);
  }, [audioContext, createOscillator]);

  const getCurrentTime = useCallback(() => {
    return audioContext?.currentTime || 0;
  }, [audioContext]);

  const destroy = useCallback(() => {
    audioEngineRef.current?.destroy();
    audioEngineRef.current = null;
    audioContext?.close();
    setAudioContext(null);
    setIsInitialized(false);
  }, [audioContext]);

  return {
    audioContext,
    isInitialized,
    initializeAudio,
    unlockAudio,
    createOscillator,
    createClick,
    playNote,
    getCurrentTime,
    destroy,
    audioEngine: audioEngineRef.current
  };
}
