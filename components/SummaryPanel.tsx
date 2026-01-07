
import React from 'react';
import { SummaryResult } from '../types';

interface SummaryPanelProps {
  summary: SummaryResult | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, isLoading, isOpen, onClose }) => {
  if (!isOpen || (!isLoading && !summary)) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l flex flex-col"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      <div
        className="p-4 border-b flex justify-between items-center"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fa-solid fa-sparkles" style={{ color: 'var(--amber-primary)' }}></i>
          Resumo por IA
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor: 'var(--amber-light)', borderTopColor: 'var(--amber-primary)' }}
            ></div>
            <div className="space-y-2">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Analisando as Escrituras...</p>
              <p className="text-sm px-8" style={{ color: 'var(--text-secondary)' }}>
                O Gemini está extraindo a essência teológica desta passagem.
              </p>
            </div>
          </div>
        ) : summary && (
          <>
            <section>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--amber-accent)' }}
              >
                {summary.title}
              </h3>
              <p
                className="leading-relaxed text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {summary.content}
              </p>
            </section>

            <section
              className="p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--amber-light)', borderColor: 'var(--border-color)' }}
            >
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--amber-accent)' }}
              >
                Pontos Principais
              </h4>
              <ul className="space-y-3">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ backgroundColor: 'var(--amber-primary)', color: '#ffffff' }}
                    >
                      {idx + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Contexto Teológico
              </h4>
              <p
                className="text-xs italic leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {summary.historicalContext}
              </p>
            </section>

            <div
              className="pt-6 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <p
                className="text-[10px] text-center uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                Gerado com Inteligência Artificial para fins de estudo.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
