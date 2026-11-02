import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
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

interface SettingsScreenProps {
  onTriggerLockScreen: () => void;
  onUpdate: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onTriggerLockScreen,
  onUpdate,
}) => {
  const [importing, setImporting] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const resetProgress = async () => {
    Alert.alert(
      'Đặt lại tiến độ',
      'Bạn có chắc chắn muốn đặt lại toàn bộ từ vựng về trạng thái "Đang học" và số lượt ôn về 0?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt lại',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              await rawVocabularyRepository.resetAllProgress();
              onUpdate();
              Alert.alert('Thành công', 'Đã đặt lại tiến độ học.');
            } catch (e) {
              console.error(e);
              Alert.alert('Lỗi', 'Không thể đặt lại tiến độ học.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Section 1: Excel Import */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <Icon name="upload" size={16} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>NHẬP DỮ LIỆU TỪ VỰNG</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Tải file Excel (.xlsx) chứa 2 cột Key và Value để nhập hàng loạt thẻ học mới.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nhập từ vựng từ file Excel"
          style={({ pressed }) => [
            styles.actionButton,
            styles.btnImport,
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
              <Text style={styles.btnImportText}>Chọn file Excel (.xlsx)</Text>
            </>
          )}
        </Pressable>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Mẫu file: Cột A là Key (từ vựng/khái niệm), Cột B là Value (nghĩa/giải thích).
          </Text>
        </View>
      </View>

      {/* Section 2: Lock Screen Simulator */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <Icon name="lock" size={16} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>MÔ PHỎNG MÀN HÌNH KHÓA</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Trải nghiệm tính năng ôn tập từ vựng ngay khi mở màn hình điện thoại.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở màn hình mô phỏng khóa"
          style={({ pressed }) => [
            styles.actionButton,
            styles.btnSimulate,
            pressed && styles.btnPressed,
          ]}
          onPress={onTriggerLockScreen}
        >
          <Icon name="lock" size={18} color={COLORS.text} />
          <Text style={styles.btnSimulateText}>Bật mô phỏng màn hình khóa</Text>
        </Pressable>
      </View>

      {/* Section 3: Data Management */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <Icon name="refresh" size={16} color={COLORS.errorLight} />
          <Text style={[styles.sectionTitle, { color: COLORS.errorLight }]}>
            QUẢN LÝ TIẾN ĐỘ
          </Text>
        </View>
        <Text style={styles.sectionDesc}>
          Đặt lại toàn bộ từ vựng đã nhớ về trạng thái "Đang học" để bắt đầu chu kỳ ôn tập mới.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đặt lại tiến độ học"
          style={({ pressed }) => [
            styles.actionButton,
            styles.btnReset,
            resetting && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
          onPress={resetProgress}
          disabled={resetting}
        >
          {resetting ? (
            <ActivityIndicator color={COLORS.errorLight} />
          ) : (
            <>
              <Icon name="refresh" size={18} color={COLORS.errorLight} />
              <Text style={styles.btnResetText}>Đặt lại toàn bộ tiến độ học</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
      : 80) as any,
    gap: SPACING.md,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  sectionDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  actionButton: {
    minHeight: TOUCH_TARGET.cta,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  btnImport: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnImportText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnSimulate: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnSimulateText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  btnReset: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  btnResetText: {
    color: COLORS.errorLight,
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
  infoBox: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderRadius: RADII.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
