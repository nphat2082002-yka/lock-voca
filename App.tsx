import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import { initializeLocalData } from './src/shared/utils/dbInit';
import { HomeDashboard } from './src/features/dashboard/components/HomeDashboard';
import { ActiveFlashcardScreen } from './src/features/flashcard/components/ActiveFlashcardScreen';
import { QuizScreen } from './src/features/quiz/components/QuizScreen';
import { VocabularyList } from './src/features/vocabulary/components/VocabularyList';
import { SettingsScreen } from './src/features/settings/components/SettingsScreen';
import { LockScreenSimulator } from './src/features/lock-screen/components/LockScreenSimulator';
import { Icon, IconName } from './src/shared/components/Icon';
import {
  COLORS,
  SPACING,
  RADII,
  TOUCH_TARGET,
  LAYOUT,
  TYPOGRAPHY,
} from './src/shared/constants/theme';

const NAV_TABS = [
  { id: 'home', icon: 'home', label: 'Trang chủ' },
  { id: 'flashcards', icon: 'cards', label: 'Học' },
  { id: 'quiz', icon: 'quiz', label: 'Quiz' },
  { id: 'vocabulary', icon: 'book', label: 'Từ vựng' },
  { id: 'settings', icon: 'settings', label: 'Cài đặt' },
] as const;

type TabId = (typeof NAV_TABS)[number]['id'];

export default function App() {
  const [dataReady, setDataReady] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabId>('home');
  const [lockScreenActive, setLockScreenActive] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Animation values for smooth tab transitions
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Track activeTab in a ref so gesture callbacks always read the freshest value
  const activeTabRef = React.useRef<TabId>(activeTab);
  activeTabRef.current = activeTab;

  const lastSwitchTime = React.useRef(0);
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

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

  // Smooth animated tab transition
  const changeTab = React.useCallback(
    (newTab: TabId, direction?: 'next' | 'prev') => {
      if (newTab === activeTabRef.current) return;

      const fromIndex = NAV_TABS.findIndex((t) => t.id === activeTabRef.current);
      const toIndex = NAV_TABS.findIndex((t) => t.id === newTab);
      const dir = direction || (toIndex > fromIndex ? 'next' : 'prev');

      // Slide in from direction of motion
      const enterOffset = dir === 'next' ? 36 : -36;
      slideAnim.setValue(enterOffset);
      fadeAnim.setValue(0.75);

      setActiveTab(newTab);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [slideAnim, fadeAnim]
  );

  // Switch to next or previous tab based on swipe direction
  const switchTabDirection = React.useCallback(
    (direction: 'next' | 'prev') => {
      const now = Date.now();
      // Debounce threshold to prevent rapid double-skipping
      if (now - lastSwitchTime.current < 350) return;
      lastSwitchTime.current = now;

      const currentIndex = NAV_TABS.findIndex((t) => t.id === activeTabRef.current);
      if (direction === 'next' && currentIndex < NAV_TABS.length - 1) {
        changeTab(NAV_TABS[currentIndex + 1].id, 'next');
      } else if (direction === 'prev' && currentIndex > 0) {
        changeTab(NAV_TABS[currentIndex - 1].id, 'prev');
      }
    },
    [changeTab]
  );

  // PanResponder to handle swiping across tabs
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Only claim if horizontal movement dominates vertical movement
        return (
          Math.abs(gestureState.dx) > 25 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        // Capture only when user clearly committed to a horizontal swipe
        return (
          Math.abs(gestureState.dx) > 30 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.8
        );
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const isHorizontal =
          Math.abs(gestureState.dx) > 40 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;

        if (isHorizontal) {
          if (gestureState.dx < 0) {
            // Swiped left (finger moves right-to-left) -> next tab
            switchTabDirection('next');
          } else {
            // Swiped right (finger moves left-to-right) -> previous tab
            switchTabDirection('prev');
          }
        }
      },
    })
  ).current;

  // Additional web touch gesture handlers to guarantee smooth swiping on iOS Safari
  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent?.touches?.[0];
    if (touch) {
      touchStartRef.current = {
        x: touch.pageX ?? touch.clientX,
        y: touch.pageY ?? touch.clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: any) => {
    if (!touchStartRef.current) return;
    const touch = e.nativeEvent?.changedTouches?.[0];
    if (touch) {
      const endX = touch.pageX ?? touch.clientX;
      const endY = touch.pageY ?? touch.clientY;
      const dx = endX - touchStartRef.current.x;
      const dy = endY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      // Swiped horizontally within 800ms
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
        if (dx < 0) {
          switchTabDirection('next');
        } else {
          switchTabDirection('prev');
        }
      }
    }
    touchStartRef.current = null;
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
            onStartLearning={() => changeTab('flashcards', 'next')}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'flashcards':
        return <ActiveFlashcardScreen onUpdate={triggerUpdate} />;
      case 'quiz':
        return <QuizScreen onUpdate={triggerUpdate} refreshTrigger={refreshTrigger} />;
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
        return 'Học Flashcard';
      case 'quiz':
        return 'Luyện tập Quiz';
      case 'vocabulary':
        return 'Danh sách từ vựng';
      case 'settings':
        return 'Cài đặt';
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.appContainer}>
        {/* Header with Safe Area Top padding */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>

        {/* Swipeable Main Content Area with smooth transition */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
          {...panResponder.panHandlers}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderContent()}
        </Animated.View>

        {/* Bottom Tab Navigation Bar with Safe Area Bottom */}
        <View style={styles.tabBar}>
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                style={({ pressed }) => [
                  styles.tabButton,
                  pressed && styles.tabButtonPressed,
                ]}
                onPress={() => changeTab(tab.id)}
              >
                {isActive && <View style={styles.activeTabIndicator} />}
                <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                  <Icon
                    name={tab.icon}
                    size={19}
                    color={isActive ? COLORS.primaryLight : COLORS.textSecondary}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                </View>
                <Text
                  style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
    overflow: 'hidden',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    backgroundColor: COLORS.background,
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: TYPOGRAPHY.base,
  },
  header: {
    paddingTop: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-top, 0px) + 12px)'
      : SPACING.md) as any,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    minHeight: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 64px)'
      : 64) as any,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xs,
    paddingBottom: (Platform.OS === 'web'
      ? 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
      : 8) as any,
    zIndex: 50,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    minHeight: TOUCH_TARGET.min,
    minWidth: TOUCH_TARGET.min,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  activeTabIndicator: {
    position: 'absolute',
    top: -SPACING.xs,
    width: 24,
    height: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.full,
  },
  iconWrapper: {
    width: 28,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.sm,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tabLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
});
