import { IVocabularyRepository } from '../repositories/IVocabularyRepository';
import { VocabularyStatistics } from '../entities/Vocabulary';

export class GetStatistics {
  constructor(private vocabularyRepo: IVocabularyRepository) {}

  async execute(): Promise<VocabularyStatistics> {
    return await this.vocabularyRepo.getStatistics();
  }
}
