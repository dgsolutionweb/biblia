
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
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-stone-200 flex flex-col">
      <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <i className="fa-solid fa-sparkles text-amber-500"></i>
          Resumo por IA
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-stone-200 rounded-full transition-colors"
        >
          <i className="fa-solid fa-xmark text-stone-500"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <div className="space-y-2">
              <p className="font-medium text-stone-800">Analisando as Escrituras...</p>
              <p className="text-sm text-stone-500 px-8">O Gemini está extraindo a essência teológica desta passagem.</p>
            </div>
          </div>
        ) : summary && (
          <>
            <section>
              <h3 className="text-xl font-bold text-amber-900 mb-2">{summary.title}</h3>
              <p className="text-stone-700 leading-relaxed text-sm">
                {summary.content}
              </p>
            </section>

            <section className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Pontos Principais</h4>
              <ul className="space-y-3">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-stone-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Contexto Teológico</h4>
              <p className="text-xs text-stone-500 italic leading-relaxed">
                {summary.historicalContext}
              </p>
            </section>

            <div className="pt-6 border-t border-stone-100">
              <p className="text-[10px] text-stone-400 text-center uppercase tracking-widest">
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
