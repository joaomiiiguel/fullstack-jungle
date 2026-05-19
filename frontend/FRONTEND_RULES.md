# Regras Frontend

> **Contexto:** Aplicação de cassino online com foco em tempo real, alta performance e identidade visual imersiva.  
> **Versão do documento:** 1.0  
> **Última atualização:** 2026

---

# Stack

## Obrigatório

| Tecnologia       | Versão/Detalhe         | Papel                        |
|------------------|------------------------|------------------------------|
| Next.js          | Pages Router           | Framework principal          |
| TypeScript       | strict mode            | Tipagem                      |
| Tailwind CSS     | v4                     | Estilização                  |
| TanStack Query   | v5                     | Server state                 |
| Context API      | —                      | Client state                 |

## Proibido adicionar sem aprovação

- Gerenciadores de estado externos (Redux, Zustand, Jotai)
- Bibliotecas de formulário (react-hook-form, Formik) sem aprovação
- Qualquer lib que duplique responsabilidade da stack acima

---

# Estrutura de Pastas

```txt
src/
  pages/                  # Rotas Next.js (Pages Router)
  components/             # Componentes dumb/UI reutilizáveis
  hooks/                  # Hooks globais reutilizáveis
  services/               # Configuração de cliente HTTP / WebSocket
  stores/                 # Contextos globais (Context API)
  lib/                    # Utilitários e helpers
  types/                  # Tipos globais compartilhados
```

---

# Regras de Componentes

## Obrigatório

- Componentes **dumb**: recebem props, renderizam UI — sem lógica de negócio
- Responsabilidade única por componente
- UI reutilizável e desacoplada de domínio
- Inputs controlados com estado externo
- Suporte a acessibilidade: `aria-*`, roles semânticos, navegação por teclado
- Props tipadas com `interface` nomeada (ex: `ButtonProps`)
- Exportar como **named export**

## Proibido

- Lógica de negócio dentro de componentes
- Chamadas de API diretamente em componentes
- Side effects no corpo do render (fora de `useEffect`)
- Hardcode de strings visíveis ao usuário (usar constantes ou i18n)

## Exemplo de estrutura

```tsx
// ✅ Correto
interface BetButtonProps {
  amount: number;
  disabled: boolean;
  onConfirm: () => void;
}

export function BetButton({ amount, disabled, onConfirm }: BetButtonProps) {
  return (
    <button
      aria-label={`Apostar ${amount}`}
      disabled={disabled}
      onClick={onConfirm}
    >
      Apostar {amount}
    </button>
  );
}
```

---

# Regras de Hooks

## Obrigatório

- Isolar **toda** lógica de negócio em hooks
- Nomeação: `use[Domínio][Ação]` — ex: `useBetSubmit`, `useRoundResult`
- Retornar objetos nomeados (não arrays, exceto quando semântico)
- Um hook por responsabilidade

## Proibido

- Conexão WebSocket diretamente em componentes — usar `useWebSocket` global
- Lógica duplicada entre hooks — abstrair em hook base
- Manipulação direta do DOM sem `useRef`
- Hooks com mais de **100 linhas** — dividir em sub-hooks

---

# Gerenciamento de Estado

## Server State → TanStack Query (EXCLUSIVO)

```ts
// Query keys como constantes
export const QUERY_KEYS = {
  rounds: ['rounds'] as const,
  round: (id: string) => ['rounds', id] as const,
  userBalance: ['user', 'balance'] as const,
};
```

- Usar `queryClient.invalidateQueries` para invalidação após mutações
- Usar `optimisticUpdate` em ações críticas de UX (ex: apostar)
- Todo estado de loading/error deve vir do TanStack Query

## Client State → Context API (EXCLUSIVO)

- Usar apenas para estado **global de UI** (tema, modal aberto, sidebar)
- Não armazenar dados de servidor no Context
- Separar contextos por domínio — nunca um `AppContext` monolítico

## Regra de ouro

```
Dado que veio do servidor? → TanStack Query
Dado que é estado local da UI? → Context API ou useState local
```

---

# Data Fetching

## Obrigatório

- Toda chamada HTTP via **service function** tipada
- Query keys semânticas e centralizadas
- Cache invalidation explícita após mutações
- Optimistic updates em ações visíveis ao usuário
- Tratar estados: `isLoading`, `isError`, `isEmpty`

## Proibido

- `fetch` ou `axios` diretamente em componentes ou hooks de UI
- `useEffect` para buscar dados — usar `useQuery`
- Requests duplicadas (configurar `staleTime` adequado)
- Cache manual paralelo ao TanStack Query

```ts
// ✅ Correto
// services/rounds.ts
export async function fetchRound(id: string): Promise<Round> {
  const { data } = await api.get(`/rounds/${id}`);
  return data;
}

// hooks/useRound.ts
export function useRound(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.round(id),
    queryFn: () => fetchRound(id),
    staleTime: 5_000,
  });
}
```

---

# Regras WebSocket

## Princípio crítico

