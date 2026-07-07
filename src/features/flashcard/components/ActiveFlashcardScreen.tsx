import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFlashcardStore } from '../stores/flashcardStore';
import { FlashcardView } from './FlashcardView';
import {
  importKeyValuesFromExcelUseCase,
  rawVocabularyRepository,
} from '@/shared/di/container';
import { readExcelFromUri } from '@/shared/utils/excelImport';
import { COLORS, SPACING } from '@/shared/constants/theme';

interface ActiveFlashcardScreenProps {
  onUpdate: () => void;
}

export const ActiveFlashcardScreen: React.FC<ActiveFlashcardScreenProps> = ({ onUpdate }) => {
  const { currentCard, isFlipped, loadNextCard, flipCard, markAsMemorized, markAsNotMemorized } =
    useFlashcardStore();
  const [importing, setImporting] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  React.useEffect(() => {
    loadNextCard();
  }, []);

  const handleMarkMemorized = async () => {
    await markAsMemorized();
    onUpdate();
  };

  const handleMarkNotMemorized = async () => {
    await markAsNotMemorized();
    onUpdate();
  };

  const handleReloadStack = async () => {
    try {
      setResetting(true);
      await rawVocabularyRepository.resetAllProgress();
      await loadNextCard();
      onUpdate();
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể đặt lại bộ thẻ.');
    } finally {
      setResetting(false);
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

      await loadNextCard();
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

  if (!currentCard) {
    return (
      <View style={styles.container}>
        <Text style={styles.completedText}>🎉 Tuyệt vời!</Text>
        <Text style={styles.completedSub}>Bạn đã nhớ hết tất cả cặp Key-Value.</Text>
        <View style={styles.completedActions}>
          <Pressable
            style={[styles.btnReset, resetting && styles.btnDisabled]}
            onPress={handleReloadStack}
            disabled={resetting || importing}
          >
            {resetting ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.btnResetText}>Học lại bộ thẻ</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.btnImport, importing && styles.btnDisabled]}
            onPress={importFromExcel}
            disabled={resetting || importing}
          >
            {importing ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.btnImportText}>Nhập từ Excel</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashcardView card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />

      {isFlipped && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.btnNo]}
            onPress={handleMarkNotMemorized}
          >
            <Text style={styles.btnText}>Cần học thêm ❌</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, styles.btnYes]}
            onPress={handleMarkMemorized}
          >
            <Text style={styles.btnText}>Đã nhớ ✓</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNo: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  btnYes: {
    backgroundColor: COLORS.success,
  },
  btnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  completedSub: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  completedActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  btnReset: {
    backgroundColor: COLORS.primary,
    minWidth: 132,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnResetText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  btnImport: {
    backgroundColor: COLORS.success,
    minWidth: 132,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnImportText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
