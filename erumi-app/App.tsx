import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { useState, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Icon, Logo, Navbar, NavbarMenu, Topbar, TopbarItem, SelectItem, Pagination, SearchInput, SelectionInput, TextArea, SyllableInput, Dialog, DialogItem, Badge, ElementBarGraph, YinYang, TabMenu, OrthodoxReport, OrthodoxReportContent, colors } from './design-system';

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
  const [selectedTab1, setSelectedTab1] = useState('tab1');
  const [selectedTab2, setSelectedTab2] = useState('b');

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Erumi Design System</Text>

        {/* === NEW COMPONENTS TEST AREA (add new components here) === */}

        {/* Badge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge - Colors</Text>
          <View style={styles.buttonRow}>
            <Badge firstLabel="기본" secondLabel="값" color="default" />
            <Badge firstLabel="성공" secondLabel="값" color="green" />
            <Badge firstLabel="경고" secondLabel="값" color="orange" />
            <Badge firstLabel="위험" secondLabel="값" color="red" />
          </View>
          <Text style={styles.navbarHint}>Sizes:</Text>
          <View style={styles.buttonRow}>
            <Badge firstLabel="Small" size="small" />
            <Badge firstLabel="Medium" size="medium" />
          </View>
          <Text style={styles.navbarHint}>Shapes:</Text>
          <View style={styles.buttonRow}>
            <Badge firstLabel="Pill" secondLabel="모양" shape="pill" />
            <Badge firstLabel="Rectangle" secondLabel="모양" shape="rectangle" />
          </View>
          <Text style={styles.navbarHint}>Color + Shape Combinations:</Text>
          <View style={styles.buttonRow}>
            <Badge firstLabel="대길" color="green" shape="rectangle" />
            <Badge firstLabel="길" color="green" shape="pill" />
            <Badge firstLabel="흉" color="red" shape="rectangle" />
            <Badge firstLabel="주의" color="orange" shape="pill" />
          </View>
        </View>

        {/* ElementBarGraph */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ElementBarGraph - 오행 그래프</Text>
          <Text style={styles.navbarHint}>사주 오행만 (이름 오행 없음):</Text>
          <ElementBarGraph
            elements={{ wood: 2, fire: 1, earth: 0, metal: 3, water: 1 }}
          />
          <Text style={[styles.navbarHint, { marginTop: 16 }]}>사주 + 이름 오행 (wood, water):</Text>
          <ElementBarGraph
            elements={{ wood: 2, fire: 1, earth: 0, metal: 3, water: 1 }}
            nameElements={['wood', 'water']}
          />
          <Text style={[styles.navbarHint, { marginTop: 16 }]}>모든 오행 0:</Text>
          <ElementBarGraph
            elements={{ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }}
          />
          <Text style={[styles.navbarHint, { marginTop: 16 }]}>모든 오행 3:</Text>
          <ElementBarGraph
            elements={{ wood: 3, fire: 3, earth: 3, metal: 3, water: 3 }}
          />
        </View>

        {/* YinYang */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YinYang - 음양</Text>
          <View style={styles.buttonRow}>
            <YinYang variant="yin" />
            <YinYang variant="yang" />
          </View>
        </View>

        {/* TabMenu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TabMenu - 탭 메뉴</Text>
          <Text style={styles.navbarHint}>5개 탭:</Text>
          <TabMenu
            items={[
              { id: 'tab1', label: '발음오행' },
              { id: 'tab2', label: '자원오행' },
              { id: 'tab3', label: '학자평가' },
              { id: 'tab4', label: '음양배합' },
              { id: 'tab5', label: '이름풀이' },
            ]}
            selectedId={selectedTab1}
            onSelect={setSelectedTab1}
          />
          <Text style={[styles.navbarHint, { marginTop: 16 }]}>3개 탭:</Text>
          <TabMenu
            items={[
              { id: 'a', label: '첫번째' },
              { id: 'b', label: '두번째' },
              { id: 'c', label: '세번째' },
            ]}
            selectedId={selectedTab2}
            onSelect={setSelectedTab2}
          />
        </View>

        {/* OrthodoxReportContent - fiveElementsTheory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReportContent - fiveElementsTheory (음양오행)</Text>
          <OrthodoxReportContent
            variant="fiveElementsTheory"
            fiveElementsTheory={{
              surname: { hanja: '金', reading: '김', hun: '쇠', strokeCount: 8, isEven: true, yinYang: 'yang' },
              firstName: { hanja: '珉', reading: '아', hun: '돌', strokeCount: 9, isEven: false, yinYang: 'yin' },
              secondName: { hanja: '羅', reading: '라', hun: '비단', strokeCount: 19, isEven: false, yinYang: 'yang' },
            }}
          />
        </View>

        {/* OrthodoxReportContent - pronunciationElements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReportContent - pronunciationElements (발음오행)</Text>
          <OrthodoxReportContent
            variant="pronunciationElements"
            pronunciationElements={{
              surname: { hanja: '金', reading: '김', hun: '쇠', imageSource: require('./assets/hanja_placeholder.png') },
              firstName: { hanja: '珉', reading: '민', hun: '나무', imageSource: require('./assets/hanja_placeholder.png') },
              secondName: { hanja: '羅', reading: '라', hun: '불', imageSource: require('./assets/hanja_placeholder.png') },
            }}
          />
        </View>

        {/* OrthodoxReportContent - suriAnalysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReportContent - suriAnalysis (수리성명학)</Text>
          <OrthodoxReportContent
            variant="suriAnalysis"
            suriAnalysis={{
              periods: [
                { label: '초년', detail: '0세~19세 | 24수', description: '부모의 그늘 없이도, 일찍부터 자신의 재능으로 두각을 나타내는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' },
                { label: '청년', detail: '20세~40세 | 24수', description: '인생의 황금기! 사회에 나가 리더가 되어 많은 사람을 이끄는 강력한 운입니다.', badgeLabel: '길', badgeColor: 'green' },
                { label: '중년', detail: '40세~60세 | 24수', description: '머리는 비상하고 재주가 넘치지만, 남모를 고독이나 예상치 못한 난관을 겪을 수 있는 시기입니다.', badgeLabel: '반길반흉', badgeColor: 'orange' },
                { label: '말년', detail: '60세~평생 | 24수', description: '인생의 모든 어려움이 걷히고, 순풍에 돛 단 듯 부와 명예를 누리며 편안하게 마무리하는 최고의 운입니다.', badgeLabel: '흉', badgeColor: 'red' },
              ],
            }}
          />
        </View>

        {/* OrthodoxReportContent - elementalBalance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReportContent - elementalBalance (오행밸런스)</Text>
          <OrthodoxReportContent
            variant="elementalBalance"
            elementalBalance={{
              elements: { wood: 2, fire: 1, earth: 0, metal: 3, water: 1 },
              nameElements: ['metal', 'water', 'fire'],
            }}
          />
        </View>

        {/* OrthodoxReportContent - unluckyCharacters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReportContent - unluckyCharacters (불용문자)</Text>
          <OrthodoxReportContent
            variant="unluckyCharacters"
            unluckyCharacters={{
              firstName: { hanja: '詩', readingTitle: '시', reading: '시', badgeLabel: '좋음', badgeColor: 'green' },
              secondName: { hanja: '朗', readingTitle: '밝을', reading: '랑', badgeLabel: '좋음', badgeColor: 'green' },
            }}
          />
        </View>

        {/* OrthodoxReport (Full Component) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OrthodoxReport (Full Component)</Text>
          <OrthodoxReport
            pronunciationElements={{
              surname: { hanja: '金', reading: '김', hun: '쇠' },
              firstName: { hanja: '珉', reading: '민', hun: '돌' },
              secondName: { hanja: '羅', reading: '라', hun: '벌릴' },
            }}
            fiveElementsTheory={{
              surname: { hanja: '金', reading: '김', hun: '쇠', strokeCount: 8, isEven: true, yinYang: 'yin' },
              firstName: { hanja: '珉', reading: '민', hun: '돌', strokeCount: 9, isEven: false, yinYang: 'yang' },
              secondName: { hanja: '羅', reading: '라', hun: '벌릴', strokeCount: 19, isEven: false, yinYang: 'yang' },
            }}
            suriAnalysis={{
              periods: [
                { label: '초년', detail: '0세~19세 | 24수', description: '부모의 그늘 없이도, 일찍부터 자신의 재능으로 두각을 나타내는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' },
                { label: '청년', detail: '20세~40세 | 24수', description: '인생의 황금기! 사회에 나가 리더가 되어 많은 사람을 이끄는 강력한 운입니다.', badgeLabel: '길', badgeColor: 'green' },
                { label: '중년', detail: '40세~60세 | 24수', description: '머리는 비상하고 재주가 넘치지만, 남모를 고독이나 예상치 못한 난관을 겪을 수 있는 시기입니다.', badgeLabel: '반길반흉', badgeColor: 'orange' },
                { label: '말년', detail: '60세~평생 | 24수', description: '인생의 모든 어려움이 걷히고, 순풍에 돛 단 듯 부와 명예를 누리며 편안하게 마무리하는 최고의 운입니다.', badgeLabel: '흉', badgeColor: 'red' },
              ],
            }}
            elementalBalance={{
              elements: { wood: 2, fire: 1, earth: 0, metal: 3, water: 1 },
              nameElements: ['metal', 'water', 'fire'],
            }}
            unluckyCharacters={{
              firstName: { hanja: '詩', readingTitle: '시', reading: '시', badgeLabel: '좋음', badgeColor: 'green' },
              secondName: { hanja: '朗', readingTitle: '밝을', reading: '랑', badgeLabel: '좋음', badgeColor: 'green' },
            }}
            headerData={{
              fiveElementsTheory: {
                reportOverview: "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
                categoryGuide: "* 음양오행은 글자 획수의 짝수(음)와 홀수(양)를 적절히 섞어 기운의 균형을 맞추는 거에요.",
              },
              pronunciationElements: {
                reportOverview: "부드럽고 안정적인 느낌을 주는 소리예요. 듣는 사람에게 편안함과 신뢰감을 주며, 차분한 리더십을 발휘하는 사람에게 어울려요.",
                categoryGuide: "* 발음오행은 이름을 소리 내어 불렀을 때, 소리의 기운끼리 서로 돕는지 싸우는지 볼 때 사용해요.",
              },
              suriAnalysis: {
                reportOverview: "초년의 재능과 청년의 리더십이 중년의 파도를 넘어, 마침내 말년에 부와 명예로 완성되는 드라마틱한 인생이에요.",
                categoryGuide: "* 수리성명학은 한자의 획수를 더한 숫자로 초년, 청년, 중년, 말년의 구체적인 운세를 계산하는 거에요.",
              },
              elementalBalance: {
                reportOverview: "이름에 부족한 기운을 채워주는 금(金)의 기운이 강하게 나타나고 있어요. 쇠를 다듬어 보석을 만들 듯, 잠재력을 갈고 닦아 빛나는 존재가 될 수 있도록 도와줘요.",
                categoryGuide: "* 자원오행은 한자가 본래 가지고 있는 자연의 성질(불, 물, 나무 등)이 사주에 필요한 기운인지 보는 거에요.",
              },
              unluckyCharacters: {
                reportOverview: "이름에 부정적인 영향을 미치는 불용문자는 전혀 없어요. 모두 긍정적이고 아름다운 의미를 지닌 좋은 한자들이에요.",
                categoryGuide: "* 불용문자는 뜻은 좋아도 이름에 쓰면 운이 나빠진다고 하여 작명 시 피하는 글자인지 확인하는거에요.",
              },
            }}
            initialTab="fiveElementsTheory"
          />
        </View>

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

        {/* Sun & Moon Icons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sun & Moon Icons</Text>
          <View style={styles.iconRow}>
            <Icon name="sun" size={16} iconStyle="outline" />
            <Icon name="sun" size={20} iconStyle="outline" />
            <Icon name="sun" size={24} iconStyle="outline" />
            <Icon name="sun" size={40} iconStyle="outline" />
          </View>
          <View style={styles.iconRow}>
            <Icon name="sun" size={16} iconStyle="solid" />
            <Icon name="sun" size={20} iconStyle="solid" />
            <Icon name="sun" size={24} iconStyle="solid" />
            <Icon name="sun" size={40} iconStyle="solid" />
          </View>
          <View style={styles.iconRow}>
            <Icon name="moon" size={16} iconStyle="outline" />
            <Icon name="moon" size={20} iconStyle="outline" />
            <Icon name="moon" size={24} iconStyle="outline" />
            <Icon name="moon" size={40} iconStyle="outline" />
          </View>
          <View style={styles.iconRow}>
            <Icon name="moon" size={16} iconStyle="solid" />
            <Icon name="moon" size={20} iconStyle="solid" />
            <Icon name="moon" size={24} iconStyle="solid" />
            <Icon name="moon" size={40} iconStyle="solid" />
          </View>
        </View>

        <StatusBar style="auto" />
      </ScrollView>
    </GestureHandlerRootView>
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
