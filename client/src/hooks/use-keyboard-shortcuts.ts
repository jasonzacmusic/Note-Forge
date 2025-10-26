import { useEffect } from "react";
import type { AppSettings } from "@shared/schema";

interface UseKeyboardShortcutsProps {
  currentMode: AppSettings['currentMode'];
  onModeChange: (mode: AppSettings['currentMode']) => void;
  onBpmChange: (delta: number) => void;
  onSubdivisionChange: (subdivision: "1" | "2" | "3" | "4") => void;
  onTogglePlayback: () => void;
}

export function useKeyboardShortcuts({
  currentMode,
  onModeChange,
  onBpmChange,
  onSubdivisionChange,
  onTogglePlayback
}: UseKeyboardShortcutsProps) {
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Prevent default for handled shortcuts
      const shouldPreventDefault = () => {
        switch (event.code) {
          case 'Space':
          case 'ArrowUp':
          case 'ArrowDown':
          case 'Digit1':
          case 'Digit2':
          case 'Digit3':
          case 'Digit4':
          case 'KeyR':
          case 'KeyP':
          case 'KeyT':
          case 'KeyG':
            return true;
          default:
            return false;
        }
      };

      if (shouldPreventDefault()) {
        event.preventDefault();
      }

      switch (event.code) {
        // Space: Toggle playback
        case 'Space':
          onTogglePlayback();
          break;

        // Arrow Up: Increase BPM
        case 'ArrowUp':
          if (event.shiftKey) {
            onBpmChange(10); // +10 BPM with Shift
          } else {
            onBpmChange(1); // +1 BPM
          }
          break;

        // Arrow Down: Decrease BPM
        case 'ArrowDown':
          if (event.shiftKey) {
            onBpmChange(-10); // -10 BPM with Shift
          } else {
            onBpmChange(-1); // -1 BPM
          }
          break;

        // Number keys: Set subdivision
        case 'Digit1':
          onSubdivisionChange("1");
          break;
        case 'Digit2':
          onSubdivisionChange("2");
          break;
        case 'Digit3':
          onSubdivisionChange("3");
          break;
        case 'Digit4':
          onSubdivisionChange("4");
          break;

        // Mode switching shortcuts
        case 'KeyR':
          if (currentMode !== 'random') {
            onModeChange('random');
          }
          break;
        case 'KeyP':
          if (currentMode !== 'progressions') {
            onModeChange('progressions');
          }
          break;
        case 'KeyT':
          if (currentMode !== 'patterns') {
            onModeChange('patterns');
          }
          break;
        case 'KeyG':
          if (currentMode !== 'glossary') {
            onModeChange('glossary');
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMode, onModeChange, onBpmChange, onSubdivisionChange, onTogglePlayback]);
}
