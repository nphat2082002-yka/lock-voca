import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { getStatisticsUseCase } from '@/shared/di/container';
import { KeyValueStatistics } from '@/domain/entities/Vocabulary';
import {
  COLORS,
  SPACING,
  RADII,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';

interface HomeDashboardProps {
  onStartLearning: () => void;
  refreshTrigger: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartLearning,
  refreshTrigger,
}) => {
  const [stats, setStats] = React.useState<KeyValueStatistics | null>(null);

  React.useEffect(() => {
    async function loadStats() {
      const data = await getStatisticsUseCase.execute();
      setStats(data);
    }
    loadStats();
  }, [refreshTrigger]);

  if (!stats) return null;

  const percentCompleted =
    stats.totalItems > 0
      ? Math.round((stats.memorizedItems / stats.totalItems) * 100)
      : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Xin chào!</Text>
        <Text style={styles.subtitle}>Cùng ôn tập và củng cố kiến thức hôm nay.</Text>
      </View>

      {/* Streak Banner */}
      <View style={styles.streakCard}>
        <View style={styles.streakIconCircle}>
          <Icon name="flame" size={24} color="#f59e0b" />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{stats.streakDays} ngày liên tiếp</Text>
          <Text style={styles.streakText}>Học mỗi ngày để giữ vững phong độ!</Text>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>TIẾN ĐỘ HỌC TẬP</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Tổng cặp từ</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={[styles.statNumber, { color: COLORS.successLight }]}>
              {stats.memorizedItems}
            </Text>
            <Text style={styles.statLabel}>Đã nhớ</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={[styles.statNumber, { color: COLORS.primaryLight }]}>
              {stats.unmemorizedItems}
            </Text>
            <Text style={styles.statLabel}>Đang học</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{percentCompleted}%</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Primary CTA Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bắt đầu học flashcard"
        style={({ pressed }) => [
          styles.btnStart,
          pressed && styles.btnStartPressed,
        ]}
        onPress={onStartLearning}
      >
        <Icon name="cards" size={20} color={COLORS.text} />
        <Text style={styles.btnText}>Bắt đầu ôn tập</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
      : 80) as any,
  },
  welcomeSection: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  streakIconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  streakText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  statCardPrimary: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  statNumber: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  btnStart: {
    minHeight: TOUCH_TARGET.cta,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginTop: SPACING.xs,
  },
  btnStartPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  btnText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
});
