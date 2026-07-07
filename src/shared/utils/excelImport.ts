import * as XLSX from 'xlsx';

export interface ParsedKeyValueRow {
  key: string;
  value: string;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function findColumnName(row: Record<string, unknown>, target: 'key' | 'value'): string | null {
  return (
    Object.keys(row).find((column) => normalizeHeader(column) === target) ?? null
  );
}

export function parseKeyValueExcel(buffer: ArrayBuffer): ParsedKeyValueRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('File Excel không có sheet nào.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rows.length === 0) {
    return [];
  }

  const keyColumn = findColumnName(rows[0], 'key');
  const valueColumn = findColumnName(rows[0], 'value');

  if (!keyColumn) {
    throw new Error('Không tìm thấy cột "Key" trong file Excel.');
  }

  return rows
    .map((row) => ({
      key: String(row[keyColumn] ?? '').trim(),
      value: valueColumn ? String(row[valueColumn] ?? '').trim() : '',
    }))
    .filter((row) => row.key.length > 0);
}

export async function readExcelFromUri(uri: string): Promise<ParsedKeyValueRow[]> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Không thể đọc file Excel.');
  }

  const buffer = await response.arrayBuffer();
  return parseKeyValueExcel(buffer);
}
