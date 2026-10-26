import { Achievement, AchievementCategory, PlayerMilestones } from '../types/game';
import { soundManager } from '../audio/soundManager';

export const INITIAL_ACHIEVEMENTS: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_fish',
    title: 'First Fish Caught',
    description: 'Catch your first fish from the ocean with the fishing rod.',
    icon: '🎣',
    category: 'fishing',
    target: 1,
  },
  {
    id: 'raft_expanded_10',
    title: 'Raft Expanded 10x',
    description: 'Expand your raft to 10 or more foundation platforms.',
    icon: '🪵',
    category: 'building',
    target: 10,
  },
  {
    id: 'survived_5_days',
    title: 'Survived 5 Days',
    description: 'Endure 5 full days and nights cast away on the open ocean.',
    icon: '🌅',
    category: 'survival',
    target: 5,
  },
  {
    id: 'master_angler',
    title: 'Master Angler',
    description: 'Catch 5 fish or ocean bounties using the fishing rod.',
    icon: '🐟',
    category: 'fishing',
    target: 5,
  },
  {
    id: 'debris_scavenger',
    title: 'Debris Scavenger',
    description: 'Hook and reel in 10 pieces of floating salvage with your grappling hook.',
    icon: '🪝',
    category: 'survival',
    target: 10,
  },
  {
    id: 'survivor_feast',
    title: 'Survivor Feast',
    description: 'Cook and consume 3 delicious meals prepared on the grill.',
    icon: '🍳',
    category: 'survival',
    target: 3,
  },
  {
    id: 'clean_hydration',
    title: 'Ocean Purifier',
    description: 'Purify seawater and drink fresh clean water 3 times.',
    icon: '💧',
    category: 'survival',
    target: 3,
  },
  {
    id: 'shark_repeller',
    title: 'Ocean Apex Rival',
    description: 'Strike and wound Bruce the shark with your spear.',
    icon: '🦈',
    category: 'survival',
    target: 1,
  },
  {
    id: 'island_explorer',
    title: 'Castaway Explorer',
    description: 'Harvest natural resources from an uncharted tropical island.',
    icon: '🏝️',
    category: 'exploration',
    target: 1,
  },
  {
    id: 'grand_architect',
    title: 'Master Shipwright',
    description: 'Construct 20 total structures (walls, pillars, floors, or stations).',
    icon: '🔨',
    category: 'building',
    target: 20,
  },
  {
    id: 'green_thumb',
    title: 'Ocean Botanist',
    description: 'Plant seeds and harvest fresh crops in a crop plot.',
    icon: '🌱',
    category: 'survival',
    target: 1,
  },
];

const STORAGE_KEY_ACHIEVEMENTS = 'raft_3d_achievements_v1';
const STORAGE_KEY_MILESTONES = 'raft_3d_milestones_v1';

