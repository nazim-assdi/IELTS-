import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VOCABULARY_CATALOG,
  filterVocabulary,
  toggleBookmark,
  getVocabularyStats,
  VocabularyItem,
} from './vocabulary-mastery';

describe('Vocabulary Mastery System Tests', () => {
  it('should have a rich vocabulary catalog spanning all 10 curriculum sections', () => {
    assert.ok(VOCABULARY_CATALOG.length >= 40, 'Catalog should have comprehensive lexis');
    
    // Check that every section from 1 to 10 has representative vocabulary
    const sectionsRepresented = new Set(VOCABULARY_CATALOG.map(v => v.sectionNumber));
    for (let sec = 1; sec <= 10; sec++) {
      assert.ok(sectionsRepresented.has(sec), `Section ${sec} should be represented in vocabulary catalog`);
    }

    // Verify all items have required fields
    for (const item of VOCABULARY_CATALOG) {
      assert.ok(item.id, 'Item must have an id');
      assert.ok(item.term, 'Item must have a term');
      assert.ok(item.definition, 'Item must have a definition');
      assert.ok(item.exampleSentence, 'Item must have an example sentence');
      assert.ok(item.bandLevel >= 7.0 && item.bandLevel <= 9.0, 'Band level must be between 7.0 and 9.0');
      assert.ok(item.unitNumber >= 1 && item.unitNumber <= 100, 'Unit number must be 1 to 100');
    }
  });

  it('should toggle bookmarks accurately without side effects', () => {
    const initialBookmarks: string[] = ['v-u1-1', 'v-u2-1'];

    // Add a new bookmark
    const added = toggleBookmark(initialBookmarks, 'v-u3-1');
    assert.deepEqual(added, ['v-u1-1', 'v-u2-1', 'v-u3-1']);
    // Verify immutability
    assert.equal(initialBookmarks.length, 2);

    // Remove an existing bookmark
    const removed = toggleBookmark(added, 'v-u1-1');
    assert.deepEqual(removed, ['v-u2-1', 'v-u3-1']);

    // Toggling with empty ID does not alter list
    const unchanged = toggleBookmark(removed, '');
    assert.deepEqual(unchanged, ['v-u2-1', 'v-u3-1']);
  });

  it('should filter vocabulary by text query across term, definition, and example', () => {
    // Search by term substring
    const result1 = filterVocabulary(VOCABULARY_CATALOG, {
      searchQuery: 'metropolis',
    });
    assert.ok(result1.length >= 1);
    assert.ok(result1.some(i => i.term.includes('metropolis')));

    // Search by definition keyword (e.g. "extinction")
    const result2 = filterVocabulary(VOCABULARY_CATALOG, {
      searchQuery: 'extinction',
    });
    assert.ok(result2.length >= 1);
    assert.ok(result2.some(i => i.definition.includes('extinction')));

    // Case-insensitive search
    const resultUpper = filterVocabulary(VOCABULARY_CATALOG, {
      searchQuery: 'UBIQUITOUS',
    });
    const resultLower = filterVocabulary(VOCABULARY_CATALOG, {
      searchQuery: 'ubiquitous',
    });
    assert.equal(resultUpper.length, resultLower.length);
  });

  it('should filter vocabulary by section, minimum band level, and vocabulary type', () => {
    // Filter by Section 7 (Advanced Grammar & Inversions)
    const sec7 = filterVocabulary(VOCABULARY_CATALOG, {
      sectionNumber: 7,
    });
    assert.ok(sec7.length > 0);
    assert.ok(sec7.every(i => i.sectionNumber === 7));

    // Filter by Min Band 9.0
    const band9 = filterVocabulary(VOCABULARY_CATALOG, {
      minBand: 9.0,
    });
    assert.ok(band9.length > 0);
    assert.ok(band9.every(i => i.bandLevel >= 9.0));

    // Filter by type 'idiom'
    const idioms = filterVocabulary(VOCABULARY_CATALOG, {
      vocabType: 'idiom',
    });
    assert.ok(idioms.length > 0);
    assert.ok(idioms.every(i => i.type === 'idiom'));
  });

  it('should filter vocabulary by bookmark status', () => {
    const bookmarkedIds = ['v-u1-1', 'v-u11-1'];

    const onlyBookmarked = filterVocabulary(VOCABULARY_CATALOG, {
      bookmarkedOnly: true,
      bookmarkedIds,
    });

    assert.equal(onlyBookmarked.length, 2);
    assert.ok(onlyBookmarked.every(i => bookmarkedIds.includes(i.id)));
  });

  it('should compute accurate statistics including bookmarked count and band breakdown', () => {
    const mockItems: VocabularyItem[] = [
      {
        id: '1',
        term: 'term 1',
        type: 'collocation',
        bandLevel: 7.5,
        definition: 'def 1',
        exampleSentence: 'ex 1',
        unitNumber: 1,
        unitTitle: 'Unit 1',
        sectionNumber: 1,
        sectionTitle: 'Sec 1',
      },
      {
        id: '2',
        term: 'term 2',
        type: 'idiom',
        bandLevel: 8.5,
        definition: 'def 2',
        exampleSentence: 'ex 2',
        unitNumber: 2,
        unitTitle: 'Unit 2',
        sectionNumber: 1,
        sectionTitle: 'Sec 1',
      },
      {
        id: '3',
        term: 'term 3',
        type: 'discourse-marker',
        bandLevel: 9.0,
        definition: 'def 3',
        exampleSentence: 'ex 3',
        unitNumber: 61,
        unitTitle: 'Unit 61',
        sectionNumber: 7,
        sectionTitle: 'Sec 7',
      },
    ];

    const stats = getVocabularyStats(mockItems, ['1', '3']);
    assert.equal(stats.totalTerms, 3);
    assert.equal(stats.bookmarkedCount, 2);
    assert.equal(stats.bandCounts.band7, 1);
    assert.equal(stats.bandCounts.band85, 1);
    assert.equal(stats.bandCounts.band9, 1);
    assert.equal(stats.typeCounts.collocation, 1);
    assert.equal(stats.typeCounts.idiom, 1);
    assert.equal(stats.typeCounts['discourse-marker'], 1);
    assert.equal(stats.sectionCounts[1], 2);
    assert.equal(stats.sectionCounts[7], 1);
  });
});
