import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { rawVocabularyRepository } from '@/shared/di/container';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import {
  COLORS,
  SPACING,
  RADII,
  TYPOGRAPHY,
} from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';

interface QuizScreenProps {
  onUpdate: () => void;
  refreshTrigger: number;
}

interface QuizOption {
  key: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  targetItem: KeyValueItem;
  questionValue: string;
  options: QuizOption[];
  correctKey: string;
}

// Fallback distractors if dictionary has fewer than 4 items
const FALLBACK_DISTRACTORS = [
  'terminate',
  'mandatory',
  'allocate',
  'compatible',
  'suspend',
  'precedent',
  'jurisdiction',
  'legislation',
];

export const QuizScreen: React.FC<QuizScreenProps> = ({ onUpdate, refreshTrigger }) => {
  const [loading, setLoading] = React.useState(true);
  const [allItems, setAllItems] = React.useState<KeyValueItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState<QuizQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = React.useState(false);
  const [sessionScore, setSessionScore] = React.useState({ correct: 0, wrong: 0, streak: 0 });

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const autoNextTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastTargetIdRef = React.useRef<string | null>(null);

  // Clear auto next timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // Initial load
  React.useEffect(() => {
    async function init() {
      setLoading(true);
      const items = await rawVocabularyRepository.getAll();
      setAllItems(items);
      generateNewQuestion(items);
      setLoading(false);
    }
    init();
  }, []);

  // Refresh data in background when dictionary updates outside Quiz screen
  React.useEffect(() => {
    async function syncItems() {
      const fresh = await rawVocabularyRepository.getAll();
      setAllItems(fresh);
      if (!currentQuestion && fresh.length > 0) {
        generateNewQuestion(fresh);
      }
    }
    syncItems();
  }, [refreshTrigger]);

  // Generate a random 4-choice quiz question continuously without end
  const generateNewQuestion = (items: KeyValueItem[]) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    setSelectedOptionIndex(null);
    setHasAnswered(false);

    if (items.length === 0) {
      setCurrentQuestion(null);
      return;
    }

    // Unlimited continuous questions:
    // Prioritize unmemorized items; if all are memorized, continuously quiz on all items
    const unmemorized = items.filter((item) => !item.memorized);
    const questionPool = unmemorized.length > 0 ? unmemorized : items;

    // Avoid repeating the exact same word consecutively if pool has more than 1 item
    const availableItems =
      questionPool.length > 1
        ? questionPool.filter((item) => item.id !== lastTargetIdRef.current)
        : questionPool;

    // Pick target: prefer lowest review count for spaced repetition, then random
    const minReviews = Math.min(...availableItems.map((i) => i.reviewCount));
    const priorityItems = availableItems.filter((i) => i.reviewCount === minReviews);
    const target =
      priorityItems[Math.floor(Math.random() * priorityItems.length)] ||
      availableItems[Math.floor(Math.random() * availableItems.length)] ||
      questionPool[0];

    lastTargetIdRef.current = target.id;

    // Distractor generation: pick 3 distinct keys from other items
    const otherItems = items.filter(
      (i) => i.id !== target.id && i.key.trim().toLowerCase() !== target.key.trim().toLowerCase()
    );
    const shuffledOthers = [...otherItems].sort(() => Math.random() - 0.5);

    const distractorKeys = new Set<string>([target.key.trim().toLowerCase()]);
    const distractors: string[] = [];

    for (const other of shuffledOthers) {
      const normKey = other.key.trim().toLowerCase();
      if (!distractorKeys.has(normKey)) {
        distractorKeys.add(normKey);
        distractors.push(other.key);
        if (distractors.length === 3) break;
      }
    }

    // If fewer than 3 distractors exist in user dictionary, use fallback common words
    if (distractors.length < 3) {
      for (const fallback of FALLBACK_DISTRACTORS) {
        const normKey = fallback.trim().toLowerCase();
        if (!distractorKeys.has(normKey)) {
          distractorKeys.add(normKey);
          distractors.push(fallback);
          if (distractors.length === 3) break;
        }
      }
    }

    // Build the 4 options (1 correct + 3 distractors)
    const optionList: QuizOption[] = [
      { key: target.key, isCorrect: true },
      ...distractors.map((k) => ({ key: k, isCorrect: false })),
    ];

    // Shuffle options randomly
    const shuffledOptions = optionList.sort(() => Math.random() - 0.5);

    // Subtle fade-in animation
    fadeAnim.setValue(0.6);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setCurrentQuestion({
      targetItem: target,
      questionValue: target.value.trim() || target.key,
      options: shuffledOptions,
      correctKey: target.key,
    });
  };

  // Handle user selecting an answer
  const handleSelectOption = async (option: QuizOption, index: number) => {
    if (hasAnswered || !currentQuestion) return;

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    setSelectedOptionIndex(index);
    setHasAnswered(true);

    const isCorrect = option.isCorrect;
    const target = currentQuestion.targetItem;

    if (isCorrect) {
      // Correct answer: mark memorized, increment review count
      await rawVocabularyRepository.update(target.id, {
        memorized: true,
        reviewCount: target.reviewCount + 1,
        lastReviewedAt: new Date(),
      });

      setSessionScore((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        streak: prev.streak + 1,
      }));

      // Requirements: Đúng là tự next sang câu tiếp theo (hiển thị 700ms để người dùng thấy đáp án đúng)
      autoNextTimerRef.current = setTimeout(async () => {
        const freshItems = await rawVocabularyRepository.getAll();
        setAllItems(freshItems);
        generateNewQuestion(freshItems);
        onUpdate();
      }, 700);
    } else {
      // Wrong answer: keep unmemorized, increment review count
      await rawVocabularyRepository.update(target.id, {
        memorized: false,
        reviewCount: target.reviewCount + 1,
        lastReviewedAt: new Date(),
      });

      setSessionScore((prev) => ({
        ...prev,
        wrong: prev.wrong + 1,
        streak: 0,
      }));

      // Requirements: Sai thì dừng lại khoảng 2 giây để xem, sau đó tự next sang câu tiếp theo
      autoNextTimerRef.current = setTimeout(async () => {
        const freshItems = await rawVocabularyRepository.getAll();
        setAllItems(freshItems);
        generateNewQuestion(freshItems);
        onUpdate();
      }, 2000);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải câu hỏi quiz...</Text>
      </View>
    );
  }

  // State: No vocabulary items in dictionary at all
  if (allItems.length === 0 || !currentQuestion) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <View style={styles.iconCircleEmpty}>
          <Icon name="book" size={36} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có từ vựng nào</Text>
        <Text style={styles.emptyDesc}>
          Hãy vào phần Cài đặt và nhập file Excel để bắt đầu làm bài quiz trắc nghiệm.
        </Text>
      </ScrollView>
    );
  }

  const unmemorizedCount = allItems.filter((i) => !i.memorized).length;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Top Session Stats Bar */}
      <View style={styles.statusBar}>
        <View style={styles.badgeLeft}>
          <Icon name="quiz" size={14} color={COLORS.accent} />
          <Text style={styles.badgeLeftText}>
            {unmemorizedCount > 0 ? `CÒN LẠI: ${unmemorizedCount}` : 'ÔN LUYỆN LIÊN TỤC'}
          </Text>
        </View>

        <View style={styles.statsRight}>
          {sessionScore.streak > 1 && (
            <View style={styles.streakBadge}>
              <Icon name="flame" size={14} color="#f59e0b" />
              <Text style={styles.streakText}>{sessionScore.streak}</Text>
            </View>
          )}
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              Đúng: <Text style={{ color: COLORS.successLight }}>{sessionScore.correct}</Text>
              {'  '}|{'  '}
              Sai: <Text style={{ color: COLORS.errorLight }}>{sessionScore.wrong}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Main Question Card (Shows VALUE) */}
      <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
        <View style={styles.questionCardHeader}>
          <Text style={styles.questionLabel}>NGHĨA / VALUE</Text>
          <Text style={styles.questionHint}>Chọn Key tiếng Anh tương ứng</Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.questionValue}</Text>
      </Animated.View>

      {/* 4 Answer Options (Shows KEY) */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const letter = letters[index] || '';
          const isSelected = selectedOptionIndex === index;
          const isCorrectAnswer = option.isCorrect;

          const isAnswerCorrect = hasAnswered && isCorrectAnswer;
          const isAnswerWrong = hasAnswered && isSelected && !isCorrectAnswer;
          const isAnswerDimmed = hasAnswered && !isCorrectAnswer && !isSelected;

          return (
            <Pressable
              key={`${option.key}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Đáp án ${letter}: ${option.key}`}
              disabled={hasAnswered}
              style={({ pressed }) => [
                styles.optionCard,
                isAnswerCorrect && styles.optionCorrect,
                isAnswerWrong && styles.optionWrong,
                isAnswerDimmed && styles.optionDimmed,
                pressed && !hasAnswered && styles.optionPressed,
              ]}
              onPress={() => handleSelectOption(option, index)}
            >
              <View
                style={[
                  styles.letterBadge,
                  isAnswerCorrect && styles.letterBadgeCorrect,
                  isAnswerWrong && styles.letterBadgeWrong,
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    isAnswerCorrect && styles.letterTextCorrect,
                    isAnswerWrong && styles.letterTextWrong,
                  ]}
                >
                  {letter}
                </Text>
              </View>

              <Text
                style={[
                  styles.optionText,
                  isAnswerCorrect && styles.optionTextCorrect,
                  isAnswerWrong && styles.optionTextWrong,
                ]}
                numberOfLines={2}
              >
                {option.key}
              </Text>

              {/* Status icon indicators after answered */}
              {hasAnswered && (
                <View style={styles.optionEndIcon}>
                  {isCorrectAnswer && (
                    <Icon name="check" size={18} color={COLORS.successLight} strokeWidth={2.5} />
                  )}
                  {isSelected && !isCorrectAnswer && (
                    <Icon name="x" size={18} color={COLORS.errorLight} strokeWidth={2.5} />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Answer Feedback (No button - Auto advances) */}
      {hasAnswered && (
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackMessage}>
            {selectedOptionIndex !== null &&
            currentQuestion.options[selectedOptionIndex]?.isCorrect ? (
              <View style={styles.feedbackRow}>
                <Icon name="check" size={18} color={COLORS.successLight} strokeWidth={2.5} />
                <Text style={styles.feedbackTextSuccess}>Chính xác!</Text>
              </View>
            ) : (
              <View style={styles.feedbackRow}>
                <Icon name="x" size={18} color={COLORS.errorLight} strokeWidth={2.5} />
                <Text style={styles.feedbackTextError}>
                  Chưa đúng! Đáp án đúng là:{' '}
                  <Text style={{ fontWeight: '800', color: COLORS.text }}>
                    {currentQuestion.correctKey}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
      : 80) as any,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.base,
    marginTop: SPACING.md,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeLeftText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: '#f59e0b',
  },
  scoreBadge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII['2xl'],
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  questionLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 1.5,
  },
  questionHint: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  questionText: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  optionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionCard: {
    minHeight: 56, // Touch target >= 44px (Apple HIG standard)
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  optionPressed: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    transform: [{ scale: 0.99 }],
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.success,
  },
  optionWrong: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: COLORS.error,
  },
  optionDimmed: {
    opacity: 0.45,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: RADII.full,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '800',
    color: COLORS.text,
  },
  letterBadgeCorrect: {
    backgroundColor: COLORS.success,
  },
  letterTextCorrect: {
    color: COLORS.text,
  },
  letterBadgeWrong: {
    backgroundColor: COLORS.error,
  },
  letterTextWrong: {
    color: COLORS.text,
  },
  optionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionTextCorrect: {
    color: COLORS.successLight,
  },
  optionTextWrong: {
    color: COLORS.errorLight,
  },
  optionEndIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackSection: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  feedbackMessage: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  feedbackTextSuccess: {
    color: COLORS.successLight,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
  feedbackTextError: {
    color: COLORS.errorLight,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
      : 80) as any,
  },
  iconCircleEmpty: {
    width: 64,
    height: 64,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
