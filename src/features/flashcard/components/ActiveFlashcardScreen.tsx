import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFlashcardStore } from '../stores/flashcardStore';
import { FlashcardView } from './FlashcardView';
import {
  importKeyValuesFromExcelUseCase,
  rawVocabularyRepository,
} from '@/shared/di/container';
import { readExcelFromUri } from '@/shared/utils/excelImport';
import {
  COLORS,
  SPACING,
  RADII,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';

interface ActiveFlashcardScreenProps {
  onUpdate: () => void;
}

export const ActiveFlashcardScreen: React.FC<ActiveFlashcardScreenProps> = ({ onUpdate }) => {
  const {
    currentCard,
    isFlipped,
    loadNextCard,
    flipCard,
    markAsMemorized,
    markAsNotMemorized,
  } = useFlashcardStore();
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

  // State when all cards have been memorized
  if (!currentCard) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebrationBox}>
          <View style={styles.trophyCircle}>
            <Icon name="sparkles" size={36} color={COLORS.successLight} />
          </View>
          <Text style={styles.completedTitle}>Tuyệt vời! Hoàn thành</Text>
          <Text style={styles.completedSub}>
            Bạn đã nhớ hết tất cả các cặp Key-Value trong bộ thẻ.
          </Text>
        </View>

        <View style={styles.emptyActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Học lại từ đầu, đặt lại tiến độ học"
            style={({ pressed }) => [
              styles.actionCta,
              styles.btnPrimary,
              resetting && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleReloadStack}
            disabled={resetting}
          >
            {resetting ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Icon name="refresh" size={18} color={COLORS.text} />
                <Text style={styles.btnPrimaryText}>Ôn lại từ đầu</Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhập thêm từ vựng từ file Excel"
            style={({ pressed }) => [
              styles.actionCta,
              styles.btnSecondary,
              importing && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={importFromExcel}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Icon name="upload" size={18} color={COLORS.text} />
                <Text style={styles.btnSecondaryText}>Nhập thêm từ Excel (.xlsx)</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Flashcard Area */}
        <View style={styles.cardArea}>
          <FlashcardView card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />
        </View>

        {/* Action Controls Area at bottom of thumb zone */}
        <View style={styles.bottomControls}>
          {isFlipped ? (
            <View style={styles.reviewActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đánh dấu cần học thêm"
                style={({ pressed }) => [
                  styles.reviewBtn,
                  styles.btnNeedReview,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleMarkNotMemorized}
              >
                <Icon name="x" size={20} color={COLORS.errorLight} />
                <Text style={styles.btnNeedReviewText}>Cần học lại</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đánh dấu đã nhớ"
                style={({ pressed }) => [
                  styles.reviewBtn,
                  styles.btnMemorized,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleMarkMemorized}
              >
                <Icon name="check" size={20} color={COLORS.text} strokeWidth={2.5} />
                <Text style={styles.btnMemorizedText}>Đã nhớ</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lật thẻ để xem Value"
              style={({ pressed }) => [
                styles.actionCta,
                styles.btnFlip,
                pressed && styles.btnPressed,
              ]}
              onPress={flipCard}
            >
              <Icon name="refresh" size={18} color={COLORS.text} />
              <Text style={styles.btnFlipText}>Lật thẻ xem kết quả</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
      : SPACING.lg) as any,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  bottomControls: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingTop: SPACING.sm,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  reviewBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.cta,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  btnNeedReview: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  btnNeedReviewText: {
    color: COLORS.errorLight,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnMemorized: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnMemorizedText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  actionCta: {
    minHeight: TOUCH_TARGET.cta,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  btnFlip: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnFlipText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 32px)'
      : SPACING['2xl']) as any,
  },
  celebrationBox: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
    maxWidth: 360,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  completedTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  completedSub: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 360,
    gap: SPACING.md,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  btnSecondaryText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
  },
});
