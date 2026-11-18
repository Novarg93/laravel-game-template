import type Phaser from 'phaser';
import { AUDIO_BUDGET, type AssetId, type AudioBus, type SoundEvent } from './catalog';
import { synthesize } from './synthesis';
import type { AudioBackend, AudioVoice } from './AudioBackend';
import { audioSampleIds, audioSampleKey, audioSampleUrl, audioSampleGain, type AudioSampleId, type SampleRange } from './samples';
import {StreamingMusic,type MusicDiagnostics} from './StreamingMusic';
import { MUSIC_TRACKS, musicTrackUrl, type MusicTrackId } from './musicTracks';
import { gameAssetUrl } from '../assets';
import type { AudioFile, PackAudio } from '../art/packs/types';

// Reuses Phaser4's context/destination and audio cache. Never creates/closes a context.
export class PhaserAudioBackend implements AudioBackend {
  private context?: AudioContext;
  private buses = new Map<AudioBus, GainNode>();
  private compressor?: DynamicsCompressorNode; private analyser?: AnalyserNode;
  private voices = new Map<AudioVoice, boolean>();
  private dead = false;
  private failed = new Set<AssetId>();
  private downloads = new AbortController();
  private sampleFailures = new Set<string>();
  private packPlays = 0;
  private samplePending = 0;
  private sampleFallbacks = 0;
  private samplePlays: Partial<Record<AudioSampleId, number>> = {};
  private musicPlayer?: StreamingMusic;
  private musicUnavailable=false;
  private failedMusic=new Set<MusicTrackId>();
  constructor(manager: Phaser.Sound.WebAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.NoAudioSoundManager, private cache: Phaser.Cache.BaseCache, private pack?: PackAudio, private namespace = '') {
    try {
      if (!('context' in manager) || !('destination' in manager)) return;
      this.context = manager.context;
      for (const bus of ['master', 'music', 'sfx', 'ui', 'ambient'] as const) this.buses.set(bus, this.context.createGain());
      const master = this.buses.get('master')!;
      for (const [bus, node] of this.buses) if (bus !== 'master') node.connect(master);
      this.compressor = this.context.createDynamicsCompressor(); this.compressor.threshold.value = -12; this.compressor.ratio.value = 8; this.compressor.knee.value = 12;
      this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 256;
      master.connect(this.compressor); this.compressor.connect(this.analyser); this.analyser.connect(manager.destination);
      void this.loadSamples();
    } catch { this.destroy(); }
  }
  get supported() { return !!this.context && !this.dead; }
  get now() { return this.context?.currentTime ?? 0; }
  get running() { return this.context?.state === 'running' && !this.dead; }
  private packSampleKey(file: string) { return 'pack-audio:' + this.namespace + ':' + file; }
  overrides(event: SoundEvent) { return !!this.pack?.events?.[event]; }
  loopSampleGain(id: AudioSampleId) {
    const sample = this.pack?.loops?.[id];
    if (sample && this.cache.has(this.packSampleKey(sample.file))) return sample.gain;
    return this.pack?.inherit === false ? 1 : audioSampleGain(id);
  }

  private async loadSamples() {
    const context = this.context!;
    const samples = new Map<string, string>();
    if (this.pack?.inherit !== false) for (const id of audioSampleIds) samples.set(audioSampleKey(id), audioSampleUrl(id));
    for (const sample of [...Object.values(this.pack?.events ?? {}), ...Object.values(this.pack?.loops ?? {})]) {
      samples.set(this.packSampleKey(sample.file), gameAssetUrl(sample.file));
    }
    await Promise.all([...samples].map(async ([key, url]) => {
      if (this.cache.has(key)) return;
      this.samplePending++;
      try {
        const response = await fetch(url, { signal: this.downloads.signal });
        if (!response.ok) throw new Error('Audio HTTP ' + response.status);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (!this.dead && !this.downloads.signal.aborted) this.cache.add(key, buffer);
      } catch { if (!this.dead) this.sampleFailures.add(url); }
      finally { this.samplePending--; }
    }));
  }

