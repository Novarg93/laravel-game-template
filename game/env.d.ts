import type { World } from '@game/systems/World';
import type { Metrics } from '@game/events/bridge';
import type { GameArt } from '@game/art/GameArt';
import type { CharacterId } from '@game/config/characters';
declare global {
  interface Window { __PIXEL__?: { world: World; finalScenario: (action: import('@game/bootstrap/finalBossScenario').FinalScenario) => void; setVisualTime: (seconds?: number) => void; setTestCharacter: (character: CharacterId) => void; listeners: () => { commands: number; snapshots: number; metrics: number }; metrics: () => Metrics; pack: () => { id: string; manifest?: ReturnType<import('@game/art/packs/ManifestArt').ManifestArt['diagnostics']>; textures: string[]; actors: { id: number; texture: string; frame: string; width: number; height: number }[] }; restartScene: () => void; art: () => ReturnType<GameArt['diagnostics']>; atmosphere: () => ReturnType<import('@game/art/ForestAtmosphere').ForestAtmosphere['diagnostics']>; audio: () => ReturnType<import('@game/audio/AudioController').AudioController['diagnostics']> } }
}
