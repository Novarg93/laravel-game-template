import type Phaser from 'phaser';
import { BALANCE } from '../../config/gameBalance';
import type { Enemy } from '../../entities/types';
import type { Settings } from '../../services/storage';
import type { World } from '../../systems/World';
import type { Point } from '../../utils/math';
import type { RenderEntity } from '../GameArt';
import { animationFrame, facingDirection, spriteClip } from './animation';
import { preparePackTextures } from './loader';
import { packTextureKey } from './registry';
import type { ClipName, Direction, PackManifest, SpriteDefinition } from './types';
import { assetIndex, binding } from './validation';

interface Pose { clip: ClipName; since: number; direction: Direction }
interface EnemyPose extends Point, Pose { id: number; visual: string }
type Image = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
const initialPose: Pose = { clip: 'idle', since: 0, direction: 's' };

export class ManifestArt {
    private sprites: Map<string, SpriteDefinition>;
    private readonly cache: ReturnType<typeof preparePackTextures>;
    private heroPose: Pose = initialPose;
    private heroCastUntil = 0;
    private heroHurtUntil = 0;
    private heroHp = 0;
    private run = '';
    private enemies = new Map<number, EnemyPose>();
    private corpses: (EnemyPose & { until: number })[] = [];
    private effectPool: Phaser.GameObjects.Image[] = [];
    private numbers: Phaser.GameObjects.Text[] = [];
    private readonly feedback: Phaser.GameObjects.Graphics;
    private floor?: Phaser.GameObjects.TileSprite;
    private terrainId?: string;
    private heroVisual?: ReturnType<ManifestArt['frame']>;

    constructor(private scene: Phaser.Scene, readonly pack: PackManifest) {
        this.cache = preparePackTextures(scene, pack);
        this.sprites = assetIndex(pack.sprites, 'sprite');
        this.feedback = scene.add.graphics().setName('manifest-feedback').setDepth(14);
    }

    observe(w: World) {
        if (this.run !== w.runId) {
            this.run = w.runId;
            this.heroPose = { ...initialPose, since: w.elapsed };
            this.heroCastUntil = 0;
            this.heroHurtUntil = 0;
            this.heroHp = w.player.hp;
            this.enemies.clear();
            this.corpses = [];
        }
        if (w.player.hp > 0 && w.player.hp < this.heroHp) this.heroHurtUntil = w.elapsed + .22;
        this.heroHp = w.player.hp;
        if (w.feedbackEvents.some(event => event.type === 'ability')) this.heroCastUntil = w.elapsed + .22;
    }

    private frame(id: string, state: ClipName, age: number, direction: Direction = 's', moving = false) {
        const sprite = this.sprites.get(id);
        if (!sprite) throw new Error(`Unknown sprite ${id} in ${this.pack.id}`);
        const clip = spriteClip(sprite, moving && !sprite.clips.walk && sprite.clips.run ? 'run' : state);
        const choice = animationFrame(sprite, clip, direction, age);
        return { id, texture: packTextureKey(this.pack, clip.texture), frame: choice.frame ?? undefined, flipX: choice.flipX,
            origin: sprite.origin, scale: sprite.scale, rotateWithVelocity: sprite.directions === 1 };
    }

    apply(sprite: Image, visual: ReturnType<ManifestArt['frame']>, multiplier = 1) {
        if (sprite.texture.key !== visual.texture || visual.frame !== undefined && String(sprite.frame.name) !== String(visual.frame)) sprite.setTexture(visual.texture, visual.frame);
        sprite.setOrigin(...visual.origin).setScale(visual.scale * multiplier).setFlipX(visual.flipX);
    }

    hero(sprite: Phaser.GameObjects.Sprite, w: World, moving: boolean, scale: number) {
        const pose = w.status === 'over' && w.outcome !== 'victory' ? 'death'
            : this.heroHurtUntil > w.elapsed ? 'hurt'
                : w.warrior.cleave && !w.warrior.cleave.hit ? 'attack'
                    : w.elapsed < this.heroCastUntil || w.ultimate.casting ? 'cast' : moving ? 'walk' : 'idle';
        const direction = moving ? facingDirection(w.facing.x, w.facing.y, this.heroPose.direction) : this.heroPose.direction;
        const clock = pose === 'death' ? this.scene.time.now / 1000 : w.elapsed;
        if (pose !== this.heroPose.clip) this.heroPose = { clip: pose, direction, since: clock };
        else this.heroPose.direction = direction;
        this.heroVisual = this.frame(binding(this.pack.heroes, w.character, w.hero.visual)!, pose, clock - this.heroPose.since, direction, moving);
        this.apply(sprite, this.heroVisual, scale);
    }