export class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private milestones: PlayerMilestones = {
    fishCaught: 0,
    raftTilesBuilt: 4, // Starts with initial 2x2 = 4 tiles
    totalStructuresBuilt: 4,
    daysSurvived: 1,
    debrisHooked: 0,
    mealsCooked: 0,
    waterPurified: 0,
    sharkRepelled: 0,
    islandResourcesHarvested: 0,
    itemsCrafted: 0,
  };

  private onUnlockCallback?: (achievement: Achievement) => void;

  constructor(onUnlock?: (achievement: Achievement) => void) {
    this.onUnlockCallback = onUnlock;
    this.init();
  }

  private init() {
    // 1. Initialize default achievements
    INITIAL_ACHIEVEMENTS.forEach((item) => {
      this.achievements.set(item.id, {
        ...item,
        progress: 0,
        isUnlocked: false,
      });
    });

    // 2. Load saved milestones and unlock state if available
    try {
      const savedMilestones = localStorage.getItem(STORAGE_KEY_MILESTONES);
      if (savedMilestones) {
        const parsed = JSON.parse(savedMilestones);
        this.milestones = { ...this.milestones, ...parsed };
      }

      const savedAchievements = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
      if (savedAchievements) {
        const parsed: Record<string, { isUnlocked: boolean; unlockedAt?: number; progress?: number }> = JSON.parse(savedAchievements);
        Object.entries(parsed).forEach(([id, data]) => {
          const ach = this.achievements.get(id);
          if (ach) {
            ach.isUnlocked = !!data.isUnlocked;
            ach.unlockedAt = data.unlockedAt;
            if (data.progress !== undefined) ach.progress = data.progress;
          }
        });
      }
    } catch {
      // LocalStorage unavailable in certain sandboxes, ignore
    }

    this.recomputeProgress();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(this.milestones));
      const achRecord: Record<string, { isUnlocked: boolean; unlockedAt?: number; progress: number }> = {};
      this.achievements.forEach((ach, id) => {
        achRecord[id] = {
          isUnlocked: ach.isUnlocked,
          unlockedAt: ach.unlockedAt,
          progress: ach.progress,
        };
      });
      localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achRecord));
    } catch {
      // Ignore storage errors
    }
  }

  public setUnlockCallback(cb: (achievement: Achievement) => void) {
    this.onUnlockCallback = cb;
  }

  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getMilestones(): PlayerMilestones {
    return { ...this.milestones };
  }

  public restoreSave(milestones?: Partial<PlayerMilestones>, unlockedIds?: string[]) {
    if (milestones) {
      this.milestones = { ...this.milestones, ...milestones };
    }
    if (unlockedIds && Array.isArray(unlockedIds)) {
      unlockedIds.forEach((id) => {
        const ach = this.achievements.get(id);
        if (ach) {
          ach.isUnlocked = true;
          ach.progress = ach.target;
        }
      });
    }
    this.recomputeProgress();
    this.persist();
  }

  public getProgressSummary(): { total: number; unlocked: number; percentage: number } {
    const list = Array.from(this.achievements.values());
    const total = list.length;
    const unlocked = list.filter((a) => a.isUnlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }

  private checkUnlock(id: string, currentVal: number) {
    const ach = this.achievements.get(id);
    if (!ach) return;

    ach.progress = Math.min(ach.target, currentVal);

    if (!ach.isUnlocked && currentVal >= ach.target) {
      ach.isUnlocked = true;
      ach.unlockedAt = Date.now();
      ach.progress = ach.target;

      soundManager.playAchievementUnlocked();
      this.onUnlockCallback?.({ ...ach });
    }

    this.persist();
  }

  private recomputeProgress() {
    this.checkUnlock('first_fish', this.milestones.fishCaught);
    this.checkUnlock('master_angler', this.milestones.fishCaught);
    this.checkUnlock('raft_expanded_10', this.milestones.raftTilesBuilt);
    this.checkUnlock('survived_5_days', this.milestones.daysSurvived);
    this.checkUnlock('debris_scavenger', this.milestones.debrisHooked);
    this.checkUnlock('survivor_feast', this.milestones.mealsCooked);
    this.checkUnlock('clean_hydration', this.milestones.waterPurified);
    this.checkUnlock('shark_repeller', this.milestones.sharkRepelled);
    this.checkUnlock('island_explorer', this.milestones.islandResourcesHarvested);
    this.checkUnlock('grand_architect', this.milestones.totalStructuresBuilt);
  }

  // Event recorders
  public recordFishCaught() {
    this.milestones.fishCaught++;
    this.checkUnlock('first_fish', this.milestones.fishCaught);
    this.checkUnlock('master_angler', this.milestones.fishCaught);
  }

  public recordRaftFoundationCount(count: number) {
    this.milestones.raftTilesBuilt = Math.max(this.milestones.raftTilesBuilt, count);
    this.checkUnlock('raft_expanded_10', this.milestones.raftTilesBuilt);
  }

  public recordStructureBuilt(isFoundation: boolean, totalStructures: number) {
    if (isFoundation) {
      this.milestones.raftTilesBuilt++;
      this.checkUnlock('raft_expanded_10', this.milestones.raftTilesBuilt);
    }
    this.milestones.totalStructuresBuilt = Math.max(this.milestones.totalStructuresBuilt, totalStructures);
    this.checkUnlock('grand_architect', this.milestones.totalStructuresBuilt);
  }

  public recordDaySurvived(day: number) {
    this.milestones.daysSurvived = Math.max(this.milestones.daysSurvived, day);
    this.checkUnlock('survived_5_days', this.milestones.daysSurvived);
  }

  public recordDebrisHooked() {
    this.milestones.debrisHooked++;
    this.checkUnlock('debris_scavenger', this.milestones.debrisHooked);
  }

  public recordMealEaten() {
    this.milestones.mealsCooked++;
    this.checkUnlock('survivor_feast', this.milestones.mealsCooked);
  }

  public recordWaterPurified() {
    this.milestones.waterPurified++;
    this.checkUnlock('clean_hydration', this.milestones.waterPurified);
  }

  public recordSharkRepelled() {
    this.milestones.sharkRepelled++;
    this.checkUnlock('shark_repeller', this.milestones.sharkRepelled);
  }

  public recordIslandResourceHarvested() {
    this.milestones.islandResourcesHarvested++;
    this.checkUnlock('island_explorer', this.milestones.islandResourcesHarvested);
  }

  public recordCropHarvested() {
    const ach = this.achievements.get('green_thumb');
    if (ach && !ach.isUnlocked) {
      ach.isUnlocked = true;
      ach.progress = 1;
      ach.unlockedAt = Date.now();
      soundManager.playAchievementUnlocked();
      this.onUnlockCallback?.({ ...ach });
      this.persist();
    }
  }

  public resetAll() {
    INITIAL_ACHIEVEMENTS.forEach((item) => {
      this.achievements.set(item.id, {
        ...item,
        progress: 0,
        isUnlocked: false,
      });
    });
    this.milestones = {
      fishCaught: 0,
      raftTilesBuilt: 4,
      totalStructuresBuilt: 4,
      daysSurvived: 1,
      debrisHooked: 0,
      mealsCooked: 0,
      waterPurified: 0,
      sharkRepelled: 0,
      islandResourcesHarvested: 0,
      itemsCrafted: 0,
    };
    try {
      localStorage.removeItem(STORAGE_KEY_ACHIEVEMENTS);
      localStorage.removeItem(STORAGE_KEY_MILESTONES);
    } catch {
      // Ignore
    }
  }
}
