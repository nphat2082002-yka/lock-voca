import { IVocabularyRepository } from '../repositories/IVocabularyRepository';
import { ParsedKeyValueRow } from '@/shared/utils/excelImport';

export class ImportKeyValuesFromExcel {
  constructor(private repository: IVocabularyRepository) {}

  async execute(rows: ParsedKeyValueRow[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }

    await this.repository.createMany(
      rows.map((row) => ({
        key: row.key,
        value: row.value,
        memorized: false,
        reviewCount: 0,
      }))
    );

    return rows.length;
  }
}
