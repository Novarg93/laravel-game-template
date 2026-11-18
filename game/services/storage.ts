import { gameDefinition } from '../content/registry';
import type { GameDefinition } from '../content/types';
import type { EnemyKind } from '../config/enemyDefinitions';
import type { Snapshot } from '../systems/World';
import type { CharacterId } from '../config/characters';
import type { BiomeId } from '../config/biomes';
export interface Settings { volume: number; muted: boolean; musicVolume?: number; sfxVolume?: number; pixelScale: number; effectsIntensity?: number; damageNumbers?: boolean; reducedMotion?: boolean; reducedFlash?: boolean }
export const DEFAULT_SETTINGS: Settings = { volume: 0.3, muted: false, musicVolume: .32, sfxVolume: .8, pixelScale: 2 };
export const STORAGE_KEY = 'pixel-survivor-v1';
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function browserStorage(): StoragePort | undefined { try { return typeof localStorage !== 'undefined' ? localStorage : undefined; } catch { return undefined; } }
export function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Settings>; const gain = (n: unknown) => n === undefined || typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
  return typeof s.volume === 'number' && Number.isFinite(s.volume) && s.volume >= 0 && s.volume <= 1 && typeof s.muted === 'boolean' && gain(s.musicVolume) && gain(s.sfxVolume) && (s.pixelScale === 2 || s.pixelScale === 3) && gain(s.effectsIntensity) && (s.damageNumbers === undefined || typeof s.damageNumbers === 'boolean') && (s.reducedMotion === undefined || typeof s.reducedMotion === 'boolean') && (s.reducedFlash === undefined || typeof s.reducedFlash === 'boolean');
}
export interface RunDetails { character: CharacterId; biome: BiomeId; regularKills: number; eliteKills: number; bossKills: number; damage: {id:string;damage:number}[] }
export interface RunRecord { eliteByKind?: Record<EnemyKind, number>; completionKind?: 'legacy-survival'|'survival'|'final-boss'|'defeat'; finalEncounter?: {reached:boolean;duration:number;killed:boolean}; outcome?: 'victory'|'defeat'; id: string; score: number; kills: number; elapsed: number; level: number; finishedAt: string; abilities: string[]; byKind: Record<EnemyKind, number>; details?: RunDetails }
export interface Profile { version: 2; settings: Settings; records: RunRecord[]; lastPlayed: { id: string; at: string } | null; statistics: { runs: number; kills: number; seconds: number } }
function defaults(): Profile { return { version: 2, settings: { ...DEFAULT_SETTINGS }, records: [], lastPlayed: null, statistics: { runs: 0, kills: 0, seconds: 0 } }; }
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function count(value: unknown, min = 0): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= 1e12; }
function seconds(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e12; }
function date(value: unknown): value is string { return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)); }
function validDetails(value: unknown, content: GameDefinition): value is RunDetails {
  if (!object(value)) return false;
  const hero = content.heroes.find(hero => hero.id === value.character);
  const map = content.maps.some(map => map.id === value.biome) || content.id === 'pixel-survivor' && value.biome === 'dark-forest';
  return !!hero && map && count(value.regularKills) && count(value.eliteKills) && count(value.bossKills)
    && Array.isArray(value.damage) && value.damage.length <= 5
    && value.damage.every(row => object(row) && typeof row.id === 'string' && hero.skills.includes(row.id) && seconds(row.damage));
}
export function validRecord(value: unknown, content = gameDefinition()): value is RunRecord {
  const counts = (candidate: unknown) => object(candidate) && content.enemies.every(enemy => count(candidate[enemy.id]));
  if (!object(value)) return false;
  if (value.eliteByKind !== undefined && !counts(value.eliteByKind)) return false;
  if (value.completionKind !== undefined && !['legacy-survival', 'survival', 'final-boss', 'defeat'].includes(String(value.completionKind))) return false;
  const final = value.finalEncounter;
  if (final !== undefined && (!object(final) || typeof final.reached !== 'boolean' || typeof final.killed !== 'boolean' || !seconds(final.duration))) return false;
  return (value.outcome === undefined || value.outcome === 'victory' || value.outcome === 'defeat') && (value.details === undefined || validDetails(value.details, content))
    && typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 100 && count(value.score) && count(value.kills) && seconds(value.elapsed)
    && count(value.level, 1) && date(value.finishedAt) && Array.isArray(value.abilities) && value.abilities.length <= 5
    && new Set(value.abilities).size === value.abilities.length && value.abilities.every(id => content.skills.some(skill => skill.id === id)) && counts(value.byKind);
}
function storageKey(content: GameDefinition) { return content.version === 'pixel-survivor-v1' ? STORAGE_KEY : 'runs:' + content.version; }
export function sortedRecords(records: RunRecord[]) { return [...records].sort((a, b) => b.score - a.score || b.elapsed - a.elapsed || b.finishedAt.localeCompare(a.finishedAt)).slice(0, 10); }
export function loadProfile(storage = browserStorage(), content = gameDefinition()): Profile {
  const fallback = defaults();
  try {
    const data: unknown = JSON.parse(storage?.getItem(storageKey(content)) ?? 'null');
    if (!object(data) || (data.version !== 1 && data.version !== 2)) return fallback;
    if (validSettings(data.settings)) fallback.settings = { ...data.settings };
    if (Array.isArray(data.records)) { const ids = new Set<string>(); fallback.records = sortedRecords(data.records.slice(0, 100).map(r => object(r) && object(r.byKind) ? { completionKind: r.outcome==='victory'?'legacy-survival':'defeat', ...r, byKind: { ashGuard: 0, guardian: 0, rusher: 0, splitter: 0, eclipse: 0, ...r.byKind } } : r).filter((record): record is RunRecord => validRecord(record, content)).filter(r => { if (ids.has(r.id)) return false; ids.add(r.id); return true; })); }
    if (object(data.lastPlayed) && typeof data.lastPlayed.id === 'string' && data.lastPlayed.id.length <= 100 && date(data.lastPlayed.at)) fallback.lastPlayed = { id: data.lastPlayed.id, at: data.lastPlayed.at };
    if (object(data.statistics) && count(data.statistics.runs) && count(data.statistics.kills) && seconds(data.statistics.seconds)) fallback.statistics = { runs: data.statistics.runs, kills: data.statistics.kills, seconds: data.statistics.seconds };
  } catch { /* Corruption, disabled storage, unknown schema: playable defaults. */ }
  return fallback;
}
export function saveProfile(profile: Profile, storage = browserStorage(), content = gameDefinition()) { try { if (!storage) return false; storage.setItem(storageKey(content), JSON.stringify(profile)); return true; } catch { return false; } }
export function loadSettings(storage = browserStorage()): Settings { return loadProfile(storage).settings; }
export function saveSettings(settings: Settings, storage = browserStorage()) { const data = loadProfile(storage); data.settings = { ...settings }; return saveProfile(data, storage); }
export function withRun(profile: Profile, record: RunRecord, content = gameDefinition()): Profile {
  if (!validRecord(record, content) || profile.lastPlayed?.id === record.id || profile.records.some(r => r.id === record.id)) return profile;
  return { ...profile, records: sortedRecords([...profile.records, record]), lastPlayed: { id: record.id, at: record.finishedAt }, statistics: { runs: profile.statistics.runs + 1, kills: profile.statistics.kills + record.kills, seconds: profile.statistics.seconds + record.elapsed } };
}
export function runRecord(state: Snapshot): RunRecord { return { outcome:state.outcome??'defeat', completionKind:state.outcome==='victory'?(state.objective?.kind === 'duration' ? 'survival' : 'final-boss'):'defeat', finalEncounter:{reached:state.finalEncounter.phase!=='inactive',duration:state.finalEncounter.duration,killed:state.outcome==='victory'&&(state.finalEncounter.phase==='dying'||state.finalEncounter.phase==='defeated')}, ...(state.eliteKillsByKind?{eliteByKind:{...state.eliteKillsByKind}}:{}), id: state.runId, score: state.score, kills: state.kills, elapsed: state.elapsed, level: state.level, finishedAt: new Date().toISOString(), abilities: state.abilities.filter(a => a.level > 0).map(a => a.id), byKind: { ...state.killsByKind }, details:{character:state.character,biome:state.biome,regularKills:state.regularKills,eliteKills:state.eliteKills,bossKills:state.bossKills,damage:state.damageByAbility.map(a=>({id:a.id,damage:a.damage}))} }; }
