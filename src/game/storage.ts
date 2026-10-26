import { WorldSaveData, SerializedStructure } from '../types/game';

const STORAGE_KEY = 'raft_oceanic_world_save_v1';

export function saveWorldLocally(data: WorldSaveData): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save world locally to localStorage:', err);
    return false;
  }
}

export function loadWorldLocally(): WorldSaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as WorldSaveData;
    if (data && Array.isArray(data.structures)) {
      return data;
    }
    return null;
  } catch (err) {
    console.error('Failed to load world from localStorage:', err);
    return null;
  }
}

export function clearWorldLocally(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear world save:', err);
  }
}
