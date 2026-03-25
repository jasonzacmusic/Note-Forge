import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function GlossaryMode() {
  return (
    <section className="space-y-6">
      {/* Intro */}
      <div className="max-w-3xl">
        <p className="app-text-secondary text-sm leading-relaxed">
          A working reference for the theory behind this tool. Everything here connects directly
          to what you hear in the Random, Progressions, and Patterns modes — so if something
          sounds unfamiliar, look it up here, then go back and play it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Intervals */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-primary)]">
              Intervals
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              The distance between two pitches, measured in semitones. Every melody you've ever
              heard is just a sequence of these.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Unison (P1)", semitones: "0", character: "Same note" },
                { name: "Minor 2nd (m2)", semitones: "1", character: "Tense, dissonant — Jaws theme" },
                { name: "Major 2nd (M2)", semitones: "2", character: "Stepping motion — scale movement" },
                { name: "Minor 3rd (m3)", semitones: "3", character: "Sad, dark — minor chord foundation" },
                { name: "Major 3rd (M3)", semitones: "4", character: "Bright, happy — major chord foundation" },
                { name: "Perfect 4th (P4)", semitones: "5", character: "Open, stable — Here Comes the Bride" },
                { name: "Tritone (TT/d5)", semitones: "6", character: "Unstable, wants to resolve — the devil's interval" },
                { name: "Perfect 5th (P5)", semitones: "7", character: "Strong, hollow — power chords" },
                { name: "Minor 6th (m6)", semitones: "8", character: "Bittersweet — inverted M3" },
                { name: "Major 6th (M6)", semitones: "9", character: "Warm, nostalgic — My Bonnie" },
                { name: "Minor 7th (m7)", semitones: "10", character: "Bluesy tension — dominant chords" },
                { name: "Major 7th (M7)", semitones: "11", character: "Dreamy, jazzy — one semitone from home" },
                { name: "Octave (P8)", semitones: "12", character: "Same note, higher — Somewhere Over the Rainbow" },
              ].map((interval, index) => (
                <div
                  key={index}
                  className="p-2.5 app-bg rounded"
                  data-testid={`interval-${interval.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium app-text-primary text-sm">{interval.name}</span>
                    <span className="app-text-secondary text-xs font-mono">{interval.semitones}st</span>
                  </div>
                  <span className="app-text-secondary text-xs">{interval.character}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scales & Modes */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-secondary)]">
              Scales & Modes
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              A scale is a collection of notes that work together. The pattern of whole steps (W)
              and half steps (H) gives each scale its sound. Same notes, different starting point = different mode.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 app-text-secondary text-xs uppercase tracking-wide">Diatonic (7-note)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major (Ionian)", pattern: "W-W-H-W-W-W-H", note: "The foundation. Bright, resolved, home base." },
                    { name: "Natural Minor (Aeolian)", pattern: "W-H-W-W-H-W-W", note: "Relative minor of every major key. Dark but natural." },
                    { name: "Harmonic Minor", pattern: "W-H-W-W-H-3H-H", note: "Raised 7th creates a leading tone. That exotic, Eastern European sound." },
                    { name: "Melodic Minor", pattern: "W-H-W-W-W-W-H", note: "Raised 6th and 7th ascending. Used heavily in jazz." },
                    { name: "Dorian", pattern: "W-H-W-W-W-H-W", note: "Minor with a bright 6th. Think So What, or Scarborough Fair." },
                    { name: "Mixolydian", pattern: "W-W-H-W-W-H-W", note: "Major with a flat 7th. Blues-rock and folk." },
                  ].map((scale, index) => (
                    <div
                      key={index}
                      className="p-2.5 app-bg rounded"
                      data-testid={`scale-${scale.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-medium app-text-primary text-sm">{scale.name}</span>
                        <span className="app-text-secondary text-xs font-mono">{scale.pattern}</span>
                      </div>
                      <span className="app-text-secondary text-xs">{scale.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--app-elevated)]" />

              <div>
                <h4 className="font-medium mb-2 app-text-secondary text-xs uppercase tracking-wide">Pentatonic & Blues (5-6 note)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major Pentatonic", pattern: "W-W-m3-W-m3", note: "Remove the 4th and 7th from major. Can't really go wrong with this one." },
                    { name: "Minor Pentatonic", pattern: "m3-W-W-m3-W", note: "The first scale most guitarists learn. Rock and blues backbone." },
                    { name: "Blues Scale", pattern: "m3-W-H-H-m3-W", note: "Minor pentatonic + the blue note (b5). Instant attitude." },
                  ].map((scale, index) => (
                    <div
                      key={index}
                      className="p-2.5 app-bg rounded"
                      data-testid={`scale-${scale.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-medium app-text-primary text-sm">{scale.name}</span>
                        <span className="app-text-secondary text-xs font-mono">{scale.pattern}</span>
                      </div>
                      <span className="app-text-secondary text-xs">{scale.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chords */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-accent)]">
              Chords
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              Stack thirds on top of a root note and you get a chord. The quality of those thirds
              (major or minor) determines everything about the chord's character.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Triads */}
              <div>
                <h4 className="font-medium mb-2 app-text-secondary text-xs uppercase tracking-wide">Triads (3 notes)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major", formula: "R - M3 - P5", note: "Happy, stable, resolved" },
                    { name: "Minor", formula: "R - m3 - P5", note: "Sad, introspective, but still stable" },
                    { name: "Diminished", formula: "R - m3 - d5", note: "Tense, unstable, wants to move somewhere" },
                    { name: "Augmented", formula: "R - M3 - A5", note: "Eerie, unresolved, dreamlike" },
                    { name: "Suspended 4th", formula: "R - P4 - P5", note: "Neither major nor minor. Hanging in the air." },
                    { name: "Suspended 2nd", formula: "R - M2 - P5", note: "Open, ambiguous. Common in pop and ambient." },
                  ].map((chord, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2.5 app-bg rounded"
                      data-testid={`triad-${chord.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div>
                        <span className="app-text-primary text-sm font-medium">{chord.name}</span>
                        <span className="app-text-secondary text-xs block">{chord.note}</span>
                      </div>
                      <span className="app-text-secondary text-xs font-mono flex-shrink-0 ml-3">{chord.formula}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--app-elevated)]" />

              {/* 7th Chords */}
              <div>
                <h4 className="font-medium mb-2 app-text-secondary text-xs uppercase tracking-wide">7th Chords (4 notes)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Major 7th (maj7)", formula: "R - M3 - P5 - M7", note: "Smooth, jazzy, sophisticated" },
                    { name: "Dominant 7th (7)", formula: "R - M3 - P5 - m7", note: "Bluesy tension that pulls toward the I chord" },
                    { name: "Minor 7th (m7)", formula: "R - m3 - P5 - m7", note: "Mellow, the backbone of jazz voicings" },
                    { name: "Half-dim (m7b5)", formula: "R - m3 - d5 - m7", note: "Darker than minor 7th. ii chord in minor keys." },
                    { name: "Diminished 7th (dim7)", formula: "R - m3 - d5 - d7", note: "Fully symmetrical — every note is a minor 3rd apart" },
                  ].map((chord, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2.5 app-bg rounded"
                      data-testid={`seventh-${chord.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div>
                        <span className="app-text-primary text-sm font-medium">{chord.name}</span>
                        <span className="app-text-secondary text-xs block">{chord.note}</span>
                      </div>
                      <span className="app-text-secondary text-xs font-mono flex-shrink-0 ml-3">{chord.formula}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing & Rhythm */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-secondary)]">
              Rhythm & Subdivision
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              How you divide the beat matters as much as which notes you play. The same melody
              feels completely different in straight 8ths vs. a swung groove.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "Quarter Notes (1x)",
                  description: "One note per beat. The pulse itself. Every metronome click = one quarter note.",
                  swingApplicable: false
                },
                {
                  name: "8th Notes / Quavers (2x)",
                  description: "Two notes per beat. The most common subdivision in pop, rock, and jazz. This is where swing lives.",
                  swingApplicable: true
                },
                {
                  name: "Triplets (3x)",
                  description: "Three evenly spaced notes per beat. Creates a rolling, waltz-like feel. Swing doesn't apply — triplets already have that lilt.",
                  swingApplicable: false
                },
                {
                  name: "16th Notes / Semiquavers (4x)",
                  description: "Four notes per beat. Faster rhythmic detail. Common in funk, R&B, and Latin grooves.",
                  swingApplicable: false
                }
              ].map((subdivision, index) => (
                <div
                  key={index}
                  className="p-3 app-bg rounded"
                  data-testid={`subdivision-${subdivision.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <div className="font-medium mb-1 app-text-primary text-sm flex items-center justify-between">
                    {subdivision.name}
                    {subdivision.swingApplicable && (
                      <span className="text-xs text-[var(--app-accent)] font-bold px-2 py-0.5 rounded app-elevated">
                        Swing
                      </span>
                    )}
                  </div>
                  <div className="app-text-secondary text-xs">{subdivision.description}</div>
                </div>
              ))}

              <div className="mt-3 p-3 app-elevated rounded border-l-3 border-[var(--app-secondary)]">
                <div className="font-medium mb-1 text-[var(--app-secondary)] text-sm">What is swing?</div>
                <div className="app-text-secondary text-xs leading-relaxed">
                  Straight 8ths divide the beat exactly in half: 50/50. Swing pushes the second 8th note
                  later, closer to a triplet feel — roughly 67/33. It's the difference between a march and
                  a jazz walk. In this tool, swing only applies to the 8th note (2x) subdivision.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progressions & Theory Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chord Progressions */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-primary)]">
              Chord Progressions
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              A progression is a sequence of chords that creates harmonic movement. Most
              Western music uses surprisingly few patterns — learn these and you'll recognise
              them everywhere.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "I - IV - V - I (Major)",
                  description: "The most fundamental progression in Western music. Home, away, tension, home. Thousands of folk, rock, and pop songs use this.",
                },
                {
                  name: "i - iv - V7 - i (Harmonic Minor)",
                  description: "The V7 creates a strong pull back to the minor tonic. Classical and flamenco territory. The raised 7th in the V chord is what makes it 'harmonic' minor.",
                },
                {
                  name: "i - bVII - bVI - V7 (Andalusian Cadence)",
                  description: "Descending through the flattened degrees. Iconic in flamenco, but you'll also hear it in metal, film scores, and surf rock. Hauntingly inevitable.",
                },
                {
                  name: "i - IV - bVII - i (Dorian)",
                  description: "The IV chord is major despite being in a minor key — that's the Dorian sound. Miles Davis built So What on this. Also common in funk and soul.",
                },
                {
                  name: "I - V - vi - IV (Pop)",
                  description: "The four-chord engine behind a staggering number of hits from the last 40 years. Let It Be, No Woman No Cry, Someone Like You, and hundreds more.",
                },
                {
                  name: "ii7 - V7 - Imaj7 (Jazz ii-V-I)",
                  description: "The most important progression in jazz. Every jazz standard uses it, often in multiple keys within the same tune. Learn to hear this and you unlock jazz harmony.",
                },
              ].map((prog, index) => (
                <div
                  key={index}
                  className="p-3 app-bg rounded"
                >
                  <div className="font-medium app-text-primary text-sm font-mono mb-1">{prog.name}</div>
                  <div className="app-text-secondary text-xs leading-relaxed">{prog.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Circle of Fifths & Patterns */}
        <Card className="app-surface border-[var(--app-elevated)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--app-accent)]">
              Circle of Fifths & Patterns
            </CardTitle>
            <p className="text-xs app-text-secondary mt-1">
              The circle of fifths is the map of how all 12 keys relate to each other. Moving
              clockwise = up a 5th. Moving counter-clockwise = up a 4th. Adjacent keys share
              the most notes in common.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "Clockwise (5ths): C → G → D → A → ...",
                  description: "Each step adds one sharp. This is how key signatures work — G major has 1 sharp, D major has 2, and so on around the circle.",
                },
                {
                  name: "Counter-clockwise (4ths): C → F → Bb → Eb → ...",
                  description: "Each step adds one flat. F major has 1 flat, Bb has 2, Eb has 3. Brass instruments tend to live on this side of the circle.",
                },
                {
                  name: "Triangles (Major 3rds)",
                  description: "Three notes equally spaced by major 3rds divide the octave into 3. Starting on C: C - E - Ab. These are the augmented triad — symmetric and rootless-sounding.",
                },
                {
                  name: "Squares (Minor 3rds)",
                  description: "Four notes equally spaced by minor 3rds divide the octave into 4. Starting on C: C - Eb - Gb - A. This is the diminished 7th chord — every inversion sounds the same.",
                },
                {
                  name: "Whole Tone",
                  description: "Six notes equally spaced by whole steps. Only two whole-tone scales exist. Debussy loved these — they sound floaty and directionless because there's no leading tone.",
                },
                {
                  name: "Chromatic",
                  description: "All 12 notes, each a half step apart. Not a scale you'd write a melody in, but essential for practice, ear training, and understanding the piano keyboard.",
                },
                {
                  name: "Diminished (H-W)",
                  description: "Alternating half and whole steps. An 8-note symmetrical scale. Only 3 unique diminished scales exist. Jazz players use it over dominant chords for outside sounds.",
                },
              ].map((pattern, index) => (
                <div
                  key={index}
                  className="p-3 app-bg rounded"
                >
                  <div className="font-medium app-text-primary text-sm mb-1">{pattern.name}</div>
                  <div className="app-text-secondary text-xs leading-relaxed">{pattern.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theory Concepts */}
      <Card className="app-surface border-[var(--app-elevated)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--app-primary)]">
            Key Concepts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Roman Numeral Analysis */}
            <div>
              <h4 className="font-semibold mb-2 app-text-primary text-sm">Roman Numeral Analysis</h4>
              <div className="space-y-1.5 text-xs app-text-secondary leading-relaxed">
                <p>Roman numerals describe chords by their position in the key, not their letter name.
                This lets you talk about chord function regardless of what key you're in.</p>
                <div className="mt-2 space-y-1 font-mono">
                  <p><span className="app-text-primary">Uppercase</span> = Major (I, IV, V)</p>
                  <p><span className="app-text-primary">Lowercase</span> = Minor (ii, iii, vi)</p>
                  <p><span className="app-text-primary">°</span> = Diminished (vii°)</p>
                  <p><span className="app-text-primary">+</span> = Augmented (III+)</p>
                  <p><span className="app-text-primary">7</span> = Added 7th (V7, ii7)</p>
                  <p><span className="app-text-primary">b</span> = Lowered degree (bVII, bVI)</p>
                </div>
              </div>
            </div>

            {/* Enharmonic Spelling */}
            <div>
              <h4 className="font-semibold mb-2 app-text-primary text-sm">Enharmonic Spelling</h4>
              <div className="space-y-1.5 text-xs app-text-secondary leading-relaxed">
                <p>F# and Gb are the same pitch, but which name you use depends on context.
                Correct spelling keeps the music readable — each letter name should appear
                once per scale.</p>
                <div className="mt-2 space-y-1">
                  <p><span className="app-text-primary font-medium">Sharp keys</span> (G, D, A, E, B, F#): use sharps</p>
                  <p><span className="app-text-primary font-medium">Flat keys</span> (F, Bb, Eb, Ab, Db, Gb): use flats</p>
                  <p><span className="app-text-primary font-medium">Rare spellings</span>: Cb = B, E# = F, Fb = E, B# = C</p>
                </div>
                <p className="mt-1.5">These rare spellings exist to maintain diatonic logic. In Gb major,
                you write Cb instead of B because every letter A-G must appear exactly once.</p>
              </div>
            </div>

            {/* Voice Leading */}
            <div>
              <h4 className="font-semibold mb-2 app-text-primary text-sm">Voice Leading</h4>
              <div className="space-y-1.5 text-xs app-text-secondary leading-relaxed">
                <p>How individual notes move from one chord to the next. Good voice leading means
                each note moves the shortest distance possible. When you hear a progression
                that sounds "smooth," that's voice leading at work.</p>
                <p>The strongest resolutions: the 7th of a V7 chord resolves down by half step
                to the 3rd of the I chord. The 3rd of the V resolves up by half step to the root of I.
                This is why V7 → I sounds so final.</p>
              </div>
            </div>

            {/* Relative Major/Minor */}
            <div>
              <h4 className="font-semibold mb-2 app-text-primary text-sm">Relative Major & Minor</h4>
              <div className="space-y-1.5 text-xs app-text-secondary leading-relaxed">
                <p>Every major key has a relative minor that shares the exact same notes — just
                starting from a different place. C major and A minor use the same 7 notes.
                D major and B minor. And so on.</p>
                <p>To find the relative minor: go down 3 semitones (a minor 3rd) from the major root.
                To find the relative major: go up 3 semitones from the minor root.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
