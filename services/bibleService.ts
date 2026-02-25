
import { BIBLE_BOOKS } from '../constants';
import { BibleResponse } from '../types';

const chapterCache = new Map<string, Promise<BibleResponse>>();

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Fetches a chapter from the Bible using the bible-api.com
 * We use 'almeida' for Portuguese translation.
 */
export const fetchChapter = async (
  book: string,
  chapter: number,
  signal?: AbortSignal
): Promise<BibleResponse> => {
  const cacheKey = `${book}:${chapter}`;
  const cached = chapterCache.get(cacheKey);
  if (cached) return cached;

  const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=almeida`;
  const request = fetch(url, { signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Falha ao carregar o capítulo da Bíblia.');
      }
      return response.json() as Promise<BibleResponse>;
    })
    .catch((error) => {
      chapterCache.delete(cacheKey);
      throw error;
    });

  chapterCache.set(cacheKey, request);
  return request;
};

const parseVerseReference = (reference: string) => {
  const match = reference
    .trim()
    .match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);

  if (!match) {
    return null;
  }

  const [, rawBook, chapterRaw, startRaw, endRaw] = match;
  const normalized = normalizeText(rawBook);

  const book = BIBLE_BOOKS.find((candidate) => {
    const names = [
      candidate.id,
      candidate.name,
      candidate.apiName,
      ...(candidate.aliases ?? [])
    ];
    return names.some((name) => normalizeText(name) === normalized);
  });

  if (!book) {
    return null;
  }

  const chapter = parseInt(chapterRaw, 10);
  const startVerse = parseInt(startRaw, 10);
  const endVerse = endRaw ? parseInt(endRaw, 10) : startVerse;

  return {
    book,
    chapter,
    startVerse,
    endVerse: Math.max(startVerse, endVerse)
  };
};

export const fetchVersesByReference = async (
  reference: string,
  signal?: AbortSignal
): Promise<{ reference: string; text: string }[]> => {
  const parsed = parseVerseReference(reference);
  if (!parsed) {
    return [];
  }

  const chapterData = await fetchChapter(parsed.book.apiName, parsed.chapter, signal);
  return chapterData.verses
    .filter((verse) => verse.verse >= parsed.startVerse && verse.verse <= parsed.endVerse)
    .map((verse) => ({
      reference: `${parsed.book.name} ${parsed.chapter}:${verse.verse}`,
      text: verse.text.trim()
    }));
};
