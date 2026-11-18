import {WarriorMovingCleaveArt} from './WarriorMovingCleaveArt';
import { WAR_BANNER_TEXTURE } from './WarBannerArt';
import { RUNE_ACCEPTED_TEXTURE, acceptedRuneCast, acceptedRuneFlight, RUNE_FLIGHT_ANGLE } from './runeWardenAccepted';
import {WarriorHeroAnimation} from './WarriorHeroAnimation';
import { WARRIOR_HERO, warriorHeroTexture } from './warriorHeroPack';
import { WARRIOR_SKILLS, warriorSkillsTexture } from './warriorSkillsPack';
import {WarriorSkillArt} from './WarriorSkillArt';
import {WARRIOR_CAST} from '../config/warriorAbilities';
import {WARDEN_AI_PAGES} from './ashWardenPixellabPack';
import { LIGHTNING_ULTIMATE_TEXTURE } from './lightningUltimatePack';
import {RegularLightningArt} from './RegularLightningArt';
import { REGULAR_LIGHTNING_TEXTURE } from './regularLightningPack';
import {AstralRevenantArt} from './AstralRevenantArt';
import {FireballArt} from './FireballArt';
import { FIREBALL_TEXTURE, fireballFlightFrame } from './fireballPack';
import { ASTRAL_REVENANT_TEXTURE, astralProjectileFrame } from './astralRevenantPack';
import { ASTRAL_PROJECTILE_TEXTURE, astralAiFrame } from './astralProjectilePixellabPack';
import { ASTRAL_FLAME_TEXTURE } from './astralFlamePixellabPack';
import { MAGE_METEOR_TEXTURE } from './mageMeteorPack';
import {MageAbilityArt} from './MageAbilityArt';
import { RuneWardenArt } from './RuneWardenArt';
import { RUNE_FLASH_TEXTURE } from './RuneJudgementFlash';
import { RUNE_WARDEN_TEXTURE } from './runeWardenPack';
import { RUNE_VFX_TEXTURE } from './runeWardenVfxPack';
import { BRIAR_BEAST_TEXTURE } from './briarBeastPack';
import { MAGE_ABILITY_TEXTURE } from './mageAbilityPack';
import { MAGE_SHIELD_NOVA_TEXTURE } from './mageShieldNovaPack';
import { WARDEN,wardenTexture } from './ashWardenPack';
import { FinalBossArt } from './FinalBossArt';
import { UltimateArt } from './UltimateArt';
import { ultimateFrozen } from '../systems/UltimateFreeze';
import { PlayerHealthBar } from './PlayerHealthBar';
import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Enemy, Projectile, XpOrb } from '../entities/types';
import type { LootItem, Chest } from '../loot/types';
import type { ArtifactDrop } from '../loot/ArtifactSystem';
import { ASSET_REGISTRY, LOOT_ART, ARTIFACT_ART, enemyVisual, ENEMY_ART, bossVisual, selectAsset, visualDimensions, type Facing, type VisualSelection } from './assetRegistry';
import { HD_CORE_TEXTURE } from './hdCoreLayout';
import { RUNNER_TEXTURE, RUNNER_CLIPS, runnerFrame } from './runnerPack';
import { RunnerAnimation } from './RunnerAnimation';
import { MAGE_HERO, mageHeroTexture } from './mageHeroPack';
import { MageCastingController } from './MageCastingController';
import {MageHeroArt} from './MageHeroArt';
import { MAGE_IDLE_TEXTURE } from './mageIdlePack';
import { MAGE_RUN_V2_TEXTURE } from './mageRunPackV2';
import { MAGE_CAST_V2_TEXTURE } from './mageCastPackV2';
import { MAGE_MOVING_CAST_V2_TEXTURE } from './mageMovingCastV2';
import {MageSpellOrigins} from './MageSpellOrigins';
import {MageBlinkArt} from './MageBlinkArt';
import { MAGE_BLINK_TEXTURE } from './mageBlinkPack';
import { ENEMY_TEXTURE, isHdEnemy, packedEnemyFrame } from './enemyPack';
import { EnemyAnimation } from './EnemyAnimation';
import { GUARDIAN_TEXTURE } from './guardianPack';
import { GuardianAnimation } from './GuardianAnimation';
import { EliteAdornment } from './EliteAdornment';
import { BOSS_TEXTURE, isHdBoss } from './bossPack';
import { EncounterFeedback } from './EncounterFeedback';
import { BossAnimation } from './BossAnimation';
import { LOOT_TEXTURE, ARTIFACT_KEYS, lootFrame } from './lootPack';
import { PickupAnimation } from './PickupAnimation';
import { abilityVisual } from './abilityVisual';
export type RenderEntity = Enemy | Projectile | XpOrb | LootItem | Chest | ArtifactDrop;
export function applyVisual(sprite: Phaser.GameObjects.Sprite, selection: VisualSelection, multiplier = 1) {
  const spec = ASSET_REGISTRY[selection.asset], size = visualDimensions(selection, multiplier);
  sprite.setTexture(selection.texture, selection.frame).setOrigin(spec.origin.x, spec.origin.y).setDisplaySize(size.width, size.height);
}
function legacyEnemyId(visual: string): Enemy['kind'] {
  if (!Object.hasOwn(ENEMY_ART, visual)) throw new Error('Unknown Pixel Survivor enemy visual: ' + visual);
  return visual as Enemy['kind'];
}
export function entityVisual(entity: RenderEntity, elapsed: number): VisualSelection {
  if ('kind' in entity) return enemyVisual(legacyEnemyId(entity.visual ?? entity.kind), entity.elite, elapsed, entity.id);
  if ('value' in entity) return selectAsset('xp', lootFrame('xp', elapsed));
  if ('lootKind' in entity) return selectAsset(LOOT_ART[entity.lootKind], lootFrame(entity.lootKind, elapsed));
  if ('lootPool' in entity) return selectAsset('chest', lootFrame('chest', elapsed));
  if ('artifact' in entity) return selectAsset(ARTIFACT_ART[entity.artifact], lootFrame(ARTIFACT_KEYS[entity.artifact], elapsed));
  return entity.hostile ? selectAsset('hostile', `hostile-${Math.floor(elapsed * 12) % 4}`) : selectAsset('fireball',fireballFlightFrame(elapsed-(entity.started??elapsed)));
}
// Reads simulation state; no timers, inputs, damage, collision bodies or RNG.
export class GameArt {
  private shadows: Phaser.GameObjects.Image[] = [];
  private cleaves: Phaser.GameObjects.Image[] = [];
  private runner = new RunnerAnimation();
  private runnerCorpses: Phaser.GameObjects.Image[] = [];
  private packed = new EnemyAnimation();
  private packedCorpses: Phaser.GameObjects.Image[] = [];
  private guardian = new GuardianAnimation();
  private guardianCorpses: Phaser.GameObjects.Image[] = [];
  private elites: EliteAdornment;
  private encounterFeedback = new EncounterFeedback();
  private encounterGround: Phaser.GameObjects.Graphics;
  private bosses = new BossAnimation();
  private bossCorpses: Phaser.GameObjects.Image[] = [];
  private pickups = new PickupAnimation();
  private pickupImages: Phaser.GameObjects.Image[] = [];
  private playerHealth: PlayerHealthBar;
  private worldTime = 0;
  private heroDeathAge = 0;
  private heroRunId = '';
  private heroHp = 100;
  private heroHurtStarted = -Infinity;
  private heroSprite?: Phaser.GameObjects.Sprite;
  private heroMoving = false;
  private warriorAnimation=new WarriorHeroAnimation();
  private warriorSkills:WarriorSkillArt;private warriorMoving:WarriorMovingCleaveArt;
  private warriorPose?:ReturnType<WarriorHeroAnimation['view']>;
  private blinkArt: MageBlinkArt;
  private casting = new MageCastingController();
  private mageHeroArt: MageHeroArt;
  private ultimateArt: UltimateArt;
  private finalArt:FinalBossArt;
  private mageAbilityArt:MageAbilityArt;
  private runeArt:RuneWardenArt;
  private astralArt:AstralRevenantArt;
  private fireballArt:FireballArt;
  private regularLightningArt:RegularLightningArt;
  private spellOrigins=new MageSpellOrigins();
  private frozenVisuals=new Map<number,VisualSelection>();
  private frozenRun='';
  heroFrame = '';
  constructor(private scene: Phaser.Scene) { this.warriorSkills=new WarriorSkillArt(scene);this.warriorMoving=new WarriorMovingCleaveArt(scene);this.blinkArt=new MageBlinkArt(scene);this.regularLightningArt=new RegularLightningArt(scene);this.fireballArt=new FireballArt(scene);this.runeArt=new RuneWardenArt(scene);this.astralArt=new AstralRevenantArt(scene);this.mageAbilityArt=new MageAbilityArt(scene);this.finalArt=new FinalBossArt(scene);this.encounterGround = scene.add.graphics().setDepth(-1).setName('encounter-ground'); this.ultimateArt=new UltimateArt(scene); this.playerHealth = new PlayerHealthBar(scene); this.elites = new EliteAdornment(scene); this.mageHeroArt=new MageHeroArt(scene,this.casting); for (const key of [WAR_BANNER_TEXTURE,RUNE_ACCEPTED_TEXTURE,...WARDEN_AI_PAGES.map(p=>p.key),ASTRAL_FLAME_TEXTURE,ASTRAL_PROJECTILE_TEXTURE,RUNE_VFX_TEXTURE,MAGE_SHIELD_NOVA_TEXTURE,MAGE_BLINK_TEXTURE,MAGE_MOVING_CAST_V2_TEXTURE,MAGE_CAST_V2_TEXTURE,MAGE_RUN_V2_TEXTURE,MAGE_IDLE_TEXTURE,LIGHTNING_ULTIMATE_TEXTURE,REGULAR_LIGHTNING_TEXTURE,FIREBALL_TEXTURE,MAGE_METEOR_TEXTURE,ASTRAL_REVENANT_TEXTURE,BRIAR_BEAST_TEXTURE,RUNE_FLASH_TEXTURE,RUNE_WARDEN_TEXTURE,MAGE_ABILITY_TEXTURE,...Array.from({length:WARDEN.pages},(_,i)=>wardenTexture(i)), ...MAGE_HERO.pages.map(p=>mageHeroTexture(p.index)), ...WARRIOR_HERO.pages.map(p=>warriorHeroTexture(p.index)), ...WARRIOR_SKILLS.pages.map(p=>warriorSkillsTexture(p.index)), HD_CORE_TEXTURE, RUNNER_TEXTURE, ENEMY_TEXTURE, GUARDIAN_TEXTURE, BOSS_TEXTURE, LOOT_TEXTURE]) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); }
  prepare(world: World) { this.warriorSkills.prepare(world);this.encounterFeedback.prepare(world); this.runner.prepare(world); this.packed.prepare(world); this.guardian.prepare(world); this.bosses.prepare(world); this.pickups.prepare(world); }
  observeCasts(world: World) { this.casting.observe(world);this.spellOrigins.observe(world); }
  projectileView(projectile:Projectile,world:World){if(projectile.source==='blades'&&!projectile.hostile)return {...projectile,y:projectile.y-WARRIOR_CAST.spearVisualHeight,rotation:Math.atan2(projectile.vy,projectile.vx)};const view=this.spellOrigins.projectile(projectile,world.elapsed);return projectile.appearance==='arcane-volley'?{...view,rotation:view.rotation+RUNE_FLIGHT_ANGLE}:view;}
  entityVisual(entity: RenderEntity, world: World): VisualSelection {
    if(this.frozenRun!==world.runId){this.frozenRun=world.runId;this.frozenVisuals.clear();}
    if('kind' in entity&&ultimateFrozen(entity,world.elapsed)){
      let visual=this.frozenVisuals.get(entity.id);if(!visual){visual=this.liveEntityVisual(entity,world);this.frozenVisuals.set(entity.id,visual);}return visual;
    }
    this.frozenVisuals.delete(entity.id);return this.liveEntityVisual(entity,world);
  }
  private liveEntityVisual(entity: RenderEntity, world: World): VisualSelection {
    if('vx'in entity&&entity.source==='blades'&&!entity.hostile)return selectAsset('spear','spear');

    if ('kind' in entity && entity.visual) return enemyVisual(legacyEnemyId(entity.visual), entity.elite, world.elapsed, entity.id);
    if ('kind' in entity && entity.kind === 'runner') return enemyVisual('runner', entity.elite, world.elapsed, entity.id, this.runner.view(entity, world));
    if ('kind' in entity && entity.kind === 'guardian') return selectAsset('guardian', this.guardian.frame(entity, world));
    if ('kind' in entity && isHdBoss(entity.kind)) { const p = this.bosses.view(entity, world), age=world.elapsed-p.started; const remaining=Math.max(0,(entity.kind==='eclipse'&&entity.shootingAt>world.elapsed?entity.shootingAt:entity.boss?.until??world.elapsed)-world.elapsed);if(entity.kind==='sorcerer'&&(p.pose==='windup'||p.pose==='attack')&&entity.boss?.magic?.phase!=='signal')return {...selectAsset('sorcerer',acceptedRuneCast(p.facing,p.pose,age,remaining),ASSET_REGISTRY.sorcerer.worldScale*1.5),texture:RUNE_ACCEPTED_TEXTURE};return bossVisual(entity.kind,p.facing,p.pose,age,remaining); }
    if ('kind' in entity && isHdEnemy(entity.kind)) { const p = this.packed.view(entity, world), visual = enemyVisual(entity.kind, entity.elite, world.elapsed, entity.id); return { ...visual, frame: packedEnemyFrame(entity.kind, p.facing, p.pose, world.elapsed - p.started) }; }
    if('vx' in entity&&entity.appearance==='astral-volley'){
      const age=world.elapsed-(entity.started??world.elapsed);
      if(world.bosses.some(b=>b.id===entity.ownerId&&b.kind==='eclipse'))return selectAsset('eclipseVolley',astralAiFrame('flight',age));
      return selectAsset('astralVolley',astralProjectileFrame(age),ASSET_REGISTRY.astralVolley.worldScale*(entity.homing?.variant==='fast'?1.2:1));
    }
    if('vx' in entity&&entity.appearance==='arcane-volley')return selectAsset('runeVolley',acceptedRuneFlight(world.elapsed-(entity.started??world.elapsed)));
    return entityVisual(entity, world.elapsed);
  }
  hero(sprite: Phaser.GameObjects.Sprite, world: World, _facing: Facing, moving: boolean, multiplier = 1) {
    if (this.heroRunId !== world.runId) { this.heroHp = world.player.hp; this.heroHurtStarted = -Infinity; this.heroMoving = false; }
    if (this.heroRunId !== world.runId || world.status !== 'over') this.heroDeathAge = 0;
    this.heroRunId = world.runId;
    if (world.player.hp < this.heroHp) this.heroHurtStarted = world.elapsed;
    this.heroHp = world.player.hp; this.heroSprite = sprite;
    if (world.status !== 'paused' && world.status !== 'upgrade') this.heroMoving = moving;
    if (world.status === 'over') this.heroDeathAge += Math.min(.05, this.scene.game.loop.delta / 1000);
    const hurt = world.hero.visual === 'mage' && world.elapsed - this.heroHurtStarted < .25;
    if(world.hero.visual==='mage'){this.warriorMoving.hide();
      this.warriorAnimation.clear();this.warriorPose=undefined;
      this.mageHeroArt.render(sprite,world,this.heroMoving,this.heroDeathAge,multiplier,hurt);
      this.spellOrigins.capture(world,this.mageHeroArt.muzzle(world.elapsed));
      this.heroFrame=String(sprite.frame.name);return;
    }
    this.mageHeroArt.destroy();
    this.spellOrigins.clear();
    const v=this.warriorPose=this.warriorAnimation.view(world,this.heroMoving),size=('displaySize' in v?v.displaySize:WARRIOR_HERO.displaySize)*multiplier;
    sprite.setTexture(v.texture,v.frame).setOrigin(v.origin.x,v.origin.y).setDisplaySize(size,size).setFlipX(v.flipX).setRotation(0).setCrop();
    if(world.elapsed-this.heroHurtStarted<.25)sprite.setTint(0xffd4af);else sprite.clearTint();
    this.warriorMoving.render(sprite,world,v,this.heroMoving,size);this.heroFrame=v.frame;
  }
  warriorSlash(){return this.warriorPose?.slash??null;}
  update(world: World, intensity: number, reducedMotion=false, reducedFlash=false) {
    this.warriorMoving.sync();this.warriorSkills.render(world,intensity);
    this.blinkArt.render(world,intensity,reducedFlash);this.fireballArt.render(world,intensity);this.regularLightningArt.render(world,intensity,this.spellOrigins.lightningOrigins());
    this.finalArt.render(world,intensity,reducedMotion);
    this.mageAbilityArt.render(world,intensity,reducedFlash);this.runeArt.render(world,intensity);this.astralArt.render(world,intensity);
    const liveIds=new Set(world.enemies.map(e=>e.id));for(const id of this.frozenVisuals.keys())if(!liveIds.has(id))this.frozenVisuals.delete(id);
    if(reducedMotion&&world.ultimate.selected==='lightning')this.heroSprite?.setRotation(0);
    this.mageHeroArt.sync();
    this.ultimateArt.render(world,intensity,this.mageHeroArt.diagnostics().hands,reducedMotion,reducedFlash,this.heroSprite);
    this.playerHealth.update(world);
    this.worldTime = world.elapsed;
    this.pickups.update(world);
    for (const [i, p] of this.pickups.bursts.entries()) {
      const age = world.elapsed - p.started, t = age / .5, image = this.pickupImages[i] ?? this.scene.add.image(0, 0, LOOT_TEXTURE, lootFrame(p.key, 0)); this.pickupImages[i] = image;
      const size = p.open ? 20 : p.key === 'xp' ? 6 : p.key.startsWith('artifact-') ? 18.4 : 16;
      image.setTexture(LOOT_TEXTURE, lootFrame(p.key, age, p.open)).setPosition(p.x, p.y - (p.open ? 0 : t * 15)).setDisplaySize(size * (p.open ? 1 : 1 - t * .25), size * (p.open ? 1 : 1 - t * .25)).setDepth(3).setAlpha(1 - t * t).setVisible(true).setActive(true);
    }
    for (let i = this.pickups.bursts.length; i < this.pickupImages.length; i++) this.pickupImages[i].setVisible(false).setActive(false);
    this.runner.finish(world);
    this.packed.finish(world);
    this.guardian.finish(world); this.elites.update(world);
    this.bosses.finish(world);
    this.encounterFeedback.update(world, this.bosses);
    this.encounterFeedback.draw(this.encounterGround, world, intensity);
    for (let i = 0; i < this.bosses.corpses.length; i++) {
      const c = this.bosses.corpses[i]; if (!c.active) { this.bossCorpses[i]?.setVisible(false).setActive(false); continue; }
      const age = world.elapsed - c.started, visual=bossVisual(c.kind,c.facing,'death',age),size = visualDimensions(visual), image = this.bossCorpses[i] ?? this.scene.add.image(0, 0, visual.texture,visual.frame); this.bossCorpses[i] = image;
      image.setTexture(visual.texture,visual.frame).setPosition(c.x, c.y).setOrigin(.5).setDisplaySize(size.width, size.height).setDepth(c.y / 10000 - .02).setAlpha(1 - (age / .6) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.bosses.corpses.length; i < this.bossCorpses.length; i++) this.bossCorpses[i].setVisible(false).setActive(false);
    for (const [i, corpse] of this.guardian.corpses.entries()) {
      const image = this.guardianCorpses[i] ?? this.scene.add.image(0, 0, GUARDIAN_TEXTURE, corpse.frame); this.guardianCorpses[i] = image;
      const age = world.elapsed - corpse.started, size = visualDimensions(selectAsset('guardian'));
      image.setTexture(GUARDIAN_TEXTURE, corpse.frame).setPosition(corpse.x, corpse.y).setOrigin(.5).setDisplaySize(size.width, size.height).setDepth(corpse.y / 10000 - .02).setAlpha(1 - (age / .6) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.guardian.corpses.length; i < this.guardianCorpses.length; i++) this.guardianCorpses[i].setVisible(false).setActive(false);
    for (let i = 0; i < this.packed.corpses.length; i++) {
      const c = this.packed.corpses[i];
      if (!c.active) { this.packedCorpses[i]?.setVisible(false).setActive(false); continue; }
      const visual = enemyVisual(c.kind, c.elite, world.elapsed, c.id), size = visualDimensions(visual), age = world.elapsed - c.started;
      const image = this.packedCorpses[i] ?? this.scene.add.image(0, 0, ENEMY_TEXTURE, packedEnemyFrame(c.kind, c.facing, 'death', 0)); this.packedCorpses[i] = image;
      image.setTexture(ENEMY_TEXTURE, packedEnemyFrame(c.kind, c.facing, 'death', age)).setOrigin(.5).setPosition(c.x, c.y).setDisplaySize(size.width, size.height).setDepth(c.y / 10000 - .02).setAlpha(1 - (age / .5) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.packed.corpses.length; i < this.packedCorpses.length; i++) this.packedCorpses[i].setVisible(false).setActive(false);
    for (let i = 0; i < this.runner.corpses.length; i++) {
      const corpse = this.runner.corpses[i];
      if (!corpse.active) { this.runnerCorpses[i]?.setVisible(false).setActive(false); continue; }
      const image = this.runnerCorpses[i] ?? this.scene.add.image(0, 0, RUNNER_TEXTURE, 'runner-right-death-0'); this.runnerCorpses[i] = image;
      const age = Math.max(0, world.elapsed - corpse.started), t = age / (RUNNER_CLIPS.death.frames / RUNNER_CLIPS.death.fps), size = visualDimensions(selectAsset('runner', undefined, corpse.elite ? 1.4 : 1));
      image.setTexture(RUNNER_TEXTURE, runnerFrame('death', corpse.facing, age)).setPosition(corpse.x, corpse.y).setOrigin(0.5).setDisplaySize(size.width, size.height)
        .setDepth(corpse.y / 10000 - 0.02).setAlpha(1 - t * t).setVisible(true).setActive(true);
    }
    for (let i = this.runner.corpses.length; i < this.runnerCorpses.length; i++) this.runnerCorpses[i].setVisible(false).setActive(false);
    let count = 0;
    const shadow = (x: number, y: number, scale: number) => {
      const image = this.shadows[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'shadow').setDepth(-2); this.shadows[count++] = image;
      const size = ASSET_REGISTRY.shadow.logicalSize!;
      image.setPosition(x, y).setDisplaySize(size.width * scale, size.height * scale).setVisible(true);
    };
    shadow(world.player.x, world.player.y + 1, 1.3);
    for (const e of world.enemies) shadow(Math.round(e.x), Math.round(e.y + (e.finalRole==='boss'?3:e.boss ? 23 : 6)), e.boss ? 2.5 : e.kind === 'tank' ? 1.6 : e.elite ? 1.4 : 1);
    for (let i = count; i < this.shadows.length; i++) this.shadows[i].setVisible(false);
    count = 0;
    for (const e of world.effects) if (e.kind === 'cleave' && world.hero.visual !== 'warrior') {
      const rank = abilityVisual(world.abilities.cleave.level);
      const t = Math.min(1, Math.max(0, (world.elapsed - e.started) / e.duration));
      const image = this.cleaves[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'cleave-0').setDepth(14); this.cleaves[count++] = image;
      const displaySize = e.radius * 48 / 21 * (0.75 + t * 0.25);
      image.setTexture(HD_CORE_TEXTURE, `cleave-${Math.min(3, Math.floor(t * 4))}`).setPosition(e.x, e.y)
        .setRotation(e.target ? Math.atan2(e.target.y - e.y, e.target.x - e.x) : 0).setDisplaySize(displaySize, displaySize).setAlpha((1 - t) * intensity * rank.brightness).setVisible(true);
      if (rank.capstone) image.setTint(0xffe5b4); else image.clearTint();
    }
    for (let i = count; i < this.cleaves.length; i++) this.cleaves[i].setVisible(false);
  }
  diagnostics() {
    const textures = this.scene.textures.getTextureKeys(), atlas = this.scene.textures.get(HD_CORE_TEXTURE);
    // Diagnostic reads only, pinned Phaser 4.2.1. Never used by gameplay.
    const clock = ['_active', '_pendingInsertion', '_pendingRemoval'].map(key => { const value: unknown = Reflect.get(this.scene.time, key); return Array.isArray(value) ? value.length : null; });
    return { heroFrame: this.heroFrame, atlasFrames: atlas.frameTotal - 1, runner: { atlasFrames: this.scene.textures.get(RUNNER_TEXTURE).frameTotal - 1, tracked: this.runner.tracked, activeDeaths: this.runner.corpses.filter(c => c.active).length, allocatedDeaths: this.runnerCorpses.filter(Boolean).length, replaced: this.runner.replaced, corpses: this.runner.corpses.flatMap((c, i) => c.active ? [{ ...c, frame: runnerFrame('death', c.facing, this.worldTime - c.started), width: this.runnerCorpses[i]?.displayWidth ?? 0, height: this.runnerCorpses[i]?.displayHeight ?? 0 }] : []) }, textures, chunks: textures.filter(t => t.startsWith('chunk-')).length,
      finalBoss:this.finalArt.diagnostics(),
      ultimate: this.ultimateArt.diagnostics(),
      mageAbilities:this.mageAbilityArt.diagnostics(),
      runeWarden:this.runeArt.diagnostics(),
      astralRevenant:this.astralArt.diagnostics(),
      fireball:this.fireballArt.diagnostics(),
      regularLightning:this.regularLightningArt.diagnostics(),
      blink:this.blinkArt.diagnostics(),
      spellOrigins:this.spellOrigins.diagnostics(),
      casting: {...this.casting.view(this.worldTime),...this.mageHeroArt.diagnostics(),bodyFrame:this.heroFrame},
      warrior:this.warriorPose?{...this.warriorPose,displaySize:this.heroSprite?.displayWidth,...this.warriorMoving.diagnostics()}:undefined,
      playerHealth: this.playerHealth.diagnostics(),
      textureBytes: textures.reduce((n, key) => { const source = this.scene.textures.get(key).getSourceImage() as HTMLCanvasElement; return n + source.width * source.height * 4; }, 0),
      loot: { tracked: this.pickups.tracked, active: this.pickups.bursts.length, allocated: this.pickupImages.length, frames: this.pickups.bursts.map(p => lootFrame(p.key, this.worldTime - p.started, p.open)) },
      packed: { tracked: this.packed.tracked, activeDeaths: this.packed.corpses.filter(c => c.active).length, allocatedDeaths: this.packedCorpses.length, replaced: this.packed.replaced, corpses: this.packed.corpses.filter(c => c.active).map(c => ({ ...c, frame: packedEnemyFrame(c.kind, c.facing, 'death', this.worldTime - c.started) })) },
      encounterFeedback: this.encounterFeedback.diagnostics(),
      guardian: { activeDeaths: this.guardian.corpses.length, allocatedDeaths: this.guardianCorpses.length, frame: this.guardian.corpse?.frame ?? null }, eliteAdornments: this.elites.count,
      bosses: { tracked: this.bosses.tracked, activeDeaths: this.bosses.corpses.filter(c => c.active).length, allocatedDeaths: this.bossCorpses.length, corpses: this.bosses.corpses.filter(c => c.active).map(c => ({ ...c, frame: bossVisual(c.kind,c.facing,'death',this.worldTime-c.started).frame! })) },
      shadows: this.shadows.length, cleaves: this.cleaves.length, objects: this.scene.children.length, layers: this.scene.children.getAll().filter(o => o.name === 'friendly-feedback' || o.name === 'hostile-tells').map(o => ({ name: o.name, depth: (o as Phaser.GameObjects.Graphics).depth })), tweens: this.scene.tweens.getTweens().length, clock,
      blurListeners: this.scene.game.events.listenerCount(Phaser.Core.Events.BLUR),
      actors: this.scene.children.getAll().filter(o => o.type === 'Sprite' && o.active).map(o => { const s = o as Phaser.GameObjects.Sprite; return { texture: s.texture.key, frame: s.frame.name, width: s.displayWidth, height: s.displayHeight, x: s.x, y: s.y, depth:s.depth, rotation:s.rotation, alpha:s.alpha, tint:s.tintTopLeft, visible:s.visible, originX:s.originX, originY:s.originY }; }),
    };
  }
destroy() { this.warriorMoving.destroy();this.warriorSkills.destroy();this.warriorAnimation.clear();this.warriorPose=undefined;this.blinkArt.destroy();this.spellOrigins.clear();this.regularLightningArt.destroy();this.fireballArt.destroy();this.astralArt.destroy();this.runeArt.destroy();this.mageAbilityArt.destroy();this.frozenVisuals.clear();this.ultimateArt.destroy();this.finalArt.destroy(); this.encounterGround.destroy(); this.encounterFeedback.clear(); this.mageHeroArt.destroy(); this.playerHealth.destroy(); for (const image of [...this.shadows, ...this.cleaves, ...this.runnerCorpses, ...this.packedCorpses, ...this.bossCorpses, ...this.pickupImages]) image.destroy(); this.pickupImages = []; this.pickups.clear(); this.bossCorpses = []; this.bosses.clear(); for (const image of this.guardianCorpses) image.destroy(); this.guardianCorpses = []; this.elites.destroy(); this.guardian.clear(); this.shadows = []; this.cleaves = []; this.runnerCorpses = []; this.packedCorpses = []; this.runner.destroy(); this.packed.clear(); }
}
