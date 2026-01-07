
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SummaryPanel from './components/SummaryPanel';
import { BookInfo, BibleResponse, SummaryResult } from './types';
import { fetchChapter } from './services/bibleService';
import { summarizePassage, searchBibleAI } from './services/geminiService';
import { BIBLE_BOOKS } from './constants';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const App: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<BookInfo>(() => {
    const saved = localStorage.getItem('last_book');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<BookInfo>;
        const match = BIBLE_BOOKS.find((book) => book.id === parsed.id);
        if (match) return match;
      } catch {
        // Ignore parsing issues and fall back to defaults.
      }
    }
    return BIBLE_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    const saved = localStorage.getItem('last_chapter');
    return saved ? parseInt(saved) : 1;
  });
  const [chapterData, setChapterData] = useState<BibleResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ reference: string, reason: string }[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Verse range selection for summary
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [verseStartInput, setVerseStartInput] = useState('1');
  const [verseEndInput, setVerseEndInput] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Reset verse inputs when chapter changes
  useEffect(() => {
    if (chapterData) {
      setVerseStartInput('1');
      setVerseEndInput(chapterData.verses.length.toString());
    }
  }, [chapterData]);

  const loadChapter = useCallback(async (book: BookInfo, chapter: number, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchChapter(book.apiName, chapter, signal);
      setChapterData(data);
      localStorage.setItem('last_book', JSON.stringify(book));
      localStorage.setItem('last_chapter', chapter.toString());
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      setError('Capítulo não disponível. Tente outro livro ou tradução.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadChapter(selectedBook, selectedChapter, controller.signal);
    return () => controller.abort();
  }, [selectedBook, selectedChapter, loadChapter]);

  const handleBookSelect = (book: BookInfo, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setShowSummary(false);
    setSummary(null);
    setSearchResults(null);
    setSearchQuery('');
    setIsSidebarOpen(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchBibleAI(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToReference = (ref: string) => {
    // Basic parser for "Book Chapter:Verse"
    const match = ref.match(/(.+?)\s(\d+)/);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2]);
      const normalized = normalizeText(bookName);
      const book = BIBLE_BOOKS.find((b) => {
        const candidates = [b.name, b.id, b.apiName, ...(b.aliases ?? [])];
        return candidates.some((candidate) => normalizeText(candidate) === normalized);
      });
      if (book) {
        handleBookSelect(book, chapter);
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleSummarize = async (startVerse?: number, endVerse?: number) => {
    if (!chapterData) return;

    // Filter verses based on range
    const start = startVerse ?? 1;
    const end = endVerse ?? chapterData.verses.length;
    const filteredVerses = chapterData.verses.filter(
      v => v.verse >= start && v.verse <= end
    );

    if (filteredVerses.length === 0) return;

    const verseText = filteredVerses.map(v => `${v.verse}. ${v.text}`).join('\n');
    const rangeRef = start === end
      ? `${selectedBook.name} ${selectedChapter}:${start}`
      : `${selectedBook.name} ${selectedChapter}:${start}-${end}`;

    setShowSummary(true);
    setShowVerseSelector(false);
    setIsSummaryLoading(true);
    try {
      const result = await summarizePassage(rangeRef, verseText);
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSummarizeWithRange = () => {
    const start = parseInt(verseStartInput) || 1;
    const end = parseInt(verseEndInput) || (chapterData?.verses.length ?? 1);
    handleSummarize(start, end);
  };

  const navigateChapter = (direction: 'next' | 'prev') => {
    if (direction === 'prev') {
      if (selectedChapter > 1) {
        setSelectedChapter(prev => prev - 1);
      } else {
        const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
        if (bookIdx > 0) {
          const prevBook = BIBLE_BOOKS[bookIdx - 1];
          setSelectedBook(prevBook);
          setSelectedChapter(prevBook.chapters);
        }
      }
    } else {
      if (selectedChapter < selectedBook.chapters) {
        setSelectedChapter(prev => prev + 1);
      } else {
        const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
        if (bookIdx < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[bookIdx + 1];
          setSelectedBook(nextBook);
          setSelectedChapter(1);
        }
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--paper-bg)' }}>
      <Sidebar
        onSelect={handleBookSelect}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <header
          className="border-b flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 py-3 sm:py-0 backdrop-blur-xl sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex-1 flex items-center gap-3 w-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
              aria-label="Abrir menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-md group">
              <input
                type="text"
                placeholder="Busca Inteligente (ex: 'onde fala de amor?')"
                className="w-full border-transparent border focus:border-amber-500 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fa-solid fa-sparkles absolute left-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--amber-primary)' }}></i>
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </form>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon'}`}></i>
            </button>

            {/* Verse Range Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowVerseSelector(!showVerseSelector)}
                disabled={isLoading || isSummaryLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
                aria-label="Selecionar versículos"
              >
                <i className="fa-solid fa-list-ol text-sm"></i>
              </button>

              {/* Verse Range Dropdown */}
              {showVerseSelector && (
                <div
                  className="absolute right-0 top-12 w-72 p-4 rounded-2xl shadow-2xl border z-50"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                    <i className="fa-solid fa-wand-magic-sparkles mr-2" style={{ color: 'var(--amber-primary)' }}></i>
                    Resumir Versículos Específicos
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>De:</label>
                      <input
                        type="number"
                        min="1"
                        max={chapterData?.verses.length ?? 1}
                        value={verseStartInput}
                        onChange={(e) => setVerseStartInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Até:</label>
                      <input
                        type="number"
                        min="1"
                        max={chapterData?.verses.length ?? 1}
                        value={verseEndInput}
                        onChange={(e) => setVerseEndInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    {chapterData ? `Este capítulo tem ${chapterData.verses.length} versículos` : 'Carregando...'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowVerseSelector(false)}
                      className="flex-1 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSummarizeWithRange}
                      disabled={isSummaryLoading}
                      className="flex-1 px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--amber-primary)' }}
                    >
                      <i className="fa-solid fa-sparkles mr-1"></i>
                      Resumir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summarize Full Chapter Button */}
            <button
              onClick={() => handleSummarize()}
              disabled={isLoading || isSummaryLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: isDarkMode ? 'var(--amber-primary)' : '#1c1917',
                color: isDarkMode ? '#1c1917' : '#fafaf9'
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span className="hidden sm:inline">Resumo do Capítulo</span>
              <span className="sm:hidden">Resumo</span>
            </button>
          </div>
        </header>

        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {searchResults ? (
            <div className="max-w-3xl mx-auto py-12 px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Resultados da Busca AI</h2>
                <button
                  onClick={() => setSearchResults(null)}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Limpar
                </button>
              </div>
              <div className="space-y-4">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToReference(res.reference)}
                    className="w-full text-left p-6 border rounded-2xl shadow-sm hover:shadow-md transition-all group"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black" style={{ color: 'var(--amber-primary)' }}>{res.reference}</span>
                      <i
                        className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-all"
                        style={{ color: 'var(--text-muted)' }}
                      ></i>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{res.reason}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-20 px-8 lg:px-12">
              {isLoading ? (
                <div className="space-y-8 animate-pulse">
                  <div
                    className="h-10 rounded-lg w-1/3"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  ></div>
                  <div className="space-y-4">
                    <div className="h-5 rounded w-full" style={{ backgroundColor: 'var(--border-color)' }}></div>
                    <div className="h-5 rounded w-11/12" style={{ backgroundColor: 'var(--border-color)' }}></div>
                    <div className="h-5 rounded w-full" style={{ backgroundColor: 'var(--border-color)' }}></div>
                  </div>
                </div>
              ) : error ? (
                <div
                  className="text-center py-20 rounded-3xl border border-dashed"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <i className="fa-solid fa-book-open-reader text-5xl mb-6" style={{ color: 'var(--text-muted)' }}></i>
                  <p className="font-medium mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                  <button
                    onClick={() => loadChapter(selectedBook, selectedChapter)}
                    className="text-white px-8 py-3 rounded-full font-bold shadow-lg"
                    style={{ backgroundColor: 'var(--amber-primary)' }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : chapterData && (
                <div className="bible-text">
                  <div className="mb-12">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block"
                      style={{ color: 'var(--amber-primary)', opacity: 0.7 }}
                    >
                      Livro de {selectedBook.name}
                    </span>
                    <h1
                      className="text-6xl font-black leading-none"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Capítulo {selectedChapter}
                    </h1>
                  </div>

                  <div className="space-y-8">
                    {chapterData.verses.map((verse) => (
                      <div key={verse.verse} className="relative group flex gap-6">
                        <span
                          className="font-black text-sm pt-1 select-none w-8 text-right flex-shrink-0"
                          style={{ color: 'var(--amber-primary)', opacity: 0.5 }}
                        >
                          {verse.verse}
                        </span>
                        <p
                          className="text-xl leading-[1.7] flex-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {verse.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Footer Inside Content */}
                  <div
                    className="mt-20 pt-12 border-t flex flex-col items-center gap-8 pb-32"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                      Fim do Capítulo {selectedChapter}
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => navigateChapter('prev')}
                        className="group flex flex-col items-end gap-1 p-6 border rounded-3xl transition-all text-right"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                      >
                        <span className="text-[10px] uppercase font-black" style={{ color: 'var(--text-muted)' }}>Anterior</span>
                        <span
                          className="font-bold flex items-center gap-2 group-hover:text-amber-500 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <i className="fa-solid fa-arrow-left text-xs"></i>
                          Capítulo Anterior
                        </span>
                      </button>
                      <button
                        onClick={() => navigateChapter('next')}
                        className="group flex flex-col items-start gap-1 p-6 border rounded-3xl transition-all text-left"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                      >
                        <span className="text-[10px] uppercase font-black" style={{ color: 'var(--text-muted)' }}>Seguinte</span>
                        <span
                          className="font-bold flex items-center gap-2 group-hover:text-amber-500 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Próximo Capítulo
                          <i className="fa-solid fa-arrow-right text-xs"></i>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SummaryPanel
        summary={summary}
        isLoading={isSummaryLoading}
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {showSummary && <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 lg:hidden" onClick={() => setShowSummary(false)} />}
    </div>
  );
};

export default App;
