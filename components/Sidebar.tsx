
import React, { useEffect, useState } from 'react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '../constants';
import { BookInfo } from '../types';

interface SidebarProps {
  onSelect: (book: BookInfo, chapter: number) => void;
  selectedBook: BookInfo | null;
  selectedChapter: number;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedBook, selectedChapter, isOpen, onClose, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(selectedBook?.id || null);

  useEffect(() => {
    setExpandedBook(selectedBook?.id || null);
  }, [selectedBook]);

  const filterList = (list: BookInfo[]) =>
    list.filter(book => book.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const BookItem = ({ book }: { book: BookInfo }) => (
    <div className="group">
      <button
        onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
        className="w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between"
        style={{
          backgroundColor: selectedBook?.id === book.id
            ? 'var(--amber-light)'
            : 'transparent',
          color: selectedBook?.id === book.id
            ? 'var(--amber-accent)'
            : 'var(--text-secondary)',
          fontWeight: selectedBook?.id === book.id ? 'bold' : 'normal'
        }}
      >
        <span className="text-sm">{book.name}</span>
        <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${expandedBook === book.id ? 'rotate-90' : ''}`}></i>
      </button>

      {expandedBook === book.id && (
        <div
          className="grid grid-cols-5 gap-1.5 p-3 rounded-lg mt-1 mb-2 border"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}
        >
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => onSelect(book, ch)}
              className="aspect-square flex items-center justify-center text-[11px] rounded transition-all"
              style={
                selectedBook?.id === book.id && selectedChapter === ch
                  ? {
                    backgroundColor: 'var(--amber-primary)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                  }
                  : {
                    backgroundColor: 'var(--card-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }
              }
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
      className={`w-80 border-r h-full flex flex-col overflow-hidden fixed inset-y-0 left-0 z-40 transform transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border-color)' }}
    >
      <div
        className="p-5 border-b"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--amber-primary)' }}
            >
              <i className="fa-solid fa-book-bible text-sm"></i>
            </span>
            Bíblia Sagrada
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Encontrar livro..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i
            className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'var(--text-muted)' }}
          ></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {/* Velho Testamento */}
        {filterList(OLD_TESTAMENT).length > 0 && (
          <div>
            <h3
              className="px-3 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="h-[1px] flex-1" style={{ backgroundColor: 'var(--border-color)' }}></span>
              Velho Testamento
              <span className="h-[1px] flex-1" style={{ backgroundColor: 'var(--border-color)' }}></span>
            </h3>
            <div className="space-y-0.5">
              {filterList(OLD_TESTAMENT).map(book => <BookItem key={book.id} book={book} />)}
            </div>
          </div>
        )}

        {/* Novo Testamento */}
        {filterList(NEW_TESTAMENT).length > 0 && (
          <div>
            <h3
              className="px-3 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"
              style={{ color: 'var(--amber-primary)', opacity: 0.7 }}
            >
              <span className="h-[1px] flex-1" style={{ backgroundColor: 'var(--amber-light)' }}></span>
              Novo Testamento
              <span className="h-[1px] flex-1" style={{ backgroundColor: 'var(--amber-light)' }}></span>
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
