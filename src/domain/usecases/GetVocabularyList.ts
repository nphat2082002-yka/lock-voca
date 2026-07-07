import { IVocabularyRepository } from '../repositories/IVocabularyRepository';
import { Vocabulary } from '../entities/Vocabulary';

export class GetVocabularyList {
  constructor(private vocabularyRepo: IVocabularyRepository) {}

  async execute(searchQuery?: string): Promise<Vocabulary[]> {
    if (searchQuery && searchQuery.trim() !== '') {
      return await this.vocabularyRepo.search(searchQuery);
    }
    return await this.vocabularyRepo.getAll();
  }
}
