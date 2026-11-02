import { rawVocabularyRepository } from '../di/container';

export const SAMPLE_KEY_VALUE_DATA = [
  {
    key: 'terminate',
    value: 'chấm dứt, kết thúc',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'suspend',
    value: 'đình chỉ, hoãn lại',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'bound / border',
    value: 'giới hạn, vây quanh',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'noun phrase head',
    value: 'kết thúc cụm danh từ là danh từ chính',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'allocate',
    value: 'phân bổ, chỉ định tài nguyên',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'mandatory',
    value: 'bắt buộc, cưỡng chế',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'compatible',
    value: 'tương thích, phù hợp',
    memorized: false,
    reviewCount: 0,
  },
];

export async function initializeLocalData() {
  try {
    const existing = await rawVocabularyRepository.getAll();
    if (existing.length < 4) {
      // If empty or fewer than 4 items, seed or complement with sample data
      const existingKeys = new Set(existing.map((item) => item.key.toLowerCase()));
      const itemsToAdd = SAMPLE_KEY_VALUE_DATA.filter(
        (sample) => !existingKeys.has(sample.key.toLowerCase())
      );
      if (itemsToAdd.length > 0) {
        await rawVocabularyRepository.createMany(itemsToAdd);
      }
    }
  } catch (error) {
    console.error('Local data initialization error:', error);
  }
}
