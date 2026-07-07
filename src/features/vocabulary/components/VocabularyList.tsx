import React from 'react';
import { Alert, StyleSheet, Text, View, TextInput, FlatList, Pressable } from 'react-native';
import { getVocabularyListUseCase, rawVocabularyRepository } from '@/shared/di/container';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import { COLORS, SPACING } from '@/shared/constants/theme';

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
      <TextInput
        style={styles.searchBar}
        placeholder="Tìm theo Key hoặc Value..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Pressable
        style={[styles.deleteAllButton, list.length === 0 && styles.disabledButton]}
        onPress={deleteAllItems}
        disabled={list.length === 0}
      >
        <Text style={styles.deleteAllButtonText}>Xóa tất cả Key-Value</Text>
      </Pressable>

      <View style={styles.tabContainer}>
        {(['all', 'memorized', 'unmemorized'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, filter === tab && styles.activeTab]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
              {tab === 'all' ? 'TẤT CẢ' : tab === 'memorized' ? 'ĐÃ NHỚ' : 'ĐANG HỌC'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.keyLabel}>Key</Text>
            <Text style={styles.keyText}>{item.key}</Text>
            <Text style={styles.valueLabel}>Value</Text>
            <Text style={styles.valueText}>{item.value.trim() || '(trống)'}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.reviewCount}>Lượt ôn: {item.reviewCount}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  style={[
                    styles.statusBadge,
                    item.memorized ? styles.badgeMemorized : styles.badgeUnmemorized,
                  ]}
                  onPress={() => toggleStatus(item)}
                >
                  <Text style={styles.badgeText}>
                    {item.memorized ? 'Đã nhớ ✓' : 'Đang học'}
                  </Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => deleteItem(item)}>
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Không có dữ liệu Key-Value.</Text>
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
    padding: SPACING.md,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    fontSize: 15,
  },
  deleteAllButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  deleteAllButtonText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.45,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  keyLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMemorized: {
    backgroundColor: COLORS.success + '22',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badgeUnmemorized: {
    backgroundColor: COLORS.primary + '22',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deleteButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
});
