
import { BibleResponse } from '../types';

const chapterCache = new Map<string, Promise<BibleResponse>>();

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
