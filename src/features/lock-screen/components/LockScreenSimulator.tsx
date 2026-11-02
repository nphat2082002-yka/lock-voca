import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useFlashcardStore } from '@/features/flashcard/stores/flashcardStore';
import { FlashcardView } from '@/features/flashcard/components/FlashcardView';
import {
  COLORS,
  SPACING,
  RADII,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';

interface LockScreenSimulatorProps {
  onUnlock: () => void;
}

export const LockScreenSimulator: React.FC<LockScreenSimulatorProps> = ({ onUnlock }) => {
  const {
    currentCard,
    isFlipped,
    loadNextCard,
    flipCard,
    markAsMemorized,
    markAsNotMemorized,
  } = useFlashcardStore();
  const [time, setTime] = React.useState('');
  const [date, setDate] = React.useState('');

  React.useEffect(() => {
    loadNextCard();

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.overlayContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Time & Date Header with Safe Area Top */}
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Icon name="lock" size={13} color={COLORS.accent} />
            <Text style={styles.lockBadgeText}>MÀN HÌNH KHÓA</Text>
          </View>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.dateText}>{date}</Text>
        </View>

        {/* Card and Actions Area */}
        {currentCard ? (
          <View style={styles.cardSection}>
            <FlashcardView card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />

            {/* Answer Controls on Lock Screen */}
            <View style={styles.controlsArea}>
              {isFlipped ? (
                <View style={styles.actionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cần học lại"
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.btnNo,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={markAsNotMemorized}
                  >
                    <Icon name="x" size={18} color={COLORS.errorLight} />
                    <Text style={styles.btnNoText}>Cần học lại</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Đã nhớ"
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.btnYes,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={markAsMemorized}
                  >
                    <Icon name="check" size={18} color={COLORS.text} strokeWidth={2.5} />
                    <Text style={styles.btnYesText}>Đã nhớ</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lật thẻ xem nghĩa"
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.btnFlip,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={flipCard}
                >
                  <Icon name="refresh" size={18} color={COLORS.text} />
                  <Text style={styles.btnFlipText}>Chạm để lật xem Value</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noCardsSection}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={32} color={COLORS.successLight} />
            </View>
            <Text style={styles.noCardsTitle}>Đã thuộc hết từ vựng!</Text>
            <Text style={styles.noCardsText}>
              Nhập thêm từ mới hoặc đặt lại tiến độ trong phần Cài đặt.
            </Text>
          </View>
        )}

        {/* Swipe/Press to Unlock Button at bottom */}
        <View style={styles.footerSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở khóa điện thoại"
            style={({ pressed }) => [
              styles.unlockButton,
              pressed && styles.unlockButtonPressed,
            ]}
            onPress={onUnlock}
          >
            <Icon name="unlock" size={18} color={COLORS.textSecondary} />
            <Text style={styles.unlockText}>Chạm để mở khóa màn hình</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.background,
    zIndex: 9999,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-top, 0px) + 16px)'
      : SPACING.lg) as any,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 20px)'
      : SPACING.xl) as any,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: SPACING.xs,
  },
  lockBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  timeText: {
    fontSize: TYPOGRAPHY.clock,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 64,
  },
  dateText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  controlsArea: {
    width: '100%',
    maxWidth: 440,
    marginTop: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.cta,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  btnNo: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  btnNoText: {
    color: COLORS.errorLight,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnYes: {
    backgroundColor: COLORS.success,
  },
  btnYesText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnFlip: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  btnFlipText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
  },
  btnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  noCardsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  noCardsTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  noCardsText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerSection: {
    alignItems: 'center',
    width: '100%',
    paddingTop: SPACING.md,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: TOUCH_TARGET.min,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unlockButtonPressed: {
    backgroundColor: COLORS.border,
    transform: [{ scale: 0.98 }],
  },
  unlockText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
