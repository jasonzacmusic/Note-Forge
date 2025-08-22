import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function GlossaryMode() {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Intervals */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-primary)] flex items-center">
              📏 Intervals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Minor Second (m2)", semitones: "1 semitone" },
                { name: "Major Second (M2)", semitones: "2 semitones" },
                { name: "Minor Third (m3)", semitones: "3 semitones" },
                { name: "Major Third (M3)", semitones: "4 semitones" },
                { name: "Perfect Fourth (P4)", semitones: "5 semitones" },
                { name: "Tritone (TT/♯4)", semitones: "6 semitones" },
                { name: "Perfect Fifth (P5)", semitones: "7 semitones" },
                { name: "Minor Sixth (m6)", semitones: "8 semitones" },
                { name: "Major Sixth (M6)", semitones: "9 semitones" },
                { name: "Minor Seventh (m7)", semitones: "10 semitones" },
                { name: "Major Seventh (M7)", semitones: "11 semitones" },
                { name: "Perfect Octave (P8)", semitones: "12 semitones" }
              ].map((interval, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 app-bg rounded"
                  data-testid={`interval-${interval.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <span className="font-medium app-text-primary">{interval.name}</span>
                  <span className="app-text-secondary">{interval.semitones}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Scales */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-secondary)] flex items-center">
              🎼 Scales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Major Scale", pattern: "W-W-H-W-W-W-H" },
                { name: "Natural Minor", pattern: "W-H-W-W-H-W-W" },
                { name: "Harmonic Minor", pattern: "W-H-W-W-H-W+H-H" },
                { name: "Melodic Minor", pattern: "W-H-W-W-W-W-H" },
                { name: "Major Pentatonic", pattern: "W-W-W+H-W-W+H" },
                { name: "Minor Pentatonic", pattern: "W+H-W-W-W+H-W" },
                { name: "Blues Scale", pattern: "W+H-W-H-H-W+H-W" }
              ].map((scale, index) => (
                <div
                  key={index}
                  className="p-3 app-bg rounded"
                  data-testid={`scale-${scale.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="font-medium mb-1 app-text-primary">{scale.name}</div>
                  <div className="app-text-secondary text-sm">{scale.pattern}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Chords */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-accent)] flex items-center">
              🎹 Chords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Triads */}
              <div>
                <h4 className="font-medium mb-2 app-text-secondary">Triads</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major", formula: "R - M3 - P5" },
                    { name: "Minor", formula: "R - m3 - P5" },
                    { name: "Diminished", formula: "R - m3 - dim5" },
                    { name: "Augmented", formula: "R - M3 - aug5" }
                  ].map((chord, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 app-bg rounded text-sm"
                      data-testid={`triad-${chord.name.toLowerCase()}`}
                    >
                      <span className="app-text-primary">{chord.name}</span>
                      <span className="app-text-secondary">{chord.formula}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator className="bg-[var(--app-elevated)]" />
              
              {/* 7th Chords */}
              <div>
                <h4 className="font-medium mb-2 app-text-secondary">7th Chords</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major 7th", formula: "R - M3 - P5 - M7" },
                    { name: "Dominant 7th", formula: "R - M3 - P5 - m7" },
                    { name: "Minor 7th", formula: "R - m3 - P5 - m7" },
                    { name: "Half-Diminished 7th", formula: "R - m3 - dim5 - m7" },
                    { name: "Fully Diminished 7th", formula: "R - m3 - dim5 - dim7" }
                  ].map((chord, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 app-bg rounded text-sm"
                      data-testid={`seventh-${chord.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <span className="app-text-primary">{chord.name}</span>
                      <span className="app-text-secondary">{chord.formula}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Timing & Subdivisions */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-secondary)] flex items-center">
              ⏱️ Timing & Subdivisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: "1× Quarter Notes", 
                  description: "Basic pulse at tempo BPM",
                  swingApplicable: false
                },
                { 
                  name: "2× Quavers (8th Notes)", 
                  description: "2 notes per beat, swing applicable",
                  swingApplicable: true
                },
                { 
                  name: "3× Triplets", 
                  description: "3 evenly spaced notes per beat",
                  swingApplicable: false
                },
                { 
                  name: "4× Semiquavers (16th Notes)", 
                  description: "4 notes per beat, swing applicable",
                  swingApplicable: true
                }
              ].map((subdivision, index) => (
                <div
                  key={index}
                  className="p-3 app-bg rounded"
                  data-testid={`subdivision-${subdivision.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="font-medium mb-1 app-text-primary flex items-center justify-between">
                    {subdivision.name}
                    {subdivision.swingApplicable && (
                      <span className="text-xs app-accent bg-[var(--app-surface)] px-2 py-1 rounded">
                        Swing
                      </span>
                    )}
                  </div>
                  <div className="app-text-secondary text-sm">{subdivision.description}</div>
                </div>
              ))}
              
              <div className="mt-4 p-3 app-elevated rounded border-l-4 border-[var(--app-secondary)]">
                <div className="font-medium mb-1 text-[var(--app-secondary)]">Swing Feel</div>
                <div className="app-text-secondary text-sm">
                  Only affects 2× and 4× subdivisions. Creates uneven spacing between note pairs for jazzy feel. 
                  50% = straight, higher values = more swing.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Music Theory Concepts */}
      <Card className="app-surface border-[var(--app-elevated)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--app-primary)]">
            🎓 Key Concepts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Circle of Fifths */}
            <div>
              <h4 className="font-semibold mb-3 app-text-primary">Circle of Fifths</h4>
              <div className="space-y-2 text-sm app-text-secondary">
                <p>• Visual representation of key signatures and relationships</p>
                <p>• Moving clockwise: adds sharps (Perfect 5th up)</p>
                <p>• Moving counter-clockwise: adds flats (Perfect 4th up)</p>
                <p>• Triangles: Major 3rd intervals (4 notes = octave)</p>
                <p>• Squares: Minor 3rd intervals (diminished 7th chords)</p>
              </div>
            </div>
            
            {/* Enharmonic Equivalents */}
            <div>
              <h4 className="font-semibold mb-3 app-text-primary">Enharmonic Spelling</h4>
              <div className="space-y-2 text-sm app-text-secondary">
                <p>• Sharp keys (G, D, A, E, B, F#): use sharps</p>
                <p>• Flat keys (F, Bb, Eb, Ab, Db): use flats</p>
                <p>• Context matters: F# in G major, Gb in Db major</p>
                <p>• Proper spelling maintains diatonic relationships</p>
              </div>
            </div>
            
            {/* Roman Numeral Analysis */}
            <div>
              <h4 className="font-semibold mb-3 app-text-primary">Roman Numeral Analysis</h4>
              <div className="space-y-2 text-sm app-text-secondary">
                <p>• Uppercase (I, IV, V): Major chords</p>
                <p>• Lowercase (i, ii, vi): Minor chords</p>
                <p>• Diminished: i°, ii°, vii°</p>
                <p>• Augmented: I+, V+</p>
                <p>• Extensions: V7, ii7, vi7, etc.</p>
              </div>
            </div>
            
            {/* Audio Engine Precision */}
            <div>
              <h4 className="font-semibold mb-3 app-text-primary">Timing Precision</h4>
              <div className="space-y-2 text-sm app-text-secondary">
                <p>• Web Audio API with 100ms lookahead scheduling</p>
                <p>• 25ms scheduler tick rate for precision</p>
                <p>• Target: &lt;5ms timing jitter</p>
                <p>• Mobile audio unlock on first user gesture</p>
                <p>• Triplets: evenly spaced (beat ÷ 3)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
