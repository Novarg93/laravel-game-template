import { RUN_LIMITS } from '../config/runLimits';
export function xpThreshold(level: number) { return Math.min(2000, Math.floor(20 * 1.15 ** Math.min(40, Math.max(0, level - 1)))); }
export class ExperienceSystem {
  level = 1; xp = 0; pending = 0;
  constructor(private readonly maxLevel: number = RUN_LIMITS.maxLevel) {}
  gain(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0 || this.level>=this.maxLevel) return;
    this.xp = Math.round((this.xp + Math.min(100000, amount)) * 100) / 100;
    while (this.level<this.maxLevel && this.xp >= xpThreshold(this.level)) { this.xp -= xpThreshold(this.level); this.level++; this.pending++; }
    if(this.level===this.maxLevel)this.xp=0;
  }
}
