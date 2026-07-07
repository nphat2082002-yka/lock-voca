import { IVocabularyRepository } from '@/domain/repositories/IVocabularyRepository';
import { KeyValueItem, KeyValueStatistics } from '@/domain/entities/Vocabulary';

const STORAGE_KEY = 'lock_kv_items';
const SESSION_KEY = 'lock_study_sessions';

export class MockVocabularyRepository implements IVocabularyRepository {
  private getStorageItems(): KeyValueItem[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const items = JSON.parse(data);
      return items.map((item: KeyValueItem & { word?: string; meaning?: string }) => ({
        id: item.id,
        key: item.key ?? item.word ?? '',
        value: item.value ?? item.meaning ?? '',
        memorized: item.memorized ?? false,
        reviewCount: item.reviewCount ?? 0,
        lastReviewedAt: item.lastReviewedAt ? new Date(item.lastReviewedAt) : null,
        createdAt: new Date(item.createdAt),
        category: item.category ?? null,
        difficulty: item.difficulty ?? null,
      }));
    } catch {
      return [];
    }
  }

  private setStorageItems(items: KeyValueItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }

  async findById(id: string): Promise<KeyValueItem | null> {
    const items = this.getStorageItems();
    return items.find((item) => item.id === id) || null;
  }

  async getAll(): Promise<KeyValueItem[]> {
    return this.getStorageItems();
  }

  async getUnmemorized(limit?: number): Promise<KeyValueItem[]> {
    const unmemorized = this.getStorageItems()
      .filter((item) => !item.memorized)
      .sort((a, b) => a.reviewCount - b.reviewCount);

    return limit ? unmemorized.slice(0, limit) : unmemorized;
  }

  async getRandomUnmemorized(): Promise<KeyValueItem | null> {
    const unmemorized = await this.getUnmemorized();
    if (unmemorized.length === 0) return null;

    const minReviewCount = Math.min(...unmemorized.map((item) => item.reviewCount));
    const pool = unmemorized.filter((item) => item.reviewCount === minReviewCount);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async update(id: string, data: Partial<KeyValueItem>): Promise<KeyValueItem> {
    const items = this.getStorageItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);

    const updated = {
      ...items[index],
      ...data,
      lastReviewedAt:
        data.lastReviewedAt === null ? null : (data.lastReviewedAt ?? items[index].lastReviewedAt),
    };

    items[index] = updated;
    this.setStorageItems(items);
    return updated;
  }

  async create(data: Omit<KeyValueItem, 'id' | 'createdAt'>): Promise<KeyValueItem> {
    const items = this.getStorageItems();
    const newRecord: KeyValueItem = {
      id: Math.random().toString(36).substring(2, 11),
      ...data,
      createdAt: new Date(),
    };
    items.push(newRecord);
    this.setStorageItems(items);
    return newRecord;
  }

  async createMany(data: Omit<KeyValueItem, 'id' | 'createdAt'>[]): Promise<void> {
    const items = this.getStorageItems();
    const newRecords = data.map((item) => ({
      id: Math.random().toString(36).substring(2, 11),
      ...item,
      createdAt: new Date(),
    }));
    items.push(...newRecords);
    this.setStorageItems(items);
  }

  async delete(id: string): Promise<void> {
    this.setStorageItems(this.getStorageItems().filter((item) => item.id !== id));
  }

  async deleteAll(): Promise<void> {
    this.setStorageItems([]);
  }

  async getStatistics(): Promise<KeyValueStatistics> {
    const items = this.getStorageItems();
    const totalItems = items.length;
    const memorizedItems = items.filter((item) => item.memorized).length;

    let totalSessions = 0;
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          totalSessions = JSON.parse(sessionData).length || 0;
        } catch {}
      }
    }

    return {
      totalItems,
      memorizedItems,
      unmemorizedItems: totalItems - memorizedItems,
      streakDays: totalSessions > 0 ? Math.min(totalSessions, 5) : 0,
      totalSessions,
    };
  }

  async search(query: string): Promise<KeyValueItem[]> {
    const lowerQuery = query.toLowerCase();
    return this.getStorageItems().filter(
      (item) =>
        item.key.toLowerCase().includes(lowerQuery) ||
        item.value.toLowerCase().includes(lowerQuery)
    );
  }

  async resetAllProgress(): Promise<void> {
    const items = this.getStorageItems().map((item) => ({
      ...item,
      memorized: false,
      reviewCount: 0,
      lastReviewedAt: null,
    }));
    this.setStorageItems(items);
  }
}
