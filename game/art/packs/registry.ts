import type { GameDefinition } from '../../content/types';
import { primitivePack, trainingReskin } from './primitive';
import type { AssetPackDefinition } from './types';
import { assetIndex, validatePack, validatePackCompatibility } from './validation';

export const pixelSurvivorPack: AssetPackDefinition = {
    id: 'pixel-survivor', version: 1, name: 'Pixel Survivor', developmentOnly: false,
    compatible: ['pixel-survivor', 'training-grove'], renderer: 'pixel-survivor',
};

export const assetPacks = [pixelSurvivorPack, primitivePack, trainingReskin] as const;
const catalog = assetIndex<AssetPackDefinition>(assetPacks, 'pack');
for (const pack of assetPacks) validatePack(pack);

export function selectAssetPack(content: GameDefinition, selected = pixelSurvivorPack.id, allowDevelopment = false) {
    const pack = catalog.get(selected);
    if (!pack || pack.developmentOnly && !allowDevelopment) throw new Error(`Asset pack ${selected} is unavailable.`);
    validatePackCompatibility(pack, content);
    return pack;
}

export function packTextureKey(pack: AssetPackDefinition, texture: string) {
    return `pack:${pack.id}:v${pack.version}:${texture}`;
}