    private skill(w: World, source: string | undefined) {
        const skill = w.abilityDefinitions.find(value => value.behavior === source);
        return skill && binding(this.pack.skills, skill.contentId, skill.visual);
    }

    private enemy(enemy: Enemy, w: World) {
        const id = enemy.contentId ?? enemy.kind, spec = w.enemyDefinition(id)!;
        const elite = enemy.elite ? binding(this.pack.enemies, id + '-elite', spec.visual + '-elite') : undefined;
        const visual = elite ?? binding(this.pack.enemies, id, spec.visual)!;
        const old = this.enemies.get(enemy.id);
        const dx = old ? enemy.x - old.x : 0, dy = old ? enemy.y - old.y : 0;
        const moving = Math.abs(dx) + Math.abs(dy) > .01;
        const clip = enemy.hp <= 0 ? 'death' : enemy.hitUntil > w.elapsed ? 'hurt'
            : enemy.finalRole === 'boss' && w.finalEncounter.attack.kind !== 'approach'
                || enemy.boss?.phase === 'charge' || enemy.boss?.phase === 'windup' || enemy.shootingAt > w.elapsed ? 'attack' : moving ? 'walk' : 'idle';
        const direction = facingDirection(dx, dy, old?.direction);
        const since = old?.clip === clip ? old.since : w.elapsed;
        this.enemies.set(enemy.id, { id: enemy.id, x: enemy.x, y: enemy.y, visual, clip, direction, since });
        return this.frame(visual, clip, w.elapsed - since, direction, moving);
    }

    entity(entity: RenderEntity, w: World) {
        const age = 'born' in entity ? w.elapsed - entity.born : 'started' in entity ? w.elapsed - (entity.started ?? w.elapsed) : w.elapsed;
        if ('kind' in entity) return this.enemy(entity, w);
        if ('vx' in entity) {
            const id = entity.hostile ? this.pack.projectiles.hostile : this.skill(w, entity.source)?.projectile ?? this.pack.projectiles.player;
            return this.frame(id, 'idle', age, facingDirection(entity.vx, entity.vy));
        }
        const item = 'lootKind' in entity ? entity.lootKind : 'lootPool' in entity ? 'chest' : 'artifact' in entity ? 'artifact' : 'xp';
        return this.frame(this.pack.pickups[item], 'idle', age);
    }

    terrain(w: World, zoom: number) {
        const map = w.map;
        const spec = binding(this.pack.terrain, map.id, map.presentation.artPack)!;
        const camera = this.scene.cameras.main;
        const width = this.scene.scale.width / zoom, height = this.scene.scale.height / zoom;
        if (!this.floor || this.terrainId !== map.id) {
            this.floor?.destroy();
            this.terrainId = map.id;
            this.floor = this.scene.add.tileSprite(0, 0, width, height, packTextureKey(this.pack, spec.texture))
                .setDepth(-20).setTileScale(spec.scale);
        }
        this.floor.setSize(width, height).setPosition(camera.midPoint.x, camera.midPoint.y);
        this.floor.setTilePosition((camera.midPoint.x - width / 2) / spec.scale, (camera.midPoint.y - height / 2) / spec.scale);
    }

