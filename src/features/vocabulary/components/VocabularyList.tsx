import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { getVocabularyListUseCase, rawVocabularyRepository } from '@/shared/di/container';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import {
  COLORS,
  SPACING,
  RADII,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/shared/constants/theme';
import { Icon } from '@/shared/components/Icon';

interface VocabularyListProps {
  refreshTrigger: number;
  onUpdate: () => void;
}

export const VocabularyList: React.FC<VocabularyListProps> = ({ refreshTrigger, onUpdate }) => {
  const [list, setList] = React.useState<KeyValueItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'memorized' | 'unmemorized'>('all');

  async function loadData() {
    const data = await getVocabularyListUseCase.execute(searchQuery);
    setList(data);
  }

  React.useEffect(() => {
    loadData();
  }, [searchQuery, refreshTrigger]);

  const filteredList = list.filter((item) => {
    if (filter === 'memorized') return item.memorized;
    if (filter === 'unmemorized') return !item.memorized;
    return true;
  });

  const toggleStatus = async (item: KeyValueItem) => {
    await rawVocabularyRepository.update(item.id, {
      memorized: !item.memorized,
    });
    onUpdate();
    loadData();
  };

  const deleteItem = (item: KeyValueItem) => {
    Alert.alert(
      'Xóa cặp Key-Value',
      `Bạn có chắc muốn xóa "${item.key}" khỏi từ điển không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await rawVocabularyRepository.delete(item.id);
            onUpdate();
            loadData();
          },
        },
      ]
    );
  };

  const deleteAllItems = () => {
    Alert.alert(
      'Xóa tất cả Key-Value',
      'Thao tác này sẽ xóa toàn bộ từ điển và không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await rawVocabularyRepository.deleteAll();
            onUpdate();
            loadData();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar with minimum 16px font size to prevent iOS Safari auto-zoom */}
      <View style={styles.searchWrapper}>
        <Icon name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Tìm kiếm theo Key hoặc Value..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa nội dung tìm kiếm"
            style={styles.clearSearchBtn}
            onPress={() => setSearchQuery('')}
          >
            <Icon name="x" size={16} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs with >= 44px Touch Target */}
      <View style={styles.tabContainer}>
        {(['all', 'memorized', 'unmemorized'] as const).map((tab) => {
          const isActive = filter === tab;
          const label =
            tab === 'all'
              ? `Tất cả (${list.length})`
              : tab === 'memorized'
              ? `Đã nhớ (${list.filter((i) => i.memorized).length})`
              : `Đang học (${list.filter((i) => !i.memorized).length})`;

          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.activeTab,
                pressed && styles.tabPressed,
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Delete All Action Button */}
      {list.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa toàn bộ từ vựng"
          style={({ pressed }) => [
            styles.deleteAllButton,
            pressed && styles.deleteAllButtonPressed,
          ]}
          onPress={deleteAllItems}
        >
          <Icon name="trash" size={15} color={COLORS.errorLight} />
          <Text style={styles.deleteAllButtonText}>Xóa tất cả Key-Value</Text>
        </Pressable>
      )}

      {/* Vocabulary List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.keyContainer}>
                <Text style={styles.keyLabel}>KEY</Text>
                <Text style={styles.keyText} numberOfLines={3}>
                  {item.key}
                </Text>
              </View>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>Ôn: {item.reviewCount}</Text>
              </View>
            </View>

            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>VALUE</Text>
              <Text style={styles.valueText} numberOfLines={4}>
                {item.value.trim() || '(trống)'}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Trạng thái: ${
                    item.memorized ? 'Đã nhớ' : 'Đang học'
                  }. Chạm để thay đổi.`}
                  style={({ pressed }) => [
                    styles.statusBadge,
                    item.memorized ? styles.badgeMemorized : styles.badgeUnmemorized,
                    pressed && styles.badgePressed,
                  ]}
                  onPress={() => toggleStatus(item)}
                >
                  <Icon
                    name={item.memorized ? 'check' : 'cards'}
                    size={14}
                    color={item.memorized ? COLORS.successLight : COLORS.primaryLight}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      item.memorized ? styles.badgeTextMemorized : styles.badgeTextUnmemorized,
                    ]}
                  >
                    {item.memorized ? 'Đã nhớ' : 'Đang học'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xóa ${item.key}`}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.deleteButtonPressed,
                  ]}
                  onPress={() => deleteItem(item)}
                >
                  <Icon name="trash" size={14} color={COLORS.errorLight} />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="book" size={40} color={COLORS.textSecondary} style={{ marginBottom: SPACING.sm }} />
            <Text style={styles.emptyTitle}>Chưa có từ vựng phù hợp</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? 'Không tìm thấy kết quả nào khớp với tìm kiếm.'
                : 'Thêm từ mới hoặc nhập file Excel ở mục Cài đặt.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    paddingLeft: 42,
    paddingRight: 42,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: TYPOGRAPHY.input, // Critical: 16px to prevent iOS Safari auto-zoom
    minHeight: TOUCH_TARGET.comfortable,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_TARGET.min, // 44px Apple HIG standard
    borderRadius: RADII.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  tabPressed: {
    opacity: 0.8,
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.primaryLight,
  },
  deleteAllButton: {
    minHeight: TOUCH_TARGET.min, // 44px
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: RADII.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  deleteAllButtonPressed: {
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
  },
  deleteAllButtonText: {
    color: COLORS.errorLight,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  keyContainer: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  keyLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  keyText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  valueContainer: {
    marginVertical: SPACING.xs,
  },
  valueLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  valueText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusBadge: {
    minHeight: TOUCH_TARGET.min, // 44px touch target Apple HIG
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeMemorized: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badgeUnmemorized: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgePressed: {
    opacity: 0.75,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
  badgeTextMemorized: {
    color: COLORS.successLight,
  },
  badgeTextUnmemorized: {
    color: COLORS.primaryLight,
  },
  deleteButton: {
    minHeight: TOUCH_TARGET.min, // 44px touch target Apple HIG
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonPressed: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: COLORS.errorLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
      : 80) as any,
  },
});
