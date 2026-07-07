import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  importKeyValuesFromExcelUseCase,
  rawVocabularyRepository,
} from '@/shared/di/container';
import { readExcelFromUri } from '@/shared/utils/excelImport';
import { COLORS, SPACING } from '@/shared/constants/theme';

interface SettingsScreenProps {
  onTriggerLockScreen: () => void;
  onUpdate: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onTriggerLockScreen, onUpdate }) => {
  const [importing, setImporting] = React.useState(false);

  const resetProgress = async () => {
    try {
      await rawVocabularyRepository.resetAllProgress();
      onUpdate();
      Alert.alert('Thành công', 'Đã đặt lại tiến độ học.');
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể đặt lại tiến độ học.');
    }
  };

  const importFromExcel = async () => {
    try {
      setImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const rows = await readExcelFromUri(result.assets[0].uri);
      const importedCount = await importKeyValuesFromExcelUseCase.execute(rows);

      onUpdate();
      Alert.alert(
        'Nhập dữ liệu thành công',
        `Đã thêm ${importedCount} cặp Key-Value từ file Excel.`
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Nhập dữ liệu thất bại',
        e instanceof Error ? e.message : 'Không thể đọc file Excel.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>NHẬP DỮ LIỆU</Text>
      <Pressable
        style={[styles.btnImport, importing && styles.btnDisabled]}
        onPress={importFromExcel}
        disabled={importing}
      >
        {importing ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.btnImportText}>📥 Nhập từ Excel (.xlsx)</Text>
        )}
      </Pressable>
      <Text style={styles.helpText}>
        File Excel cần có 2 cột: Key và Value (đúng tên cột như mẫu). Các dòng có Key
        trống sẽ bỏ qua; Value có thể để trống.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>MÔ PHỎNG MÀN HÌNH KHÓA</Text>
      <Pressable style={styles.btnSimulate} onPress={onTriggerLockScreen}>
        <Text style={styles.btnSimulateText}>🔒 Mở mô phỏng màn hình khóa</Text>
      </Pressable>
      <Text style={styles.helpText}>
        Mô phỏng màn hình khóa hiển thị flashcard Key-Value khi mở điện thoại.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>QUẢN LÝ DỮ LIỆU</Text>
      <Pressable style={styles.btnReset} onPress={resetProgress}>
        <Text style={styles.btnResetText}>Đặt lại tiến độ học</Text>
      </Pressable>
      <Text style={styles.helpText}>
        Đánh dấu tất cả cặp Key-Value về trạng thái "Đang học" và đặt lại số lượt ôn.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  btnImport: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  btnImportText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnSimulate: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  btnSimulateText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnReset: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  btnResetText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
