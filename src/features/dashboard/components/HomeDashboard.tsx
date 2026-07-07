import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { getStatisticsUseCase } from '@/shared/di/container';
import { KeyValueStatistics } from '@/domain/entities/Vocabulary';
import { COLORS, SPACING } from '@/shared/constants/theme';

interface HomeDashboardProps {
  onStartLearning: () => void;
  refreshTrigger: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onStartLearning, refreshTrigger }) => {
  const [stats, setStats] = React.useState<KeyValueStatistics | null>(null);

  React.useEffect(() => {
    async function loadStats() {
      const data = await getStatisticsUseCase.execute();
      setStats(data);
    }
    loadStats();
  }, [refreshTrigger]);

  if (!stats) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Xin chào! 👋</Text>
      <Text style={styles.subtitle}>Ôn tập các cặp Key-Value hôm nay.</Text>

      <View style={styles.streakCard}>
        <Text style={styles.streakCount}>🔥 {stats.streakDays} ngày liên tiếp</Text>
        <Text style={styles.streakText}>Học mỗi ngày để duy trì chuỗi học!</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Tổng cặp</Text>
        </View>

        <View style={[styles.statCard, { borderColor: COLORS.success }]}>
          <Text style={[styles.statNumber, { color: COLORS.successLight }]}>
            {stats.memorizedItems}
          </Text>
          <Text style={styles.statLabel}>Đã nhớ</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: COLORS.primaryLight }]}>
          <Text style={[styles.statNumber, { color: COLORS.primaryLight }]}>
            {stats.unmemorizedItems}
          </Text>
          <Text style={styles.statLabel}>Đang học</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.totalItems > 0
              ? Math.round((stats.memorizedItems / stats.totalItems) * 100)
              : 0}
            %
          </Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      <Pressable style={styles.btnStart} onPress={onStartLearning}>
        <Text style={styles.btnText}>Bắt đầu học 🃏</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  streakText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  btnStart: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
