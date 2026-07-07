import { MockVocabularyRepository } from '@/data/repositories/MockVocabularyRepository';
import { GetRandomFlashcard } from '@/domain/usecases/GetRandomFlashcard';
import { MarkAsMemorized } from '@/domain/usecases/MarkAsMemorized';
import { MarkAsNotMemorized } from '@/domain/usecases/MarkAsNotMemorized';
import { GetVocabularyList } from '@/domain/usecases/GetVocabularyList';
import { GetStatistics } from '@/domain/usecases/GetStatistics';
import { ImportKeyValuesFromExcel } from '@/domain/usecases/ImportKeyValuesFromExcel';

const vocabularyRepository = new MockVocabularyRepository();

export const getRandomFlashcardUseCase = new GetRandomFlashcard(vocabularyRepository);
export const markAsMemorizedUseCase = new MarkAsMemorized(vocabularyRepository);
export const markAsNotMemorizedUseCase = new MarkAsNotMemorized(vocabularyRepository);
export const getVocabularyListUseCase = new GetVocabularyList(vocabularyRepository);
export const getStatisticsUseCase = new GetStatistics(vocabularyRepository);
export const importKeyValuesFromExcelUseCase = new ImportKeyValuesFromExcel(vocabularyRepository);
export const rawVocabularyRepository = vocabularyRepository;
