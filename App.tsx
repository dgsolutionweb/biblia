
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
  const [searchResults, setSearchResults] = useState<{reference: string, reason: string}[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleSummarize = async () => {
    if (!chapterData) return;
    setShowSummary(true);
    setIsSummaryLoading(true);
    try {
      const result = await summarizePassage(chapterData.reference, chapterData.text);
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummaryLoading(false);
    }
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
    <div className="flex h-screen overflow-hidden bg-[#faf9f6]">
      <Sidebar 
        onSelect={handleBookSelect} 
        selectedBook={selectedBook} 
        selectedChapter={selectedChapter} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 py-3 sm:py-0 bg-white/90 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex-1 flex items-center gap-3 w-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
              aria-label="Abrir menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-md group">
              <input 
                type="text"
                placeholder="Busca Inteligente (ex: 'onde fala de amor?')"
                className="w-full bg-stone-100 border-transparent border focus:border-amber-500 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fa-solid fa-sparkles absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 text-xs"></i>
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </form>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto mt-3 sm:mt-0">
            <button 
              onClick={handleSummarize}
              disabled={isLoading || isSummaryLoading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-stone-900 text-stone-50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Resuma este Capitulo
            </button>
          </div>
        </header>

        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {searchResults ? (
            <div className="max-w-3xl mx-auto py-12 px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-stone-800">Resultados da Busca AI</h2>
                <button onClick={() => setSearchResults(null)} className="text-sm text-stone-400 hover:text-stone-600">Limpar</button>
              </div>
              <div className="space-y-4">
                {searchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => navigateToReference(res.reference)}
                    className="w-full text-left p-6 bg-white border border-stone-100 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-amber-700">{res.reference}</span>
                      <i className="fa-solid fa-arrow-right text-stone-300 group-hover:translate-x-1 group-hover:text-amber-500 transition-all"></i>
                    </div>
                    <p className="text-sm text-stone-500 leading-relaxed">{res.reason}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-20 px-8 lg:px-12">
              {isLoading ? (
                <div className="space-y-8 animate-pulse">
                  <div className="h-10 bg-stone-200 rounded-lg w-1/3"></div>
                  <div className="space-y-4">
                    <div className="h-5 bg-stone-200 rounded w-full"></div>
                    <div className="h-5 bg-stone-200 rounded w-11/12"></div>
                    <div className="h-5 bg-stone-200 rounded w-full"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
                  <i className="fa-solid fa-book-open-reader text-5xl text-stone-200 mb-6"></i>
                  <p className="text-stone-500 font-medium mb-6">{error}</p>
                  <button 
                    onClick={() => loadChapter(selectedBook, selectedChapter)}
                    className="bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-amber-200"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : chapterData && (
                <div className="bible-text">
                  <div className="mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 mb-2 block">
                      Livro de {selectedBook.name}
                    </span>
                    <h1 className="text-6xl font-black text-stone-900 leading-none">
                      Capítulo {selectedChapter}
                    </h1>
                  </div>
                  
                  <div className="space-y-8">
                    {chapterData.verses.map((verse) => (
                      <div key={verse.verse} className="relative group flex gap-6">
                        <span className="text-amber-600/40 font-black text-sm pt-1 select-none w-8 text-right flex-shrink-0">
                          {verse.verse}
                        </span>
                        <p className="text-xl text-stone-800 leading-[1.7] flex-1">
                          {verse.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Footer Inside Content */}
                  <div className="mt-20 pt-12 border-t border-stone-200 flex flex-col items-center gap-8 pb-32">
                    <p className="text-stone-400 text-sm italic">Fim do Capítulo {selectedChapter}</p>
                    <div className="flex gap-4">
                       <button 
                        onClick={() => navigateChapter('prev')}
                        className="group flex flex-col items-end gap-1 p-6 bg-white border border-stone-100 rounded-3xl hover:border-amber-200 transition-all text-right"
                      >
                        <span className="text-[10px] uppercase font-black text-stone-400">Anterior</span>
                        <span className="text-stone-800 font-bold flex items-center gap-2 group-hover:text-amber-600">
                          <i className="fa-solid fa-arrow-left text-xs"></i>
                          Capítulo Anterior
                        </span>
                      </button>
                      <button 
                        onClick={() => navigateChapter('next')}
                        className="group flex flex-col items-start gap-1 p-6 bg-white border border-stone-100 rounded-3xl hover:border-amber-200 transition-all text-left"
                      >
                        <span className="text-[10px] uppercase font-black text-stone-400">Seguinte</span>
                        <span className="text-stone-800 font-bold flex items-center gap-2 group-hover:text-amber-600">
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
