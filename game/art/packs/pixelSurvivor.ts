import type Phaser from 'phaser';
import { gameAssetUrl } from '../../assets';
import { preloadWarriorUltimates } from '../warriorUltimatesPack';
import { WAR_BANNER_TEXTURE, WAR_BANNER_URL } from '../WarBannerArt';
import { RUNE_ACCEPTED_TEXTURE, RUNE_ACCEPTED_URLS } from '../runeWardenAccepted';
import { preloadFrostUltimate } from '../frostUltimatePack';
import { WARRIOR_HERO, warriorHeroTexture, warriorHeroUrls } from '../warriorHeroPack';
import { WARRIOR_SKILLS, warriorSkillsTexture, warriorSkillsUrls } from '../warriorSkillsPack';
import { preloadFireUltimate } from '../fireUltimatePack';
import { WARDEN_AI_PAGES } from '../ashWardenPixellabPack';
import { LIGHTNING_ULTIMATE_TEXTURE, LIGHTNING_ULTIMATE_URLS } from '../lightningUltimatePack';
import { REGULAR_LIGHTNING_TEXTURE, REGULAR_LIGHTNING_URLS } from '../regularLightningPack';
import { FIREBALL_TEXTURE, FIREBALL_URLS } from '../fireballPack';
import { ASTRAL_REVENANT_TEXTURE, ASTRAL_REVENANT_URLS } from '../astralRevenantPack';
import { ASTRAL_PROJECTILE_TEXTURE, ASTRAL_PROJECTILE_URLS } from '../astralProjectilePixellabPack';
import { ASTRAL_FLAME_TEXTURE, ASTRAL_FLAME_URLS } from '../astralFlamePixellabPack';
import { MAGE_METEOR_TEXTURE, MAGE_METEOR_URLS } from '../mageMeteorPack';
import { RUNE_WARDEN_TEXTURE, RUNE_WARDEN_URLS } from '../runeWardenPack';
import { RUNE_VFX_TEXTURE, RUNE_VFX_URLS } from '../runeWardenVfxPack';
import { BRIAR_BEAST_TEXTURE, BRIAR_BEAST_URLS } from '../briarBeastPack';
import { MAGE_ABILITY_TEXTURE, MAGE_ABILITY_URLS } from '../mageAbilityPack';
import { MAGE_SHIELD_NOVA_TEXTURE, MAGE_SHIELD_NOVA_URLS } from '../mageShieldNovaPack';
import { WARDEN, wardenTexture } from '../ashWardenPack';
import { FLAME_STRIKE_TEXTURE, FLAME_STRIKE_URLS } from '../flameStrikePack';
import { MELEE_COMBO_TEXTURE, MELEE_COMBO_URLS } from '../meleeComboPack';
import { HD_CORE_TEXTURE, HD_CORE_URLS } from '../hdCoreLayout';
import { RUNNER_TEXTURE, RUNNER_URLS } from '../runnerPack';
import { MAGE_HERO, mageHeroTexture, mageHeroUrls } from '../mageHeroPack';
import { MAGE_IDLE_TEXTURE, MAGE_IDLE_URLS } from '../mageIdlePack';
import { MAGE_RUN_V2_TEXTURE, MAGE_RUN_V2_URLS } from '../mageRunPackV2';
import { MAGE_CAST_V2_TEXTURE, MAGE_CAST_V2_URLS } from '../mageCastPackV2';
import { MAGE_MOVING_CAST_V2_TEXTURE, MAGE_MOVING_CAST_V2_URLS } from '../mageMovingCastV2';
import { MAGE_PHANTOM_TEXTURE, MAGE_PHANTOM_URLS } from '../magePhantomPack';
import { MAGE_BLINK_TEXTURE, MAGE_BLINK_URLS } from '../mageBlinkPack';
import { ENEMY_TEXTURE, ENEMY_URLS } from '../enemyPack';
import { GUARDIAN_TEXTURE, GUARDIAN_URLS } from '../guardianPack';
import { BOSS_TEXTURE, BOSS_URLS } from '../bossPack';
import { LOOT_TEXTURE, LOOT_URLS } from '../lootPack';