  private track(track: MusicTrackId): { url: string; gain: number } | undefined {
    const file = this.pack?.music?.[track];
    if (file) return { url: gameAssetUrl(file.file), gain: file.gain };
    if (this.pack?.inherit !== false) return { url: musicTrackUrl(track), gain: MUSIC_TRACKS[track].gain };
  }
  async unlock() { try { if (!this.supported) return false; if (this.context!.state === 'suspended') await this.context!.resume(); return this.running; } catch { return false; } }
  music(track:MusicTrackId|null){
    if(!track||!this.running){this.musicPlayer?.stop();return false;}
    if(this.musicUnavailable||!this.context||!this.track(track)){this.musicPlayer?.stop();return false;}
    if(this.failedMusic.has(track)){this.musicPlayer?.destroy();this.musicPlayer=undefined;return false;}
    if(!this.musicPlayer){try{this.musicPlayer=new StreamingMusic(this.context, this.buses.get('music')!, id => this.track(id)!);}catch{this.musicUnavailable=true;return false;}}
    const owned=this.musicPlayer.update(track);
    if(!owned){for(const failed of this.musicPlayer.diagnostics().failed)this.failedMusic.add(failed);this.musicPlayer.destroy();this.musicPlayer=undefined;}
    return owned;
  }
  bus(bus: AudioBus, value: number) {
    const param = this.buses.get(bus)?.gain; if (!param || !this.context || this.dead) return;
    param.cancelScheduledValues(this.now); param.setTargetAtTime(value, this.now, .015);
  }
  start(asset: AssetId, bus: Exclude<AudioBus, 'master'>, gain: number, rate: number, loop: boolean, ended: () => void, sample?: AudioSampleId, range?: SampleRange, event?: SoundEvent) {
    if (!this.running || !this.context || this.failed.has(asset) || (loop && [...this.voices.values()].filter(Boolean).length+(this.musicPlayer?.diagnostics().playing??0) >= AUDIO_BUDGET.loops)) return;
    if (!loop && [...this.voices.values()].filter(v => !v).length >= AUDIO_BUDGET.voices) return;
    let source: AudioBufferSourceNode | undefined, volume: GainNode | undefined, abort: (() => void) | undefined;
    try {
      const replacement: AudioFile | undefined = event ? this.pack?.events?.[event] : (sample && this.pack?.loops?.[sample]) || this.pack?.loops?.[asset];
      const packKey = replacement && this.packSampleKey(replacement.file);
      const usePack = packKey && this.cache.has(packKey);
      const generated = !usePack && this.pack?.inherit !== false && sample && this.cache.has(audioSampleKey(sample)) ? sample : undefined;
      if (replacement ? !usePack : sample && !generated) this.sampleFallbacks++;
      const key = usePack ? packKey : generated ? audioSampleKey(generated) : 'pixel-audio:v1:' + asset;
      const sampleGain = usePack && replacement ? replacement.gain : generated ? audioSampleGain(generated) : 1;
      if (!this.cache.has(key)) { const data = synthesize(asset); const buffer = this.context.createBuffer(1, data.length, AUDIO_BUDGET.sampleRate); buffer.copyToChannel(data, 0); this.cache.add(key, buffer); }
      source = this.context.createBufferSource(); source.buffer = this.cache.get(key) as AudioBuffer; source.loop = loop; source.playbackRate.value = rate;
      volume = this.context.createGain(); volume.gain.value = loop ? 0 : gain * sampleGain;
      source.connect(volume); volume.connect(this.buses.get(bus)!);
      let released = false;
      const release = () => { if (released) return; released = true; source!.onended = null; source!.disconnect(); volume!.disconnect(); this.voices.delete(voice); ended(); };
      const voice: AudioVoice = {
        gain: (value, fade = .08) => { if (released) return; const p = volume!.gain; p.cancelScheduledValues(this.now); p.setValueAtTime(p.value, this.now); p.linearRampToValueAtTime(value, this.now + fade); },
        stop: (fade = 0) => { if (released) return; try { if (fade) { voice.gain(0, fade); source!.stop(this.now + fade); } else { source!.stop(); release(); } } catch { release(); } },
      };
      abort = () => { try { source!.stop(); } catch { /* Not started. */ } release(); };
      source.onended = release; this.voices.set(voice, loop);
      if(generated&&range){
        const at=this.now,level=volume.gain.value,seconds=(range.duration??(source.buffer.duration-(range.offset??0)))/rate;
        // Tiny playback fades avoid clicks at a slice boundary; original buffers stay intact.
        volume.gain.setValueAtTime(0,at);volume.gain.linearRampToValueAtTime(level,at+Math.min(.004,seconds/2));
        volume.gain.setValueAtTime(level,at+Math.max(seconds-.004,seconds/2));volume.gain.linearRampToValueAtTime(0,at+seconds);
        source.start(at,range.offset??0,range.duration);
      }else source.start();
      if (generated) this.samplePlays[generated] = (this.samplePlays[generated] ?? 0) + 1; if (usePack) this.packPlays++; if (loop) voice.gain(gain * sampleGain, .4); return voice;
    } catch { this.failed.add(asset); if (abort) abort(); else { source?.disconnect(); volume?.disconnect(); } return; }
  }
  diagnostics() {
    const data = new Float32Array(256); this.analyser?.getFloatTimeDomainData(data);
    const decodedBytes = this.cache.getKeys().filter(k => k.startsWith('pixel-audio:') || k.startsWith('pack-audio:')).reduce((n, k) => { const b = this.cache.get(k) as AudioBuffer; return n + b.length * b.numberOfChannels * 4; }, 0);
    const music:MusicDiagnostics=this.musicPlayer?.diagnostics()??{target:null,current:null,players:0,playing:0,pending:0,crossfades:0,repeats:0,failed:[...this.failedMusic],decks:[]};
    return { nodes: this.buses.size + (this.compressor ? 1 : 0) + (this.analyser ? 1 : 0) + this.voices.size * 2+music.players*2, sources: this.voices.size+music.playing, loops: [...this.voices.values()].filter(Boolean).length+music.playing, failedAssets: this.failed.size + this.sampleFailures.size+this.failedMusic.size, samplesLoaded: audioSampleIds.filter(id => this.cache.has(audioSampleKey(id))).length, samplesPending: this.samplePending, sampleFallbacks: this.sampleFallbacks, samplePlays: { ...this.samplePlays }, packPlays: this.packPlays, decodedBytes, rms: Math.sqrt(data.reduce((n, x) => n + x * x, 0) / data.length),music };
  }
  stopAll() { this.musicPlayer?.stop();for (const voice of [...this.voices.keys()]) voice.stop(); }
  destroy() { this.dead = true; this.downloads.abort();this.musicPlayer?.destroy();this.musicPlayer=undefined; for (const voice of [...this.voices.keys()]) voice.stop(); for (const node of this.buses.values()) node.disconnect(); this.buses.clear(); this.compressor?.disconnect(); this.analyser?.disconnect(); this.compressor = undefined; this.analyser = undefined; }
}
