# Story: Orientacao Biblica por Situacao de Vida

## Contexto
Adicionar um campo dedicado para a pessoa descrever como esta no momento (problema, dor, dificuldade, necessidade) e receber orientacao pratica baseada em versiculos biblicos.

## Acceptance Criteria
- [x] Existe um campo de texto para descrever a situacao atual.
- [x] Existe um fluxo de IA que interpreta a situacao e retorna orientacao biblica estruturada.
- [x] O resultado mostra referencias, explicacao e aplicacao pratica para a vida real.
- [x] O app tenta carregar o texto real dos versiculos para reduzir alucinacao.
- [x] Cada referencia pode ser clicada para navegar ao capitulo correspondente.

## Checklist de Implementacao
- [x] Criar tipos para resultado de orientacao.
- [x] Implementar servico de IA para orientacao por contexto de vida.
- [x] Implementar enriquecimento com texto real dos versiculos via Bible API.
- [x] Integrar novo formulario e renderizacao no fluxo principal da interface.
- [x] Reposicionar a funcionalidade para abrir por botao no header (ao lado de "Resumo do Capitulo").
- [x] Ajustar tipagem de componente existente para compatibilidade com `npx tsc --noEmit`.
- [ ] Validar com `npm run lint`.
- [ ] Validar com `npm run typecheck`.
- [ ] Validar com `npm test`.
- [x] Validar com `npm run build`.
- [x] Validar com `npx tsc --noEmit` (fallback enquanto `npm run typecheck` nao existe).

## File List
- [App.tsx](../../App.tsx)
- [services/geminiService.ts](../../services/geminiService.ts)
- [services/bibleService.ts](../../services/bibleService.ts)
- [components/Sidebar.tsx](../../components/Sidebar.tsx)
- [types.ts](../../types.ts)
- [docs/stories/2026-02-25-orientacao-biblica-ai.md](../../docs/stories/2026-02-25-orientacao-biblica-ai.md)
