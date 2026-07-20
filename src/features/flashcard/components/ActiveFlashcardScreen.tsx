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

const BOTTOM_BAR_HEIGHT = 110;

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
        <View style={styles.contentArea}>
          <Text style={styles.completedText}>🎉 Tuyệt vời!</Text>
          <Text style={styles.completedSub}>Bạn đã nhớ hết tất cả cặp Key-Value.</Text>
        </View>
        {/* No bottom bar needed for completed state */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        <FlashcardView card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />
        {!isFlipped && (
          <Text style={styles.hintText}>Chạm thẻ để lật</Text>
        )}
      </View>

      {/* Fixed bottom action bar */}
      <View style={styles.bottomBar}>
        <View style={styles.actions}>
          {isFlipped && (
            <>
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
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: BOTTOM_BAR_HEIGHT,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 'env(safe-area-inset-bottom, 16px)' as any,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 60,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
  hintText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
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
  btnReset: {
    backgroundColor: COLORS.primary,
  },
  btnImport: {
    backgroundColor: COLORS.success,
  },
  btnDisabled: {
    opacity: 0.7,
  },
});