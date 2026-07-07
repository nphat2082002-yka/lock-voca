import { rawVocabularyRepository } from '../di/container';

export const SAMPLE_KEY_VALUE_DATA = [
  {
    key: 'kết thúc cụm danh từ là danh từ chính',
    value: '',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: 'supend',
    value: 'đình chỉ',
    memorized: false,
    reviewCount: 0,
  },
  {
    key: '(v) bound/ border',
    value: 'giới hạn/ vây quanh',
    memorized: false,
    reviewCount: 0,
  },
];

export async function initializeLocalData() {
  try {
    const existing = await rawVocabularyRepository.getAll();
    if (existing.length === 0) {
      await rawVocabularyRepository.createMany(SAMPLE_KEY_VALUE_DATA);
    }
  } catch (error) {
    console.error('Local data initialization error:', error);
  }
}