> **O frontend NUNCA calcula, processa ou infere dados de jogo.**  
> O frontend é um **display** — apenas renderiza o que o servidor envia.

## Obrigatório

- Hook dedicado: `useGameSocket` com gestão completa do ciclo de vida
- Reconnect automático com backoff exponencial
- Exibir status da conexão ao usuário (conectado / reconectando / desconectado)
- Sincronização de estado local com eventos do servidor via `queryClient.setQueryData`
- Tipagem forte para todos os eventos recebidos

## Proibido

- Calcular multiplicador, resultado ou qualquer dado de jogo no frontend
- Confiar em estado local para decisões críticas sem confirmar com servidor
- Criar múltiplas instâncias de WebSocket para o mesmo canal

```ts
// Tipagem de eventos
type ServerEvent =
  | { type: 'ROUND_START'; payload: RoundStartPayload }
  | { type: 'MULTIPLIER_UPDATE'; payload: MultiplierPayload }
  | { type: 'ROUND_END'; payload: RoundEndPayload };
```

---

# Regras de Formulários

## Obrigatório

- Formulários **sempre** controlados
- Validação no cliente antes do submit (schema Zod recomendado)
- Desabilitar submit enquanto `isLoading`
- Feedback imediato de erro por campo
- Prevenir duplo submit

## Proibido

- Valores monetários sem formatação e validação adequada
- Submit sem validação prévia
- Inputs não controlados (`defaultValue` sem controle)

```tsx
// ✅ Validação antes do submit
const schema = z.object({
  amount: z.number().min(1).max(MAX_BET),
});
```

---

# Regras de UI

## Obrigatório

- **Dark mode nativo** — design pensado primeiro para dark
- **Design responsivo** — mobile-first, breakpoints: `sm / md / lg / xl`
- **Identidade visual cassino** — cores vibrantes, contraste alto, atmosfera imersiva
- **Skeleton loading** em todo conteúdo assíncrono
- **Toast notifications** para feedback de ações (sucesso, erro, aviso)
- **Animações suaves** — preferir `transition` e `animate` do Tailwind; evitar jank

## Padrão de feedback visual

| Situação            | Componente            |
|---------------------|-----------------------|
| Carregando dados    | `<Skeleton />`        |
| Ação bem-sucedida   | Toast success         |
| Erro de ação        | Toast error           |
| Erro de página      | `<ErrorBoundary />`   |
| Sem dados           | Empty state component |

---

# Regras de Performance

## Obrigatório

- `React.memo` em componentes que recebem props estáveis mas re-renderizam com frequência
- `useMemo` / `useCallback` apenas quando há custo computacional mensurável
- `lazy()` + `Suspense` para rotas e componentes pesados não críticos
- Imagens via `next/image` com tamanhos declarados

## Proibido

- Re-render global por mudança de estado local — manter estado no nível mínimo necessário
- Estado duplicado entre Context e TanStack Query
- `useEffect` encadeados para derivar estado — usar `useMemo`

---

# Regras TypeScript

## Configuração obrigatória

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Obrigatório

- Tipar **todas** as props, retornos de função e respostas de API
- Usar `interface` para objetos de domínio, `type` para unions e utilitários
- Usar `satisfies` ao declarar objetos contra um tipo

## Proibido

- `any` — substituir por `unknown` + type guard
- `// @ts-ignore` — corrigir o tipo ou usar `// @ts-expect-error` com justificativa
- `implicit any` (coberto pelo strict)
- Type assertions sem validação (`as X` em dados externos)

---

# Anti-patterns — Referência rápida

| Anti-pattern              | Alternativa correta                        |
|---------------------------|--------------------------------------------|
| Prop drilling 3+ níveis   | Context API ou composição                  |
| fetch em componente       | `useQuery` via hook dedicado               |
| Hook com 100+ linhas      | Dividir em hooks menores                   |
| Mutable shared state      | Imutabilidade + Context/Query              |
| Lógica duplicada          | Hook ou util compartilhado                 |
| `useEffect` para fetch    | `useQuery`                                 |
| `any` no TypeScript       | `unknown` + type guard                     |
| Múltiplos WebSockets      | Singleton via hook centralizado            |

---

# Formato Obrigatório de Resposta da IA

Toda resposta de implementação deve seguir esta estrutura:

```markdown
## ✅ O que foi aplicado

- [descrição objetiva de cada mudança implementada]

---

## 🔗 Eventos / Integrações Criadas

- [eventos WebSocket, Query Keys, Context consumers adicionados]
- (omitir seção se não houver)

---

## ⚠️ Possíveis Riscos

- [race conditions, edge cases, limitações conhecidas]
- (omitir seção se não houver)

---

## ✔️ Checklist de Validação

- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Nenhum `any` introduzido
- [ ] Componente sem lógica de negócio
- [ ] Estados de loading e erro tratados
- [ ] Acessibilidade verificada (aria, roles)
- [ ] Responsivo em mobile e desktop

---

## 🧪 Relatório de Testes

- Casos cobertos: [lista]
- Casos de borda verificados: [lista]
- Casos não cobertos (e motivo): [lista]
```