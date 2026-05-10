import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  FlatList, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCard from '../../src/components/ui/PMBookCard';
import { booksApi } from '../../src/features/books/api';
import { BookSummary } from '../../src/features/books/types';
import { GENRES } from '../../src/constants';

const CARD_GAP = 12;

export default function SearchScreen() {
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['books', 'search', search, selectedGenre],
    queryFn: () => booksApi.getBooks({
      keyword: search || undefined,
      genre: selectedGenre,
      size: 30,
    }),
  });

  const handleSearch = () => setSearch(keyword.trim());

  const books = data?.content ?? [];
  const gridData: (BookSummary | null)[] = books.length % 2 !== 0 ? [...books, null] : books;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.screen}>

        {/* 검색바 */}
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
            <PMIcon name="chevronLeft" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.searchInput, focused && styles.searchInputFocused]}>
            <PMIcon name="search" size={18} color={focused ? colors.primary : colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="제목, 저자, 키워드"
              placeholderTextColor={colors.textTertiary}
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity
                onPress={() => { setKeyword(''); setSearch(''); }}
                activeOpacity={0.7}
                style={styles.clearButton}
              >
                <PMIcon name="close" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 장르 필터 */}
        <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedGenre && styles.chipActive]}
              onPress={() => setSelectedGenre(undefined)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, !selectedGenre && styles.chipTextActive]}>전체</Text>
            </TouchableOpacity>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.chip, selectedGenre === g.id && styles.chipActive]}
                onPress={() => setSelectedGenre(selectedGenre === g.id ? undefined : g.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedGenre === g.id && styles.chipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 결과 */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
        ) : (
          <FlatList
            data={gridData}
            keyExtractor={(item, index) => item ? String(item.id) : `filler-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.resultHeader}>
                <Text style={styles.resultCount}>
                  {books.length > 0 ? (
                    <>
                      <Text style={styles.resultCountHighlight}>{data?.totalElements ?? books.length}권</Text>
                      {'의 책을 찾았어요'}
                    </>
                  ) : '조건에 맞는 책이 없어요'}
                </Text>
                <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
                  <Text style={styles.sortText}>최신순</Text>
                  <PMIcon name="chevronDown" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) =>
              item ? (
                <PMBookCard book={item} onPress={() => router.push(`/books/${item.id}`)} />
              ) : (
                <View style={styles.cardFiller} />
              )
            }
            ListEmptyComponent={<EmptyState query={search} onReset={() => { setKeyword(''); setSearch(''); setSelectedGenre(undefined); }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* ---------- Empty State ---------- */
function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <PMIcon name="book" size={38} color={colors.textTertiary} />
      </View>
      <View style={styles.emptyTextWrap}>
        <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
        <Text style={styles.emptyDesc}>
          {query ? `"${query}"에 해당하는 책을` : '조건에 맞는 책을'} 찾지 못했어요{'\n'}
          다른 키워드나 필터를 시도해 보세요
        </Text>
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.75}>
        <Text style={styles.resetText}>필터 초기화</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },

  /* 검색바 */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.s4,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  backButton: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInputFocused: {
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 3 },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  clearButton: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.textTertiary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  /* 장르 필터 */
  filtersWrap: {
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.bg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.s4,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  /* 결과 헤더 */
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultCountHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  /* FlatList */
  listContent: {
    paddingHorizontal: spacing.s4,
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  cardFiller: {
    flex: 1,
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIconWrap: {
    width: 84, height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 8,
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
