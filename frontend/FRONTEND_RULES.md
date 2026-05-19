# Regras Frontend

# Stack

## Obrigatório

- Next.js
- React
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- Context API

---

# Estrutura de Pastas

```txt
src/
  components/
  features/
  hooks/
  services/
  stores/
  pages/
```

---

# Regras de Componentes

## Obrigatório

- componentes devem ser dumb
- responsabilidade única
- UI reutilizável
- inputs controlados
- suporte à acessibilidade

## Proibido

- lógica de negócio em componentes
- chamadas API diretas em componentes
- componentes gigantes
- side effects no render

---

# Regras de Hooks

## Obrigatório

- isolar lógica de negócio
- lógica reutilizável
- usar custom hooks

## Proibido

- websocket dentro de componentes
- lógica duplicada
- manipulação direta do DOM

---

# Gerenciamento de Estado

## Server State

Usar SOMENTE:

- TanStack Query

---

## Client State

Usar SOMENTE:

- Context API

---

# Data Fetching

## Obrigatório

- query keys
- cache invalidation
- optimistic updates quando necessário
- loading states
- error states

## Proibido

- fetch dentro de useEffect
- requests duplicadas
- cache manual

---

# Regras de UI

## Obrigatório

- dark mode
- design responsivo
- identidade visual cassino
- skeleton loading
- toast notifications
- animações suaves

---

# Regras WebSocket

## Frontend NUNCA calcula multiplicador

Frontend apenas renderiza dados do servidor.

---

## Obrigatório

- reconnect strategy
- tratamento de status da conexão
- sincronização com servidor

---

# Regras de Formulários

## Obrigatório

- formulários controlados
- validação antes do submit
- desabilitar ações inválidas

## Proibido

- valores monetários inválidos
- submit durante loading

---

# Regras de Performance

## Obrigatório

- memoization quando necessário
- evitar re-renderizações desnecessárias
- lazy loading quando necessário

## Proibido

- rerender global
- estado duplicado

---

# Regras TypeScript

## Obrigatório

```json
{
  "strict": true
}
```

---

## Proibido

- any
- ts-ignore
- implicit any

---

# Anti-patterns

## Proibido

- prop drilling
- fetch em componentes
- hooks gigantes
- mutable shared state
- lógica duplicada

# Formato Obrigatório de Resposta da IA

````
# O que foi aplicado

- ...


# Eventos Criados


- ...

# Possíveis Riscos (Se houver)

- ...

# Checklist de Validação

-...
 
# Relatorio de Testes

-...