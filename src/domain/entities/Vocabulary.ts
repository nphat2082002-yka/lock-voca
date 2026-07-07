export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  memorized: boolean;
  reviewCount: number;
  lastReviewedAt?: Date | null;
  createdAt: Date;
  category?: string | null;
  difficulty?: number | null;
}

export interface KeyValueStatistics {
  totalItems: number;
  memorizedItems: number;
  unmemorizedItems: number;
  streakDays: number;
  totalSessions: number;
}

/** @deprecated Use KeyValueItem */
export type Vocabulary = KeyValueItem;

/** @deprecated Use KeyValueStatistics */
export type VocabularyStatistics = KeyValueStatistics;
