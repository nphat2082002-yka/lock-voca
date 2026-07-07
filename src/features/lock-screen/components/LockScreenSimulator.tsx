import React from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useFlashcardStore } from '@/features/flashcard/stores/flashcardStore';
import { FlashcardView } from '@/features/flashcard/components/FlashcardView';
import { COLORS, SPACING } from '@/shared/constants/theme';

interface LockScreenSimulatorProps {
  onUnlock: () => void;
}

export const LockScreenSimulator: React.FC<LockScreenSimulatorProps> = ({ onUnlock }) => {
  const { currentCard, isFlipped, loadNextCard, flipCard, markAsMemorized, markAsNotMemorized } =
    useFlashcardStore();
  const [time, setTime] = React.useState('');
  const [date, setDate] = React.useState('');

  React.useEffect(() => {
    // Load active card
    loadNextCard();

    // Update time
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
    <View style={styles.container}>
      {/* Time & Date Header */}
      <View style={styles.header}>
        <Text style={styles.lockIcon}>🔒 MÔ PHỎNG MÀN HÌNH KHÓA</Text>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Main Flashcard Card */}
      {currentCard ? (
        <View style={styles.cardContainer}>
          <FlashcardView card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />

          {/* Controls */}
          {isFlipped && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnNo]}
                onPress={markAsNotMemorized}
              >
                <Text style={styles.btnText}>Cần học thêm ❌</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnYes]}
                onPress={markAsMemorized}
              >
                <Text style={styles.btnText}>Đã nhớ ✓</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noCards}>
          <Text style={styles.noCardsText}>
            🎉 Đã nhớ hết! Nhập thêm cặp Key-Value trong Cài đặt.
          </Text>
        </View>
      )}

      {/* Swipe/Press to Unlock */}
      <Pressable style={styles.unlockButton} onPress={onUnlock}>
        <Text style={styles.unlockText}>🔓 Chạm để mở khóa điện thoại</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
    zIndex: 9999,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  lockIcon: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  time: {
    fontSize: 54,
    fontWeight: '800',
    color: COLORS.text,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
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
  noCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noCardsText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  unlockButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unlockText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
