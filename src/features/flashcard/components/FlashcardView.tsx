import React from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, Animated } from 'react-native';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import { COLORS, SPACING } from '@/shared/constants/theme';

interface FlashcardViewProps {
  card: KeyValueItem;
  isFlipped: boolean;
  onFlip: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 380;

export const FlashcardView: React.FC<FlashcardViewProps> = ({ card, isFlipped, onFlip }) => {
  const rotateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateY, {
      toValue: isFlipped ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, rotateY]);

  const frontAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: rotateY.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
    backfaceVisibility: 'hidden' as const,
  };

  const backAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: rotateY.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
    backfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const displayValue = card.value.trim() || '(trống)';

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
          <Text style={styles.label}>KEY</Text>
          <Text style={styles.keyText}>{card.key}</Text>
          <Text style={styles.hint}>Chạm để xem Value</Text>
        </Animated.View>

        <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
          <Text style={[styles.label, { color: COLORS.primaryLight }]}>VALUE</Text>
          <Text style={styles.valueText}>{displayValue}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Lượt ôn: {card.reviewCount}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Chạm để xem Key</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginVertical: SPACING.md,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: COLORS.card,
  },
  backCard: {
    backgroundColor: '#1e293b',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  valueText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.successLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    position: 'absolute',
    bottom: SPACING.lg,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
