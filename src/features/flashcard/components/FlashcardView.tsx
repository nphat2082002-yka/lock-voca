import React from 'react';
import { StyleSheet, Text, View, Pressable, Animated, useWindowDimensions } from 'react-native';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import { COLORS, SPACING, RADII, TYPOGRAPHY } from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';
import { useTextToSpeech } from '@/shared/hooks/useTextToSpeech';

interface FlashcardViewProps {
  card: KeyValueItem;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ card, isFlipped, onFlip }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const rotateY = React.useRef(new Animated.Value(0)).current;
  const isAudioPressingRef = React.useRef(false);

  // Text-to-speech hook
  const { isSpeaking, speak, stop, isSupported } = useTextToSpeech();

  // Cancel speech whenever the active card changes
  React.useEffect(() => {
    stop();
  }, [card.id, stop]);

  // Responsive sizing based on viewport height & width
  const cardWidth = Math.min(Math.max(screenWidth - 32, 280), 440);
  const cardHeight = screenHeight < 680 ? Math.max(Math.min(screenHeight * 0.42, 300), 240) : 340;

  React.useEffect(() => {
    Animated.timing(rotateY, {
      toValue: isFlipped ? 180 : 0,
      duration: 350,
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

  // Safely intercept audio press to completely prevent card flip
  const handleAudioPressIn = (e: any) => {
    isAudioPressingRef.current = true;
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
      e.nativeEvent.stopPropagation();
    }
  };

  const handleAudioPress = (e: any) => {
    isAudioPressingRef.current = true;
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
      e.nativeEvent.stopPropagation();
    }
    setTimeout(() => {
      isAudioPressingRef.current = false;
    }, 300);

    if (isSpeaking) {
      stop();
    } else {
      speak(card.key);
    }
  };

  const handleCardPress = (e: any) => {
    if (isAudioPressingRef.current) {
      isAudioPressingRef.current = false;
      return;
    }
    const target = e?.target || e?.nativeEvent?.target;
    if (target && typeof target.closest === 'function') {
      if (
        target.closest('[data-testid="speaker-button"]') ||
        target.closest('[aria-label*="phát âm"]') ||
        target.closest('[aria-label*="Phát âm"]')
      ) {
        return;
      }
    }
    onFlip();
  };

  return (
    <Pressable
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`Thẻ từ vựng: ${card.key}. Chạm để lật.`}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth, height: cardHeight },
        pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.cardWrapper}>
        {/* Front of Flashcard (Key) */}
        <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>KEY</Text>
            <View style={styles.headerRight}>
              {isSupported && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isSpeaking ? 'Dừng phát âm' : 'Phát âm từ vựng'}
                  testID="speaker-button"
                  onPress={handleAudioPress}
                  onPressIn={handleAudioPressIn}
                  style={({ pressed }) => [
                    styles.speakerBtn,
                    isSpeaking && styles.speakerBtnActive,
                    pressed && styles.speakerBtnPressed,
                  ]}
                >
                  <Icon
                    name={isSpeaking ? 'volume-2' : 'volume'}
                    size={20}
                    color={isSpeaking ? COLORS.successLight : COLORS.accent}
                  />
                </Pressable>
              )}
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>Ôn: {card.reviewCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bodyContent}>
            <Text style={styles.keyText} numberOfLines={4} adjustsFontSizeToFit>
              {card.key}
            </Text>

            {isSupported && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSpeaking ? 'Dừng phát âm' : 'Phát âm từ vựng'}
                testID="speaker-button"
                onPress={handleAudioPress}
                onPressIn={handleAudioPressIn}
                style={({ pressed }) => [
                  styles.pronouncePill,
                  isSpeaking && styles.pronouncePillActive,
                  pressed && styles.pronouncePillPressed,
                ]}
              >
                <Icon
                  name={isSpeaking ? 'volume-2' : 'volume'}
                  size={18}
                  color={isSpeaking ? COLORS.successLight : COLORS.primaryLight}
                />
                <Text
                  style={[
                    styles.pronouncePillText,
                    isSpeaking && styles.pronouncePillTextActive,
                  ]}
                >
                  {isSpeaking ? 'Đang phát âm...' : 'Nghe phát âm'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Icon name="refresh" size={14} color={COLORS.textSecondary} />
            <Text style={styles.hint}>Chạm để lật xem Value</Text>
          </View>
        </Animated.View>

        {/* Back of Flashcard (Value) */}
        <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { color: COLORS.primaryLight }]}>VALUE</Text>
            <View style={styles.headerRight}>
              {isSupported && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isSpeaking ? 'Dừng phát âm' : 'Phát âm từ vựng'}
                  testID="speaker-button"
                  onPress={handleAudioPress}
                  onPressIn={handleAudioPressIn}
                  style={({ pressed }) => [
                    styles.speakerBtn,
                    isSpeaking && styles.speakerBtnActive,
                    pressed && styles.speakerBtnPressed,
                  ]}
                >
                  <Icon
                    name={isSpeaking ? 'volume-2' : 'volume'}
                    size={20}
                    color={isSpeaking ? COLORS.successLight : COLORS.primaryLight}
                  />
                </Pressable>
              )}
              <View style={[styles.reviewBadge, styles.reviewBadgeValue]}>
                <Text style={[styles.reviewBadgeText, { color: COLORS.successLight }]}>
                  {card.memorized ? 'Đã nhớ' : 'Đang học'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bodyContent}>
            <Text style={styles.valueText} numberOfLines={5} adjustsFontSizeToFit>
              {displayValue}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Icon name="refresh" size={14} color={COLORS.textSecondary} />
            <Text style={styles.hint}>Chạm để lật xem Key</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: SPACING.sm,
    maxWidth: '100%',
  },
  containerPressed: {
    transform: [{ scale: 0.985 }],
  },
  cardWrapper: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: RADII['2xl'],
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  frontCard: {
    backgroundColor: COLORS.card,
  },
  backCard: {
    backgroundColor: COLORS.cardElevated,
    borderColor: COLORS.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.successLight,
  },
  speakerBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  reviewBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewBadgeValue: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  reviewBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  bodyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  keyText: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  pronouncePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: RADII.full,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  pronouncePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: COLORS.successLight,
  },
  pronouncePillPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  pronouncePillText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 0.3,
  },
  pronouncePillTextActive: {
    color: COLORS.successLight,
  },
  valueText: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: '700',
    color: COLORS.successLight,
    textAlign: 'center',
    lineHeight: 34,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: SPACING.xs,
  },
  hint: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
