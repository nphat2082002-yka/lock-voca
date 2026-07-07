import { IVocabularyRepository } from '../repositories/IVocabularyRepository';

export class MarkAsMemorized {
  constructor(private vocabularyRepo: IVocabularyRepository) {}

  async execute(vocabularyId: string): Promise<void> {
    const vocab = await this.vocabularyRepo.findById(vocabularyId);
    if (!vocab) throw new Error(`Vocabulary ${vocabularyId} not found`);

    await this.vocabularyRepo.update(vocabularyId, {
      memorized: true,
      reviewCount: vocab.reviewCount + 1,
      lastReviewedAt: new Date(),
    });
  }
}
