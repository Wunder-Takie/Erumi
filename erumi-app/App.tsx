import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { useState, useEffect } from 'react';
import { colors, SplashScreen, Navbar, NavbarMenu } from './design-system';
import { HomeScreen, SurnameSearchScreen, NameWizardScreen, NameBuilderScreen, NameChangeScreen, ProfileScreen, ReportScreen } from './screens';
import DemoScreen from './App.demo';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 커스텀 TabBar 컴포넌트 (기존 Navbar 활용)
const CustomTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  // React Navigation 라우트 이름을 NavbarMenu 타입으로 매핑
  const routeToMenu: Record<string, NavbarMenu> = {
    'Home': 'recommendation',
    'NameBuilder': 'builder',
    'NameChange': 'changeGuide',
    'Profile': 'profile',
  };

  const menuToRoute: Record<NavbarMenu, string> = {
    'recommendation': 'Home',
    'builder': 'NameBuilder',
    'changeGuide': 'NameChange',
    'profile': 'Profile',
  };

  const currentRouteName = state.routes[state.index].name;
  const activeMenu = routeToMenu[currentRouteName] || 'recommendation';

  const handleMenuPress = (menu: NavbarMenu) => {
    const routeName = menuToRoute[menu];
    navigation.navigate(routeName);
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      <Navbar activeMenu={activeMenu} onMenuPress={handleMenuPress} />
    </View>
  );
};

// 탭 네비게이터 (메인 화면들)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="NameBuilder" component={NameBuilderScreen} />
      <Tab.Screen name="NameChange" component={NameChangeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// 메인 앱 컴포넌트 (Native 스택 + 탭 구조)
const MainApp = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      {/* 이름 추천 위자드 (스와이프 비활성화, 버튼으로만 이동) */}
      <Stack.Screen
        name="NameWizard"
        component={NameWizardScreen}
        options={{ gestureEnabled: false }}
      />
      {/* 성씨 검색 화면 */}
      <Stack.Screen name="SurnameSearch" component={SurnameSearchScreen} />
      {/* 이름 리포트 화면 */}
      <Stack.Screen name="NameReport" component={ReportScreen} />
      {/* 숨겨진 데모 페이지 (개발용) */}
      <Stack.Screen name="Demo" component={DemoScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  const [showSplash, setShowSplash] = useState(true);

  // 폰트 로딩 완료 후 2초 뒤 스플래시 화면 숨김
  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // 폰트 로딩 중
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.background.accent.primary} />
      </View>
    );
  }

  // 스플래시 화면 표시
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MainApp />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default.highest,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default.highest,
  },
  tabBarContainer: {
    backgroundColor: colors.background.default.highest,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

