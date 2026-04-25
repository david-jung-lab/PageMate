import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, fontSize } from '../../src/theme/tokens';
import PMIcon from '../../src/components/ui/PMIcon';
import PMBookCard from '../../src/components/ui/PMBookCard';
import { booksApi } from '../../src/features/books/api';
import { BookCondition } from '../../src/features/books/types';
import { GENRES, CONDITION_LABELS } from '../../src/constants';

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: 'LIKE_NEW', label: '상' },
  { value: 'GOOD', label: '중' },
  { value: 'ACCEPTABLE', label: '하' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [selectedCondition, setSelectedCondition] = useState<BookCondition | undefined>();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['books', 'search', search, selectedGenre, selectedCondition],
    queryFn: () => booksApi.getBooks({
      keyword: search || undefined,
      genre: selectedGenre,
      condition: selectedCondition,
      size: 30,
    }),
  });

  const handleSearch = () => setSearch(keyword.trim());

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.screen}>

        {/* 검색바 */}
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <PMIcon name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="제목, 저자, ISBN 검색"
              placeholderTextColor={colors.textTertiary}
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => { setKeyword(''); setSearch(''); }} activeOpacity={0.7}>
                <PMIcon name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 필터 */}
        <View style={styles.filtersWrap}>
          {/* 장르 */}
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
                key={g}
                style={[styles.chip, selectedGenre === g && styles.chipActive]}
                onPress={() => setSelectedGenre(selectedGenre === g ? undefined : g)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 컨디션 */}
          <View style={styles.filterRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, selectedCondition === c.value && styles.chipActive]}
                onPress={() => setSelectedCondition(selectedCondition === c.value ? undefined : c.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedCondition === c.value && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 결과 */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
        ) : (
          <FlatList
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <PMBookCard
                book={item}
                onPress={() => router.push(`/books/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <PMIcon name="search" size={36} color={colors.borderStrong} />
                <Text style={styles.emptyText}>검색 결과가 없어요</Text>
              </View>
            }
            ListHeaderComponent={
              data?.totalElements != null ? (
                <Text style={styles.resultCount}>총 {data.totalElements}권</Text>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },

  searchBar: {
    paddingHorizontal: spacing.s4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },

  filtersWrap: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.s4,
  },
  chip: {
    height: 32,
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
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  list: {
    padding: spacing.s4,
  },
  resultCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
