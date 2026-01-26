import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useState, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Icon, Logo, Navbar, NavbarMenu, Topbar, TopbarItem, SelectItem, Pagination, SearchInput, SelectionInput, TextArea, SyllableInput, Dialog, DialogItem, colors } from './design-system';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  const handlePress = (label: string) => {
    Alert.alert('Button Pressed', `"${label}" 버튼이 눌렸습니다!`);
  };

  const [activeMenu, setActiveMenu] = useState<NavbarMenu>('recommendation');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [syllableValue, setSyllableValue] = useState('');
  const [selectedHanja, setSelectedHanja] = useState<{ hanja: string; meaning: string } | null>(null);
  const [isEditingSyllable, setIsEditingSyllable] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const prevHanjaRef = useRef<{ hanja: string; meaning: string } | null>(null);

  // Zodiac time options
  const zodiacOptions = [
    '자시 (23:30~01:30)',
    '축시 (01:30~03:30)',
    '인시 (03:30~05:30)',
    '므시 (05:30~07:30)',
    '진시 (07:30~09:30)',
    '사시 (09:30~11:30)',
    '오시 (11:30~13:30)',
    '미시 (13:30~15:30)',
    '신시 (15:30~17:30)',
    '유시 (17:30~19:30)',
    '술시 (19:30~21:30)',
    '해시 (21:30~23:30)',
    '모름',
  ];

  // Mock search results for SyllableInput demo
  const hanjaResults = [
    { korean: '아', hanja: '玖', meaning: '심오할 아' },
    { korean: '라', hanja: '羅', meaning: '비단 라' },
    { korean: '하', hanja: '河', meaning: '강 하' },
  ];

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.background.accent.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Erumi Design System</Text>

      {/* === NEW COMPONENTS TEST AREA (add new components here) === */}

      {/* Logo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logo</Text>
        <View style={styles.logoRow}>
          <Logo size="medium" />
        </View>
        <View style={styles.logoRow}>
          <Logo size="small" />
        </View>
      </View>

      {/* Navbar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navbar (Bottom Navigation)</Text>
        <View style={styles.navbarContainer}>
          <Navbar activeMenu={activeMenu} onMenuPress={setActiveMenu} />
        </View>
        <Text style={styles.navbarHint}>Active: {activeMenu}</Text>
      </View>

      {/* Topbar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topbar (location=page)</Text>
        <View style={styles.topbarContainer}>
          <Topbar
            location="page"
            title="기본정보"
            leadingItems={
              <TopbarItem
                status="icon"
                icon={<Icon name="arrowLeft" size={24} color={colors.primitives.sand[600]} />}
                onPress={() => Alert.alert('Back')}
              />
            }
            trailingItems={
              <TopbarItem
                status="label"
                label="처음으로"
                onPress={() => Alert.alert('처음으로')}
              />
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topbar (location=menu)</Text>
        <View style={styles.topbarContainer}>
          <Topbar
            location="menu"
            subtitle="셀프작명"
          />
        </View>
      </View>

      {/* SelectItem */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SelectItem (탭하여 선택)</Text>
        <Text style={styles.navbarHint}>Small:</Text>
        <View style={styles.selectItemRow}>
          <SelectItem
            status="small"
            label="김(金)"
            selected={selectedItems.has('small1')}
            onPress={() => toggleSelect('small1')}
          />
          <SelectItem
            status="small"
            label="이(李)"
            selected={selectedItems.has('small2')}
            onPress={() => toggleSelect('small2')}
          />
          <SelectItem
            status="small"
            label="박(朴)"
            showCloseButton
            selected={selectedItems.has('smallClose')}
            onPress={() => toggleSelect('smallClose')}
            onClosePress={() => Alert.alert('Close Small')}
          />
        </View>
        <Text style={styles.navbarHint}>Medium:</Text>
        <View style={styles.selectItemRow}>
          <SelectItem
            status="medium"
            label="김(金)"
            selected={selectedItems.has('medium1')}
            onPress={() => toggleSelect('medium1')}
          />
          <SelectItem
            status="medium"
            label="이(李)"
            selected={selectedItems.has('medium2')}
            onPress={() => toggleSelect('medium2')}
          />
          <SelectItem
            status="medium"
            label="박(朴)"
            showCloseButton
            selected={selectedItems.has('mediumClose')}
            onPress={() => toggleSelect('mediumClose')}
            onClosePress={() => Alert.alert('Close Medium')}
          />
        </View>
        <SelectItem
          status="hasSecondLabel"
          label="김(金)"
          secondLabel="(金荷旻)"
          selected={selectedItems.has('second1')}
          onPress={() => toggleSelect('second1')}
        />
        <SelectItem
          status="hasBodyLabel"
          label="김(金)"
          bodyLabel="Body Text"
          selected={selectedItems.has('body1')}
          onPress={() => toggleSelect('body1')}
        />
        <SelectItem
          status="hasImage"
          label="김(金)"
          bodyLabel="Body Text"
          imageSource={{ uri: 'https://picsum.photos/64/80' }}
          selected={selectedItems.has('image1')}
          onPress={() => toggleSelect('image1')}
        />
      </View>

      {/* Pagination */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pagination (Progress Indicator)</Text>

        {/* 버튼으로 제어 */}
        <Text style={styles.navbarHint}>버튼으로 제어:</Text>
        <Pagination totalPages={5} currentPage={currentPage} />
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            size="medium"
            onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="medium"
            onPress={() => setCurrentPage(p => Math.min(4, p + 1))}
          >
            Next
          </Button>
        </View>

        {/* 캐러셀 드래그로 제어 */}
        <Text style={[styles.navbarHint, { marginTop: 16 }]}>캐러셀 드래그로 제어:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={280 + 12} // 카드 너비 + 간격
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / (280 + 12));
            setCurrentPage(Math.min(pageIndex, 4));
          }}
          style={{ marginVertical: 8, marginHorizontal: -20 }}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <View key={num} style={styles.carouselPage}>
              <Text style={styles.carouselText}>Page {num}</Text>
            </View>
          ))}
        </ScrollView>
        <Pagination totalPages={5} currentPage={currentPage} />
      </View>

      {/* SearchInput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SearchInput</Text>
        <SearchInput
          placeholder="성씨를 검색해주세요."
          value={searchText}
          onChangeText={setSearchText}
        />
        <Text style={styles.navbarHint}>입력값: "{searchText}"</Text>
      </View>

      {/* SelectionInput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SelectionInput</Text>
        <Text style={styles.navbarHint}>Pill shape:</Text>
        <SelectionInput
          label="생년월일"
          placeholder="생년 월일을 선택해주세요."
          shape="pill"
          onPress={() => Alert.alert('Date Picker', 'Open date picker')}
        />
        <SelectionInput
          label="생년월일"
          value="2021.09.17"
          shape="pill"
          onPress={() => Alert.alert('Date Picker', 'Open date picker')}
        />
        <Text style={[styles.navbarHint, { marginTop: 16 }]}>Rectangle shape:</Text>
        <SelectionInput
          label="생년월일"
          placeholder="생년 월일을 선택해주세요."
          shape="rectangle"
          onPress={() => Alert.alert('Date Picker', 'Open date picker')}
        />
        <SelectionInput
          label="생년월일"
          value="2021.09.17"
          shape="rectangle"
          onPress={() => Alert.alert('Date Picker', 'Open date picker')}
        />
      </View>

      {/* TextArea */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TextArea</Text>
        <TextArea
          label="개명 사유"
          placeholder="개명하려는 다른 이유가 어떻게 되나요?"
          value={textAreaValue}
          onChangeText={setTextAreaValue}
          numberOfLines={6}
        />
      </View>

      {/* SyllableInput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SyllableInput</Text>
        <SyllableInput
          placeholder="글자 입력"
          value={syllableValue}
          hanjaValue={selectedHanja?.hanja}
          koreanMeaning={selectedHanja?.meaning}
          isEditing={isEditingSyllable}
          onChangeText={(text) => {
            setSyllableValue(text);
          }}
          onEditStart={() => {
            // 이전 값 저장 후 편집 모드 시작
            prevHanjaRef.current = selectedHanja;
            setIsEditingSyllable(true);
          }}
          onEditEnd={() => {
            // 새 선택 없이 blur되면 이전 값 복원
            if (prevHanjaRef.current && !selectedHanja) {
              setSelectedHanja(prevHanjaRef.current);
            }
            setSyllableValue('');
            setIsEditingSyllable(false);
            prevHanjaRef.current = null;
          }}
          style={{ width: 202 }}
        />

        {/* 검색 결과 (편집 중이고 syllableValue가 있을 때) */}
        {isEditingSyllable && syllableValue && (
          <View style={{ marginTop: 8, gap: 4 }}>
            <Text style={styles.navbarHint}>검색 결과:</Text>
            {hanjaResults.map((item, i) => (
              <Button
                key={i}
                variant="outline"
                size="small"
                onPress={() => {
                  setSelectedHanja({ hanja: item.hanja, meaning: item.meaning });
                  setSyllableValue('');
                  setIsEditingSyllable(false);
                  prevHanjaRef.current = null;
                }}
              >
                {`${item.hanja} (${item.meaning})`}
              </Button>
            ))}
          </View>
        )}

        {selectedHanja && !isEditingSyllable && (
          <Text style={styles.navbarHint}>선택됨: {selectedHanja.hanja} - {selectedHanja.meaning}</Text>
        )}
      </View>

      {/* Dialog */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dialog</Text>
        <Button
          variant="outline"
          size="medium"
          onPress={() => setDialogVisible(true)}
        >
          Open Dialog
        </Button>
      </View>

      {/* Dialog Modal */}
      <Dialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onConfirm={() => {
          Alert.alert('Dialog', `선택됨: ${selectedZodiac || '없음'}`);
        }}
        confirmText="선택"
      >
        <DialogItem variant="zodiacTime" maxHeight={280}>
          {zodiacOptions.map((label) => (
            <SelectItem
              key={label}
              status="medium"
              label={label}
              selected={selectedZodiac === label}
              onPress={() => setSelectedZodiac(label)}
            />
          ))}
        </DialogItem>
      </Dialog>

      {/* DateTimePicker Dialog */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DateTimePicker</Text>
        <Button
          variant="outline"
          size="medium"
          onPress={() => setDatePickerVisible(true)}
        >
          Open DatePicker
        </Button>
        <Text style={styles.navbarHint}>
          선택된 날짜: {selectedDate.toLocaleDateString('ko-KR')}
        </Text>
      </View>

      {/* iOS: Dialog 안에서 DateTimePicker 표시 */}
      {Platform.OS === 'ios' && (
        <Dialog
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onConfirm={() => {
            Alert.alert('DatePicker', `선택됨: ${selectedDate.toLocaleDateString('ko-KR')}`);
          }}
          confirmText="선택"
        >
          <DialogItem variant="dateAndTimeWheel" style={{ minHeight: 220 }}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) setSelectedDate(date);
              }}
              locale="ko-KR"
              style={{ flex: 1, width: '100%' }}
            />
          </DialogItem>
        </Dialog>
      )}

      {/* Android: DateTimePicker 직접 표시 (자체 모달 사용) */}
      {Platform.OS === 'android' && datePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          design="material"
          onChange={(event, date) => {
            setDatePickerVisible(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* === END NEW COMPONENTS === */}

      <Text style={styles.subtitle}>Button Components</Text>

      {/* Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variants</Text>
        <View style={styles.buttonRow}>
          <Button variant="primary" onPress={() => handlePress('Primary')}>
            Primary
          </Button>
          <Button variant="neutral" onPress={() => handlePress('Neutral')}>
            Neutral
          </Button>
        </View>
        <View style={styles.buttonRow}>
          <Button variant="outline" onPress={() => handlePress('Outline')}>
            Outline
          </Button>
          <Button variant="tonal" onPress={() => handlePress('Tonal')}>
            Tonal
          </Button>
        </View>
      </View>

      {/* Sizes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sizes</Text>
        <Button variant="primary" size="small" onPress={() => handlePress('Small')}>
          Small
        </Button>
        <Button variant="primary" size="medium" onPress={() => handlePress('Medium')}>
          Medium
        </Button>
        <Button variant="primary" size="large" onPress={() => handlePress('Large')}>
          Large
        </Button>
      </View>

      {/* With Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>With Icons</Text>
        <Button
          variant="primary"
          layout="showLeadingIcon"
          leadingIcon={<Icon name="Plus" size={20} color={colors.background.accent.onPrimary} />}
          onPress={() => handlePress('Leading Icon')}
        >
          추가하기
        </Button>
        <Button
          variant="outline"
          layout="showTrailingIcon"
          trailingIcon={<Icon name="arrowRight" size={20} color={colors.text.default.primary} />}
          onPress={() => handlePress('Trailing Icon')}
        >
          다음으로
        </Button>
      </View>

      {/* Disabled */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disabled State</Text>
        <View style={styles.buttonRow}>
          <Button variant="primary" disabled>
            Primary Disabled
          </Button>
          <Button variant="outline" disabled>
            Outline Disabled
          </Button>
        </View>
      </View>

      {/* Loading */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loading State</Text>
        <Button variant="primary" isLoading>
          저장 중...
        </Button>
      </View>

      {/* Icon Sizes */}
      <Text style={[styles.subtitle, { marginTop: 20 }]}>Icon Components</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outline - Size 16 (stroke: 1)</Text>
        <View style={styles.iconRow}>
          <Icon name="Plus" size={16} iconStyle="outline" />
          <Icon name="Check" size={16} iconStyle="outline" />
          <Icon name="X Mark" size={16} iconStyle="outline" />
          <Icon name="arrowRight" size={16} iconStyle="outline" />
          <Icon name="user" size={16} iconStyle="outline" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outline - Size 20 (stroke: 1.25)</Text>
        <View style={styles.iconRow}>
          <Icon name="Plus" size={20} iconStyle="outline" />
          <Icon name="Check" size={20} iconStyle="outline" />
          <Icon name="X Mark" size={20} iconStyle="outline" />
          <Icon name="arrowRight" size={20} iconStyle="outline" />
          <Icon name="user" size={20} iconStyle="outline" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outline - Size 24 (stroke: 1.5)</Text>
        <View style={styles.iconRow}>
          <Icon name="Plus" size={24} iconStyle="outline" />
          <Icon name="Check" size={24} iconStyle="outline" />
          <Icon name="X Mark" size={24} iconStyle="outline" />
          <Icon name="arrowRight" size={24} iconStyle="outline" />
          <Icon name="user" size={24} iconStyle="outline" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outline - Size 40 (stroke: 2.5)</Text>
        <View style={styles.iconRow}>
          <Icon name="Plus" size={40} iconStyle="outline" />
          <Icon name="Check" size={40} iconStyle="outline" />
          <Icon name="X Mark" size={40} iconStyle="outline" />
          <Icon name="arrowRight" size={40} iconStyle="outline" />
          <Icon name="user" size={40} iconStyle="outline" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Solid Icons</Text>
        <View style={styles.iconRow}>
          <Icon name="Plus" size={24} iconStyle="solid" />
          <Icon name="Check" size={24} iconStyle="solid" />
          <Icon name="X Mark" size={24} iconStyle="solid" />
          <Icon name="arrowRight" size={24} iconStyle="solid" />
          <Icon name="user" size={24} iconStyle="solid" />
        </View>
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCF8F0',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FCF8F0',
  },
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#332C21',
    fontFamily: 'Pretendard-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#92846D',
    marginBottom: 30,
    fontFamily: 'Pretendard-Regular',
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D614C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Pretendard-SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  logoRow: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navbarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: -20, // Full width
  },
  navbarHint: {
    fontSize: 12,
    color: '#92846D',
    textAlign: 'center',
    marginTop: 8,
  },
  topbarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectItemRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  carouselPage: {
    width: 280,
    height: 120,
    backgroundColor: '#E8DEC8',
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#332C21',
  },
});