    feedbackFrame(w: World, settings: Settings) {
        const g = this.feedback.clear();
        const intensity = settings.effectsIntensity ?? .7;
        const active = new Set(w.enemies.map(enemy => enemy.id));
        for (const [id, enemy] of this.enemies) if (!active.has(id)) {
            const death = w.effects.find(effect => effect.kind === 'death' && Math.hypot(effect.x - enemy.x, effect.y - enemy.y) < 20);
            if (death && this.sprites.get(enemy.visual)?.clips.death && this.corpses.length < 24) {
                this.corpses.push({ ...enemy, since: death.started, until: death.expires });
            }
            this.enemies.delete(id);
        }
        this.corpses = this.corpses.filter(corpse => corpse.until > w.elapsed);
        let used = 0;
        let labels = 0;
        const draw = (visual: ReturnType<ManifestArt['frame']>, x: number, y: number, alpha: number, scale = 1) => {
            if (used >= BALANCE.effectCap) return;
            const sprite = this.effectPool[used] ??= this.scene.add.image(0, 0, visual.texture, visual.frame).setDepth(13);
            used++;
            this.apply(sprite, visual, scale);
            sprite.setPosition(x, y).setAlpha(alpha).setVisible(true);
        };
        for (const corpse of this.corpses) draw(this.frame(corpse.visual, 'death', w.elapsed - corpse.since, corpse.direction), corpse.x, corpse.y, .8);
        for (const effect of w.effects) {
            const age = w.elapsed - effect.started;
            const fade = Math.max(0, 1 - age / effect.duration) * intensity;
            const skill = this.skill(w, effect.source ?? (effect.kind === 'fireball-impact' ? 'fireball' : effect.kind));
            const id = effect.kind === 'hit' ? this.pack.feedback.hit : effect.kind === 'death' ? this.pack.feedback.death : skill?.effect ?? this.pack.feedback.area;
            draw(this.frame(id, 'idle', age), effect.x, effect.y, fade, effect.kind === 'hit' ? 1 : Math.max(1, effect.radius / 18));
            if (effect.target) g.lineStyle(2, 0xafdcff, fade).lineBetween(effect.x, effect.y, effect.target.x, effect.target.y);
            if (settings.damageNumbers && effect.kind === 'hit' && effect.amount && labels < 24) {
                const label = this.numbers[labels] ??= this.scene.add.text(0, 0, '', { fontSize: 10, color: '#fff1cc' }).setDepth(16);
                labels++;
                label.setText(String(Math.ceil(effect.amount))).setPosition(effect.x, effect.y - age * 15 - 8).setAlpha(fade).setVisible(true);
            }
        }
        for (const item of [...w.impacts, ...w.zones]) {
            const hostile = 'hostile' in item && item.hostile || 'ownerId' in item && item.ownerId !== undefined;
            const color = hostile ? 0xff6089 : 0x99e8ff;
            g.fillStyle(color, .12).fillCircle(item.x, item.y, item.radius).lineStyle(1, color, .75).strokeCircle(item.x, item.y, item.radius);
            const visual = hostile ? this.pack.feedback.danger : this.skill(w, item.source)?.effect ?? this.pack.feedback.area;
            draw(this.frame(visual, 'idle', w.elapsed), item.x, item.y, intensity * .45);
        }
        for (const danger of w.finalEncounter.dangers()) {
            g.lineStyle(2, 0xff6089, .8).fillStyle(0xff6089, .16);
            if (danger.kind === 'strip') {
                g.lineStyle(danger.radius * 2, 0xff6089, .22).lineBetween(danger.from.x, danger.from.y, danger.to.x, danger.to.y);
            } else if (danger.kind === 'sector') {
                const angle = Math.atan2(danger.aim.y, danger.aim.x);
                g.slice(danger.center.x, danger.center.y, danger.radius, angle - danger.angle / 2, angle + danger.angle / 2).fillPath().strokePath();
            } else g.fillCircle(danger.center.x, danger.center.y, danger.radius).strokeCircle(danger.center.x, danger.center.y, danger.radius);
        }
        for (const enemy of w.enemies) if (enemy.elite) g.lineStyle(1, 0xffd889, .85).strokeCircle(enemy.x, enemy.y, enemy.radius * 1.15);
        if (w.status !== 'menu') {
            const x = w.player.x - 14, y = w.player.y - 25;
            g.fillStyle(0x171e29).fillRect(x, y, 28, 4)
                .fillStyle(0x75dfa9).fillRect(x + 1, y + 1, 26 * (w.player.hp / w.effectiveMaxHp), 2);
            if (w.absorb > 0) g.lineStyle(1, 0x9dd9ff, .8).strokeCircle(w.player.x, w.player.y, 19);
        }
        for (let i = used; i < this.effectPool.length; i++) this.effectPool[i].setVisible(false);
        for (let i = labels; i < this.numbers.length; i++) this.numbers[i].setVisible(false);
    }

    diagnostics() {
        return { id: this.pack.id, ...this.cache, hero: this.heroVisual, terrain: this.floor?.texture.key,
            tracked: this.enemies.size, effects: this.effectPool.length, corpses: this.corpses.length };
    }

    destroy() {
        this.floor?.destroy();
        this.feedback.destroy();
        for (const image of this.effectPool) image.destroy();
        for (const number of this.numbers) number.destroy();
        this.enemies.clear();
        this.corpses = [];
    }
}
