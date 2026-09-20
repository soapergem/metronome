# PolyRhythm Metronome & Notation Editor

A precision web-based metronome and music notation editor designed for practicing complex polyrhythms, tuplets, and custom layered beats.

Hosted at: [metronome.gemovationlabs.com](https://metronome.gemovationlabs.com)

---

## Features

### 1. Precision Web Audio Engine
- **Microsecond Lookahead Timing:** Implemented with `AudioContext.currentTime` scheduler to eliminate timing jitter and drift.
- **Procedurally Synthesized Sound Profiles:**
  - Woodblock
  - Digital Beep
  - Mechanical Click
  - Snare / Rimshot
  - Cowbell
- **Mobile Silent Mode Bypass:** Bypasses physical iOS / Android mute switches via an audio session bridge, ensuring playback is audible even when devices are set to silent.
- **Screen Wake Lock API:** Prevents mobile and tablet screens from dimming or locking during practice.

### 2. Sheet Music & Notation Measure Editor
- **Finale / Dorico / Sibelius Workflow:**
  - Rhythmic integrity preserved at all times (measures always sum to the time signature).
  - Duration-preserving replacement for notes, rests, and tuplets.
- **Dedicated Note & Rest Palettes:**
  - Whole (4), Half (2), Quarter (1), 1/8th (1/2), and 1/16th (1/4) notes and rests.
- **Modifiers & Toggles:**
  - **Triplet (`3`):** Modifies notes to tuplet values (e.g. 1/16th note -> 1/16th triplet, 6 per beat in 4/4 time).
  - **Dot (`•`):** Extends duration by 1.5x.
  - **Tie (`⌢`):** Sustains duration across notes without re-triggering attack clicks.
  - **Accents:** Per-note dynamic volume accents.
- **Select vs. Scroll Modes:**
  - **Select Mode:** Click or drag across the score to highlight ranges of notes/rests; replace with rests using `Delete`/`Backspace`.
  - **Scroll Mode:** Drag horizontally anywhere on the canvas to pan across dense scores.
- **Continuous Horizontal Score:** Naturally extends horizontally for dense tuplets and measures without squishing notation.

### 3. Compact Rhythm Notation (Text Format)
- Textual representation of measure rhythms with real-time two-way synchronization and a one-click **Copy** button.
- **Syntax Cheatsheet:**
  - `w, h, q, e, s`: Whole, half, quarter, 1/8th, 1/16th notes
  - `W, H, Q, E, S`: Equivalent rests (or `rq, re, rs`)
  - `.`: Dotted value (e.g. `q.`)
  - `>`: Accented note (e.g. `>q`)
  - `_`: Tied note (e.g. `q_`)
  - `3(...)`: Triplet grouping (e.g. `3(s s s s s s)`)
  - Example: `[4/4] >q e e 3(s s s s s s) 3(s s s s s s)`

### 4. Persistence & Usability
- **Local Storage:** Remembers your last entered measure, time signature, BPM, and sound profile automatically.
- **BPM Editor:** Direct number input with `onBlur` clamping, plus press-and-hold auto-repeating `+`/`-` stepper buttons and Tap Tempo.
- **Keyboard Shortcuts:**
  - `Spacebar`: Play / Stop
  - `↑` / `↓`: Adjust BPM (+/- 1, or +/- 5 with `Shift`)
  - `T`: Tap Tempo
  - `Delete` / `Backspace`: Replace selected note(s) with rests

---

## Project Structure

```text
.
├── Justfile                      # Development & deployment recipes
├── pyproject.toml
├── terraform/                    # AWS S3, CloudFront & Cloudflare DNS infrastructure
│   ├── versions.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── acm.tf                    # ACM SSL Certificate + DNS validation
│   ├── cdn.tf                    # S3 bucket + CloudFront distribution
│   ├── dns.tf                    # Cloudflare CNAME record
│   └── outputs.tf
└── web/                          # Frontend React Application
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    │   └── favicon.svg           # Custom vector metronome icon
    └── src/
        ├── audio/
        │   └── AudioEngine.ts    # Web Audio synthesis & lookahead scheduler
        ├── components/
        │   ├── MusicalIcons.tsx  # Cross-platform SVG music notation glyphs
        │   ├── NotationMeasureCanvas.tsx
        │   ├── NotationToolbar.tsx
        │   └── RhythmNotationBox.tsx
        ├── types/
        │   └── metronome.ts
        └── utils/
            ├── notationUtils.ts
            └── rhythmFen.ts      # Compact Rhythm Notation parser/serializer
```

---

## Getting Started

### Prerequisites
- Node.js (v18+) & npm
- [just](https://github.com/casey/just) command runner (optional, but recommended)
- Terraform (for infrastructure deployment)
- AWS CLI & Cloudflare API token (for deployment)

### Local Development

1. Install web dependencies:
   ```bash
   cd web
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

---

## Infrastructure & Deployment

The infrastructure is managed with Terraform and deployed through `just`.

### 1. Terraform Setup
Create a `.envrc` (or export the variables) with your Cloudflare API token:
```bash
cp .envrc.example .envrc
# Add your token to .envrc
direnv allow # or source .envrc
```

Initialize Terraform:
```bash
just init
```

### 2. Deploying Infrastructure
```bash
just plan
just apply
```

### 3. Deploying the Web App
Builds the production assets, syncs them to the S3 bucket with immutable cache-control for fingerprinted bundles, and invalidates CloudFront:
```bash
just deploy
```
