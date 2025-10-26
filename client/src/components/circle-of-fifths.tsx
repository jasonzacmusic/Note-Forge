import { useMemo } from "react";

interface CircleOfFifthsProps {
  activeNotes: string[];
  currentNote?: string;
  isPlaying: boolean;
  patternType: string;
}

export function CircleOfFifths({ activeNotes, currentNote, isPlaying, patternType }: CircleOfFifthsProps) {
  // Circle of Fifths note positions (clockwise from C at top) with enharmonic equivalents
  const notes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/Gb', 'Db/C#', 'Ab/G#', 'Eb/D#', 'Bb/A#', 'F'];
  
  // Calculate positions around the circle
  const notePositions = useMemo(() => {
    return notes.map((note, index) => {
      const angle = (index * 30) - 90; // Start at top, 30 degrees per note
      const radian = (angle * Math.PI) / 180;
      const radius = 140; // Distance from center
      
      return {
        note,
        x: 160 + radius * Math.cos(radian), // Center at 160,160
        y: 160 + radius * Math.sin(radian),
        angle
      };
    });
  }, []);

  // Helper function to find note position with enharmonic matching
  const findNotePosition = useMemo(() => (searchNote: string) => {
    return notePositions.find(pos => {
      const noteVariants = pos.note.includes('/') ? pos.note.split('/') : [pos.note];
      return noteVariants.includes(searchNote) || 
        noteVariants.some(variant => {
          const enharmonicMap: Record<string, string> = {
            'F#': 'Gb', 'Gb': 'F#',
            'C#': 'Db', 'Db': 'C#', 
            'G#': 'Ab', 'Ab': 'G#',
            'D#': 'Eb', 'Eb': 'D#',
            'A#': 'Bb', 'Bb': 'A#'
          };
          return enharmonicMap[searchNote] === variant;
        });
    });
  }, [notePositions]);

  // Generate connection lines for patterns
  const connectionLines = useMemo(() => {
    if (!isPlaying || activeNotes.length < 2) return [];
    
    const lines = [];
    for (let i = 0; i < activeNotes.length - 1; i++) {
      const fromPos = findNotePosition(activeNotes[i]);
      const toPos = findNotePosition(activeNotes[i + 1]);
      
      if (fromPos && toPos) {
        lines.push({
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
          isActive: i === 0 // Highlight the current connection
        });
      }
    }
    
    // Connect last to first for looping patterns
    if (activeNotes.length > 2) {
      const fromPos = findNotePosition(activeNotes[activeNotes.length - 1]);
      const toPos = findNotePosition(activeNotes[0]);
      
      if (fromPos && toPos) {
        lines.push({
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
          isActive: false
        });
      }
    }
    
    return lines;
  }, [activeNotes, notePositions, isPlaying]);

  return (
    <div className="relative w-80 h-80 app-bg rounded-full border-4 border-[var(--app-elevated)]" data-testid="circle-of-fifths">
      {/* Inner circle */}
      <div className="absolute inset-4 rounded-full border-2 border-[var(--app-elevated)] opacity-50"></div>
      
      {/* SVG for shapes and connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
        {/* Pattern-specific shapes - render FIRST so they're behind connection lines */}
        {patternType === 'triangles' && activeNotes.length >= 3 && (
          <polygon
            points={[0, 1, 2].map(index => {
              const note = activeNotes[index];
              const pos = findNotePosition(note);
              return pos ? `${pos.x},${pos.y}` : '';
            }).filter(p => p).join(' ')}
            fill="rgba(99, 102, 241, 0.5)"
            stroke="rgb(99, 102, 241)"
            strokeWidth="6"
            data-testid="triangle-shape"
          />
        )}
        
        {patternType === 'squares' && activeNotes.length >= 4 && (
          <polygon
            points={[0, 1, 2, 3].map(index => {
              const note = activeNotes[index];
              const pos = findNotePosition(note);
              return pos ? `${pos.x},${pos.y}` : '';
            }).filter(p => p).join(' ')}
            fill="rgba(236, 72, 153, 0.5)"
            stroke="rgb(236, 72, 153)"
            strokeWidth="6"
            data-testid="square-shape"
          />
        )}
        
        {connectionLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.isActive ? "var(--app-primary)" : "var(--app-secondary)"}
            strokeWidth="3"
            opacity={line.isActive ? "1" : "0.6"}
            data-testid={`connection-line-${index}`}
          />
        ))}
      </svg>
      
      {/* Note positions */}
      {notePositions.map(({ note, x, y }) => {
        // Check for enharmonic equivalents in activeNotes
        const noteVariants = note.includes('/') ? note.split('/') : [note];
        const isActive = activeNotes.some(activeNote => 
          noteVariants.includes(activeNote) || 
          noteVariants.some(variant => {
            // Check enharmonic equivalents
            const enharmonicMap: Record<string, string> = {
              'F#': 'Gb', 'Gb': 'F#',
              'C#': 'Db', 'Db': 'C#', 
              'G#': 'Ab', 'Ab': 'G#',
              'D#': 'Eb', 'Eb': 'D#',
              'A#': 'Bb', 'Bb': 'A#'
            };
            return enharmonicMap[activeNote] === variant;
          })
        );
        const isCurrent = noteVariants.includes(currentNote || '');
        
        return (
          <div
            key={note}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isCurrent && isPlaying
                ? 'circle-note active'
                : isActive
                ? 'circle-note highlighted'
                : 'app-surface circle-note'
            }`}
            style={{ left: x, top: y }}
            data-testid={`circle-note-${note}`}
          >
            {note}
          </div>
        );
      })}
      
      {/* Center label */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-sm app-text-secondary font-medium">Circle</div>
        <div className="text-xs app-text-secondary">of Fifths</div>
      </div>
    </div>
  );
}
