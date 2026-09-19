import { SoundType } from '../types/metronome';

export interface ScheduledBeatEvent {
  time: number;
  type: 'pulse' | 'rhythm';
  beatNumber: number;
  totalBeats: number;
  isAccented: boolean;
  isRest: boolean;
  noteId?: string;
  measureIndex: number;
  duration?: number;
  isTied?: boolean;
}

export type EventCallback = (event: ScheduledBeatEvent) => void;

export interface AudioNoteEvent {
  noteId: string;
  duration: number; // in beats
  isRest: boolean;
  isAccented: boolean;
  isTiedFromPrev?: boolean;
  isTiedToNext?: boolean;
  measureIndex: number;
  beatPosition: number;
  soundOverride?: SoundType;
}

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGainNode: GainNode | null = null;
  private pulseGainNode: GainNode | null = null;
  private rhythmGainNode: GainNode | null = null;

  // Lookahead timing settings
  private lookaheadMs: number = 20; // How frequently to call scheduler (ms)
  private scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (sec)
  private timerId: number | null = null;

  // Playback state
  private bpm: number = 80;
  private nextPulseTime: number = 0;
  private currentPulseBeat: number = 0;
  private timeSignatureNumerator: number = 4;
  private timeSignatureDenominator: number = 4;

  // Rhythm track scheduling state
  private rhythmNoteIndex: number = 0;
  private nextRhythmNoteTime: number = 0;
  private flatRhythmSequence: AudioNoteEvent[] = [];

  // Track configurations
  private pulseEnabled: boolean = true;
  private pulseMuted: boolean = false;
  private pulseSolo: boolean = false;
  private pulseSound: SoundType = 'woodblock';
  private pulseAccentDownbeat: boolean = true;
  private pulseSubdivision: number = 1;
  private pulseVolume: number = 0.85;

  private rhythmEnabled: boolean = true;
  private rhythmMuted: boolean = false;
  private rhythmSolo: boolean = false;
  private rhythmSound: SoundType = 'rimshot';
  private rhythmVolume: number = 1.0;
  private masterVolume: number = 0.95;

  // Subscribed listeners
  private listeners: Set<EventCallback> = new Set();

  constructor() {}

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = this.masterVolume;
      this.masterGainNode.connect(this.audioCtx.destination);

      this.pulseGainNode = this.audioCtx.createGain();
      this.pulseGainNode.gain.value = this.pulseVolume;
      this.pulseGainNode.connect(this.masterGainNode);

      this.rhythmGainNode = this.audioCtx.createGain();
      this.rhythmGainNode.gain.value = this.rhythmVolume;
      this.rhythmGainNode.connect(this.masterGainNode);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public subscribe(cb: EventCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(event: ScheduledBeatEvent) {
    if (!this.audioCtx) return;
    const delay = Math.max(0, (event.time - this.audioCtx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isRunning) {
        this.listeners.forEach((listener) => listener(event));
      }
    }, delay);
  }

  public start() {
    this.initAudio();
    if (this.isRunning) return;

    this.isRunning = true;
    if (this.audioCtx) {
      const startTime = this.audioCtx.currentTime + 0.05;
      this.nextPulseTime = startTime;
      this.nextRhythmNoteTime = startTime;
      this.currentPulseBeat = 0;
      this.rhythmNoteIndex = 0;
    }

    this.timerId = window.setInterval(() => {
      this.scheduler();
    }, this.lookaheadMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(20, Math.min(320, newBpm));
  }

  public setTimeSignature(numerator: number, denominator: number) {
    this.timeSignatureNumerator = numerator;
    this.timeSignatureDenominator = denominator;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
    }
  }

  public updatePulseSettings(settings: {
    enabled: boolean;
    volume: number;
    sound: SoundType;
    accentDownbeat: boolean;
    subdivision: string;
    muted: boolean;
    solo: boolean;
  }) {
    this.pulseEnabled = settings.enabled;
    this.pulseVolume = settings.volume;
    this.pulseSound = settings.sound;
    this.pulseAccentDownbeat = settings.accentDownbeat;
    this.pulseSubdivision = parseInt(settings.subdivision, 10) || 1;
    this.pulseMuted = settings.muted;
    this.pulseSolo = settings.solo;

    if (this.pulseGainNode && this.audioCtx) {
      this.pulseGainNode.gain.setValueAtTime(this.pulseVolume, this.audioCtx.currentTime);
    }
  }

  public updateRhythmSettings(settings: {
    enabled: boolean;
    volume: number;
    sound: SoundType;
    muted: boolean;
    solo: boolean;
  }) {
    this.rhythmEnabled = settings.enabled;
    this.rhythmVolume = settings.volume;
    this.rhythmSound = settings.sound;
    this.rhythmMuted = settings.muted;
    this.rhythmSolo = settings.solo;

    if (this.rhythmGainNode && this.audioCtx) {
      this.rhythmGainNode.gain.setValueAtTime(this.rhythmVolume, this.audioCtx.currentTime);
    }
  }

  public setRhythmSequence(sequence: AudioNoteEvent[]) {
    this.flatRhythmSequence = sequence;
    if (this.rhythmNoteIndex >= this.flatRhythmSequence.length) {
      this.rhythmNoteIndex = 0;
    }
  }

  private scheduler() {
    if (!this.audioCtx || !this.isRunning) return;

    const secondsPerQuarterBeat = 60.0 / this.bpm;
    const beatMultiplier = 4.0 / this.timeSignatureDenominator;
    const secondsPerMainBeat = secondsPerQuarterBeat * beatMultiplier;

    // 1. Schedule Foundation Metronome Pulse (e.g. 4 regular beats in 4/4)
    while (this.nextPulseTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      const isDownbeat = this.currentPulseBeat === 0;
      const shouldPlayPulse =
        this.pulseEnabled &&
        !this.pulseMuted &&
        (!this.rhythmSolo || this.pulseSolo);

      if (shouldPlayPulse) {
        const isAccented = isDownbeat && this.pulseAccentDownbeat;
        this.playSynthesizedSound(
          this.pulseSound,
          this.nextPulseTime,
          isAccented ? 1.0 : 0.65,
          isAccented ? 1.3 : 1.0,
          this.pulseGainNode!
        );

        if (this.pulseSubdivision > 1) {
          const subInterval = secondsPerMainBeat / this.pulseSubdivision;
          for (let s = 1; s < this.pulseSubdivision; s++) {
            this.playSynthesizedSound(
              this.pulseSound,
              this.nextPulseTime + s * subInterval,
              0.35,
              0.8,
              this.pulseGainNode!
            );
          }
        }
      }

      this.notifyListeners({
        time: this.nextPulseTime,
        type: 'pulse',
        beatNumber: this.currentPulseBeat,
        totalBeats: this.timeSignatureNumerator,
        isAccented: isDownbeat && this.pulseAccentDownbeat,
        isRest: false,
        measureIndex: 0,
      });

      this.nextPulseTime += secondsPerMainBeat;
      this.currentPulseBeat = (this.currentPulseBeat + 1) % this.timeSignatureNumerator;
    }

    // 2. Schedule Notation Rhythm Track (Plays on top with full Dorico/Sibelius rhythmic customization)
    if (this.flatRhythmSequence.length > 0) {
      while (this.nextRhythmNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
        const item = this.flatRhythmSequence[this.rhythmNoteIndex];
        if (item) {
          const isTiedFromPrevious = !!item.isTiedFromPrev;
          const shouldPlayRhythm =
            this.rhythmEnabled &&
            !this.rhythmMuted &&
            (!this.pulseSolo || this.rhythmSolo) &&
            !item.isRest &&
            !isTiedFromPrevious; // If tied from previous note, do not re-attack!

          if (shouldPlayRhythm) {
            const sound = item.soundOverride || this.rhythmSound;
            const velocity = item.isAccented ? 1.0 : 0.78;
            const pitch = item.isAccented ? 1.25 : 1.0;

            this.playSynthesizedSound(
              sound,
              this.nextRhythmNoteTime,
              velocity,
              pitch,
              this.rhythmGainNode!
            );
          }

          this.notifyListeners({
            time: this.nextRhythmNoteTime,
            type: 'rhythm',
            beatNumber: Math.floor(item.beatPosition),
            totalBeats: this.timeSignatureNumerator,
            isAccented: item.isAccented,
            isRest: item.isRest,
            noteId: item.noteId,
            measureIndex: item.measureIndex,
            duration: item.duration,
            isTied: isTiedFromPrevious,
          });

          const noteDurationSec = item.duration * secondsPerQuarterBeat;
          this.nextRhythmNoteTime += noteDurationSec;
          this.rhythmNoteIndex = (this.rhythmNoteIndex + 1) % this.flatRhythmSequence.length;
        } else {
          this.nextRhythmNoteTime += secondsPerMainBeat;
          this.rhythmNoteIndex = 0;
        }
      }
    }
  }

  public playPreviewSound(sound: SoundType, isAccented: boolean = false) {
    this.initAudio();
    if (!this.audioCtx || !this.masterGainNode) return;
    this.playSynthesizedSound(
      sound,
      this.audioCtx.currentTime + 0.01,
      isAccented ? 1.0 : 0.75,
      isAccented ? 1.3 : 1.0,
      this.masterGainNode
    );
  }

  private playSynthesizedSound(
    sound: SoundType,
    time: number,
    velocity: number,
    pitchMultiplier: number,
    targetGain: GainNode
  ) {
    if (!this.audioCtx) return;

    try {
      switch (sound) {
        case 'woodblock':
          this.synthWoodblock(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'digital':
          this.synthDigital(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'mechanical':
          this.synthMechanical(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'rimshot':
          this.synthRimshot(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'cowbell':
          this.synthCowbell(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'marimba':
          this.synthMarimba(time, velocity, pitchMultiplier, targetGain);
          break;
        case 'hihat':
          this.synthHiHat(time, velocity, pitchMultiplier, targetGain);
          break;
        default:
          this.synthWoodblock(time, velocity, pitchMultiplier, targetGain);
      }
    } catch {}
  }

  private synthWoodblock(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    const baseFreq = 960 * pitch;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, time + 0.04);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.9, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private synthDigital(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    const freq = (pitch > 1.1 ? 2400 : 1400) * (pitch > 1.1 ? 1 : pitch);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.8, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  private synthMechanical(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(120 * pitch, time + 0.02);

    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.exponentialRampToValueAtTime(velocity * 0.6, time + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    osc.connect(oscGain);
    oscGain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private synthRimshot(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(140 * pitch, time + 0.05);

    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.exponentialRampToValueAtTime(velocity * 0.8, time + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(oscGain);
    oscGain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.065);

    const snapOsc = this.audioCtx.createOscillator();
    const snapGain = this.audioCtx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1800 * pitch, time);

    snapGain.gain.setValueAtTime(0.001, time);
    snapGain.gain.exponentialRampToValueAtTime(velocity * 0.5, time + 0.001);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);

    snapOsc.connect(snapGain);
    snapGain.connect(outGain);

    snapOsc.start(time);
    snapOsc.stop(time + 0.025);
  }

  private synthCowbell(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const bandpass = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(560 * pitch, time);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(845 * pitch, time);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800 * pitch, time);
    bandpass.Q.setValueAtTime(3.5, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.7, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(outGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.13);
    osc2.stop(time + 0.13);
  }

  private synthMarimba(time: number, velocity: number, pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const fundamental = 523.25 * (pitch > 1.1 ? 1.5 : 1.0) * pitch;
    osc.frequency.setValueAtTime(fundamental, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.85, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.19);
  }

  private synthHiHat(time: number, velocity: number, _pitch: number, outGain: GainNode) {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 0.05;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.6, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }
}

export const audioEngine = new AudioEngine();
