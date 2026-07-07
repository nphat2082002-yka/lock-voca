import { KeyValueItem, KeyValueStatistics } from '../entities/Vocabulary';

export interface IVocabularyRepository {
  findById(id: string): Promise<KeyValueItem | null>;
  getAll(): Promise<KeyValueItem[]>;
  getUnmemorized(limit?: number): Promise<KeyValueItem[]>;
  getRandomUnmemorized(): Promise<KeyValueItem | null>;
  update(id: string, data: Partial<KeyValueItem>): Promise<KeyValueItem>;
  create(data: Omit<KeyValueItem, 'id' | 'createdAt'>): Promise<KeyValueItem>;
  createMany(data: Omit<KeyValueItem, 'id' | 'createdAt'>[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  getStatistics(): Promise<KeyValueStatistics>;
  search(query: string): Promise<KeyValueItem[]>;
  resetAllProgress(): Promise<void>;
}
