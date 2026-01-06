
import React, { useEffect, useState } from 'react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '../constants';
import { BookInfo } from '../types';

interface SidebarProps {
  onSelect: (book: BookInfo, chapter: number) => void;
  selectedBook: BookInfo | null;
  selectedChapter: number;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedBook, selectedChapter, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(selectedBook?.id || null);

  useEffect(() => {
    setExpandedBook(selectedBook?.id || null);
  }, [selectedBook]);

  const filterList = (list: BookInfo[]) => 
    list.filter(book => book.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const BookItem = ({ book }: { book: BookInfo }) => (
    <div key={book.id} className="group">
      <button
        onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
        className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${
          selectedBook?.id === book.id 
          ? 'bg-amber-100 text-amber-900 font-bold' 
          : 'hover:bg-stone-100 text-stone-600'
        }`}
      >
        <span className="text-sm">{book.name}</span>
        <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${expandedBook === book.id ? 'rotate-90' : ''}`}></i>
      </button>
      
      {expandedBook === book.id && (
        <div className="grid grid-cols-5 gap-1.5 p-3 bg-stone-50/50 rounded-lg mt-1 mb-2 border border-stone-100">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => onSelect(book, ch)}
              className={`aspect-square flex items-center justify-center text-[11px] rounded transition-all ${
                selectedBook?.id === book.id && selectedChapter === ch
                ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-200'
                : 'bg-white border border-stone-200 text-stone-500 hover:border-amber-400 hover:text-amber-600'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`w-80 bg-white border-r border-stone-200 h-full flex flex-col overflow-hidden fixed inset-y-0 left-0 z-40 transform transition-transform lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-5 border-b border-stone-200 bg-stone-50/50">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-stone-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-600 text-white rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-book-bible text-sm"></i>
            </span>
            Bíblia Sagrada
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Encontrar livro..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {/* Velho Testamento */}
        {filterList(OLD_TESTAMENT).length > 0 && (
          <div>
            <h3 className="px-3 text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="h-[1px] flex-1 bg-stone-100"></span>
              Velho Testamento
              <span className="h-[1px] flex-1 bg-stone-100"></span>
            </h3>
            <div className="space-y-0.5">
              {filterList(OLD_TESTAMENT).map(book => <BookItem key={book.id} book={book} />)}
            </div>
          </div>
        )}

        {/* Novo Testamento */}
        {filterList(NEW_TESTAMENT).length > 0 && (
          <div>
            <h3 className="px-3 text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="h-[1px] flex-1 bg-amber-50"></span>
              Novo Testamento
              <span className="h-[1px] flex-1 bg-amber-50"></span>
            </h3>
            <div className="space-y-0.5">
              {filterList(NEW_TESTAMENT).map(book => <BookItem key={book.id} book={book} />)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
