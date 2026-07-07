import { IVocabularyRepository } from '../repositories/IVocabularyRepository';
import { Vocabulary } from '../entities/Vocabulary';

export class GetRandomFlashcard {
  constructor(private vocabularyRepo: IVocabularyRepository) {}

  async execute(): Promise<Vocabulary | null> {
    return await this.vocabularyRepo.getRandomUnmemorized();
  }
}