// Preserve the established atlas keys, pages and preload order.
export function preloadGameArt(scene: Phaser.Scene) {
  preloadWarriorUltimates(scene);
  preloadFireUltimate(scene);
  preloadFrostUltimate(scene);
  if(!scene.textures.exists(RUNE_ACCEPTED_TEXTURE))scene.load.atlas(RUNE_ACCEPTED_TEXTURE,gameAssetUrl(RUNE_ACCEPTED_URLS.image),gameAssetUrl(RUNE_ACCEPTED_URLS.data));
  for(const p of WARDEN_AI_PAGES)if(!scene.textures.exists(p.key))scene.load.atlas(p.key,gameAssetUrl(p.image),gameAssetUrl(p.data));
  if(!scene.textures.exists(ASTRAL_FLAME_TEXTURE))scene.load.atlas(ASTRAL_FLAME_TEXTURE,gameAssetUrl(ASTRAL_FLAME_URLS.image),gameAssetUrl(ASTRAL_FLAME_URLS.data));
  if(!scene.textures.exists(ASTRAL_PROJECTILE_TEXTURE))scene.load.atlas(ASTRAL_PROJECTILE_TEXTURE,gameAssetUrl(ASTRAL_PROJECTILE_URLS.image),gameAssetUrl(ASTRAL_PROJECTILE_URLS.data));
  if(!scene.textures.exists(RUNE_VFX_TEXTURE))scene.load.atlas(RUNE_VFX_TEXTURE,gameAssetUrl(RUNE_VFX_URLS.image),gameAssetUrl(RUNE_VFX_URLS.data));
  if(!scene.textures.exists(MAGE_SHIELD_NOVA_TEXTURE))scene.load.atlas(MAGE_SHIELD_NOVA_TEXTURE,gameAssetUrl(MAGE_SHIELD_NOVA_URLS.image),gameAssetUrl(MAGE_SHIELD_NOVA_URLS.data));
  if(!scene.textures.exists(MAGE_BLINK_TEXTURE))scene.load.atlas(MAGE_BLINK_TEXTURE,gameAssetUrl(MAGE_BLINK_URLS.image),gameAssetUrl(MAGE_BLINK_URLS.data));
  if(!scene.textures.exists(MAGE_MOVING_CAST_V2_TEXTURE))scene.load.atlas(MAGE_MOVING_CAST_V2_TEXTURE,gameAssetUrl(MAGE_MOVING_CAST_V2_URLS.image),gameAssetUrl(MAGE_MOVING_CAST_V2_URLS.data));
  if(!scene.textures.exists(MAGE_CAST_V2_TEXTURE))scene.load.atlas(MAGE_CAST_V2_TEXTURE,gameAssetUrl(MAGE_CAST_V2_URLS.image),gameAssetUrl(MAGE_CAST_V2_URLS.data));
  if(!scene.textures.exists(MAGE_RUN_V2_TEXTURE))scene.load.atlas(MAGE_RUN_V2_TEXTURE,gameAssetUrl(MAGE_RUN_V2_URLS.image),gameAssetUrl(MAGE_RUN_V2_URLS.data));
  if(!scene.textures.exists(MAGE_IDLE_TEXTURE))scene.load.atlas(MAGE_IDLE_TEXTURE,gameAssetUrl(MAGE_IDLE_URLS.image),gameAssetUrl(MAGE_IDLE_URLS.data));
  if(!scene.textures.exists(MAGE_PHANTOM_TEXTURE))scene.load.atlas(MAGE_PHANTOM_TEXTURE,gameAssetUrl(MAGE_PHANTOM_URLS.image),gameAssetUrl(MAGE_PHANTOM_URLS.data));
  if(!scene.textures.exists(LIGHTNING_ULTIMATE_TEXTURE))scene.load.atlas(LIGHTNING_ULTIMATE_TEXTURE,gameAssetUrl(LIGHTNING_ULTIMATE_URLS.image),gameAssetUrl(LIGHTNING_ULTIMATE_URLS.data));
  if(!scene.textures.exists(REGULAR_LIGHTNING_TEXTURE))scene.load.atlas(REGULAR_LIGHTNING_TEXTURE,gameAssetUrl(REGULAR_LIGHTNING_URLS.image),gameAssetUrl(REGULAR_LIGHTNING_URLS.data));
  if(!scene.textures.exists(FIREBALL_TEXTURE))scene.load.atlas(FIREBALL_TEXTURE,gameAssetUrl(FIREBALL_URLS.image),gameAssetUrl(FIREBALL_URLS.data));
  if(!scene.textures.exists(ASTRAL_REVENANT_TEXTURE))scene.load.atlas(ASTRAL_REVENANT_TEXTURE,gameAssetUrl(ASTRAL_REVENANT_URLS.image),gameAssetUrl(ASTRAL_REVENANT_URLS.data));
  if(!scene.textures.exists(BRIAR_BEAST_TEXTURE))scene.load.atlas(BRIAR_BEAST_TEXTURE,gameAssetUrl(BRIAR_BEAST_URLS.image),gameAssetUrl(BRIAR_BEAST_URLS.data));
  if(!scene.textures.exists(RUNE_WARDEN_TEXTURE))scene.load.atlas(RUNE_WARDEN_TEXTURE,gameAssetUrl(RUNE_WARDEN_URLS.image),gameAssetUrl(RUNE_WARDEN_URLS.data));
  if(!scene.textures.exists(MAGE_METEOR_TEXTURE))scene.load.atlas(MAGE_METEOR_TEXTURE,gameAssetUrl(MAGE_METEOR_URLS.image),gameAssetUrl(MAGE_METEOR_URLS.data));
  if(!scene.textures.exists(MAGE_ABILITY_TEXTURE))scene.load.atlas(MAGE_ABILITY_TEXTURE,gameAssetUrl(MAGE_ABILITY_URLS.image),gameAssetUrl(MAGE_ABILITY_URLS.data));
  if(!scene.textures.exists(MELEE_COMBO_TEXTURE))scene.load.atlas(MELEE_COMBO_TEXTURE,gameAssetUrl(MELEE_COMBO_URLS.image),gameAssetUrl(MELEE_COMBO_URLS.data));
  if(!scene.textures.exists(FLAME_STRIKE_TEXTURE))scene.load.atlas(FLAME_STRIKE_TEXTURE,gameAssetUrl(FLAME_STRIKE_URLS.image),gameAssetUrl(FLAME_STRIKE_URLS.data));
  for(let i=0;i<WARDEN.pages;i++)if(!scene.textures.exists(wardenTexture(i)))scene.load.atlas(wardenTexture(i),gameAssetUrl(`assets/hd/ash-warden-v1/${i}.png`),gameAssetUrl(`assets/hd/ash-warden-v1/${i}.json`));
  if (!scene.textures.exists(HD_CORE_TEXTURE)) scene.load.atlas(HD_CORE_TEXTURE, gameAssetUrl(HD_CORE_URLS.image), gameAssetUrl(HD_CORE_URLS.data));
  if (!scene.textures.exists(RUNNER_TEXTURE)) scene.load.atlas(RUNNER_TEXTURE, gameAssetUrl(RUNNER_URLS.image), gameAssetUrl(RUNNER_URLS.data));
  if(!MAGE_HERO.complete)throw new Error('Mage hero atlas is incomplete; finish the strict asset build.');
  for(const page of MAGE_HERO.pages){const urls=mageHeroUrls(page.index),key=mageHeroTexture(page.index);if(!scene.textures.exists(key))scene.load.atlas(key,gameAssetUrl(urls.image),gameAssetUrl(urls.data));}
  for(const page of WARRIOR_HERO.pages){const urls=warriorHeroUrls(page.index),key=warriorHeroTexture(page.index);if(!scene.textures.exists(key))scene.load.atlas(key,gameAssetUrl(urls.image),gameAssetUrl(urls.data));}
  for(const page of WARRIOR_SKILLS.pages){const urls=warriorSkillsUrls(page.index),key=warriorSkillsTexture(page.index);if(!scene.textures.exists(key))scene.load.atlas(key,gameAssetUrl(urls.image),gameAssetUrl(urls.data));}
  if(!scene.textures.exists(WAR_BANNER_TEXTURE))scene.load.image(WAR_BANNER_TEXTURE,gameAssetUrl(WAR_BANNER_URL));
  if (!scene.textures.exists(ENEMY_TEXTURE)) scene.load.atlas(ENEMY_TEXTURE, gameAssetUrl(ENEMY_URLS.image), gameAssetUrl(ENEMY_URLS.data));
  if (!scene.textures.exists(GUARDIAN_TEXTURE)) scene.load.atlas(GUARDIAN_TEXTURE, gameAssetUrl(GUARDIAN_URLS.image), gameAssetUrl(GUARDIAN_URLS.data));
  if (!scene.textures.exists(BOSS_TEXTURE)) scene.load.atlas(BOSS_TEXTURE, gameAssetUrl(BOSS_URLS.image), gameAssetUrl(BOSS_URLS.data));
  if (!scene.textures.exists(LOOT_TEXTURE)) scene.load.atlas(LOOT_TEXTURE, gameAssetUrl(LOOT_URLS.image), gameAssetUrl(LOOT_URLS.data));
}
