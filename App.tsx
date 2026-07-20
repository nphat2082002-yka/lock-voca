import React from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { initializeLocalData } from './src/shared/utils/dbInit';
import { HomeDashboard } from './src/features/dashboard/components/HomeDashboard';
import { ActiveFlashcardScreen } from './src/features/flashcard/components/ActiveFlashcardScreen';
import { VocabularyList } from './src/features/vocabulary/components/VocabularyList';
import { SettingsScreen } from './src/features/settings/components/SettingsScreen';
import { LockScreenSimulator } from './src/features/lock-screen/components/LockScreenSimulator';
import { COLORS, SPACING } from './src/shared/constants/theme';

export default function App() {
  const [dataReady, setDataReady] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'home' | 'flashcards' | 'vocabulary' | 'settings'>('home');
  const [lockScreenActive, setLockScreenActive] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    async function init() {
      await initializeLocalData();
      setDataReady(true);
    }
    init();
  }, []);

  const triggerUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!dataReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang khởi tạo dữ liệu...</Text>
      </View>
    );
  }

  if (lockScreenActive) {
    return (
      <LockScreenSimulator
        onUnlock={() => {
          setLockScreenActive(false);
          triggerUpdate();
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboard
            onStartLearning={() => setActiveTab('flashcards')}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'flashcards':
        return <ActiveFlashcardScreen onUpdate={triggerUpdate} />;
      case 'vocabulary':
        return <VocabularyList refreshTrigger={refreshTrigger} onUpdate={triggerUpdate} />;
      case 'settings':
        return (
          <SettingsScreen
            onTriggerLockScreen={() => setLockScreenActive(true)}
            onUpdate={triggerUpdate}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Tổng quan';
      case 'flashcards':
        return 'Học Key-Value';
      case 'vocabulary':
        return 'Danh sách Key-Value';
      case 'settings':
        return 'Cài đặt';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Tab Navigation Bar */}
      <View style={styles.tabBar}>
        {([
          { id: 'home', icon: '🏠', label: 'Trang chủ' },
          { id: 'flashcards', icon: '🃏', label: 'Học' },
          { id: 'vocabulary', icon: '📚', label: 'Danh sách' },
          { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
        ] as const).map((tab) => (
          <Pressable
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabIcon]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: 16,
  },
  header: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingBottom: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: COLORS.primaryLight,
  },
});
