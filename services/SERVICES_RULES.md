# Regras Services

> **Contexto:** Plataforma de cassino online baseada em microserviços, orientada a eventos, com foco em consistência financeira, tempo real, escalabilidade horizontal e integridade criptográfica (Provably Fair).
> **Versão do documento:** 1.0  
> **Última atualização:** 2026

---

# Stack

## Obrigatório

| Tecnologia       | Versão/Detalhe         | Papel                        |
|------------------|------------------------|------------------------------|
| Nest.js          | latest LTS             | Framework principal          |
| TypeScript       | strict mode            | Tipagem                      |
| PostgreSQL       | 15+                    | Persistência                 |
| RabbitMQ         | latest                 | Comunicação assíncrona       |
| Redis            | latest                 | Cache e pub/sub              |
| Docker           | latest                 | Containers                   |
| Kong Gateway     | latest                 | API Gateway                  |
| TypeORM          | —                      | ORM                          |

## Proibido adicionar sem aprovação

- ORMs adicionais
- Comunicação síncrona entre serviços via HTTP interno
- Shared database entre microserviços
- Cron jobs distribuídos sem coordenação
- Bibliotecas de cache paralelas ao Redis
- Event bus adicional sem justificativa arquitetural

---

# Arquitetura obrigatória

                      clients
                        ↓
                   Kong Gateway
                        ↓
          -----------------------------------
          |                                 |
          Game Service         Wallet Service
          |                           |
          PostgreSQL              PostgreSQL
          |                           |
          RabbitMQ Event Bus


 
# Estrutura de Pastas

```txt
├── games/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── tests/ (unit/ + e2e/)
│   ├── Dockerfile
│   ├── .env
│   └── package.json
├── wallets/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── tests/ (unit/ + e2e/)
│   ├── Dockerfile
│   ├── .env
│   └── package.json
```

---

# Separação de Camadas

| Camada             | Responsabilidade |
|--------------------|------------------|
| domain             | Regras de negócio |
| application        | Casos de uso     |
| infrastructure     | Banco, filas, providers |
| presentation       | REST/WebSocket/Consumers |

# Regras de Domínio

## Obrigatório
- Toda regra de negócio deve existir no domínio
- Entidades devem proteger seus invariantes
- Agregados devem controlar consistência transacional
- Value Objects devem ser imutáveis
- Regras financeiras devem ser determinísticas
- Estado da rodada nunca deve depender do frontend

## Proibido
- Regras de negócio em controllers
- Regras financeiras em consumers
- Mutação direta de entidades externas
- Uso de DTO como entidade de domínio
- Compartilhar entidades entre serviços

# Regras de Services

## Obrigatório

- Services devem representar casos de uso claros
- Um service por responsabilidade principal
- Services devem ser stateless
- Toda operação crítica deve ser idempotente
- Fluxos financeiros devem ser transacionais
- Services devem publicar eventos de domínio

## Convenção de Nome
[Domain][Action]Service

### Exemplos:

- PlaceBetService
- CashoutBetService
- StartRoundService
- DebitWalletService
- CreditWalletService

## Proibido

- Services gigantes (>200 linhas)
- Múltiplas responsabilidades no mesmo service
- Chamada direta ao banco fora de repositories
- Publicação de eventos fora da camada application
- Side effects escondidos

---

# Regras de Controllers

## Obrigatório

- Controllers devem apenas:
  - validar entrada;
  - autenticar;
  - chamar services;
  - retornar resposta.
- DTOs obrigatórios para entrada e saída
- ValidationPipe global habilitado
- Respostas tipadas

## Proibido

- Regra de negócio em controller
- Acesso direto ao banco
- Manipulação manual de transações
- Publicar eventos diretamente

# Regras de Repositories

## Obrigatório

- Repository abstrai persistência
- Métodos devem refletir linguagem de domínio
- Queries complexas encapsuladas
- Transações centralizadas

## Proibido

- SQL espalhado no código
- Query builders dentro de services
- Repositories com lógica de negócio

# Regras Financeiras

## Obrigatório

- Dinheiro sempre em centavos inteiros
- BIGINT ou Decimal
- Ledger imutável
- Todas as operações auditáveis
- Balance nunca negativo
- referenceId único por operação

## Proibido

- float/double para dinheiro
- DELETE em transações financeiras
- UPDATE destrutivo em ledger
- Recalcular saldo sem ledger

# Regras Provably Fair

## Obrigatório

- serverSeed secreta até o fim da rodada
- SHA256 da seed pública antes da rodada
- HMAC SHA256 determinístico
- nonce incremental
- Jogador deve conseguir verificar resultado

## Proibido

- Gerar crash após início da rodada
- Alterar crashPoint após publicação
- Reutilizar seeds
- Seeds previsíveis

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

- [eventos publicados/consumidos]
- [filas criadas]
- [integrações adicionadas]
- (omitir seção se não houver)

---

## ⚠️ Possíveis Riscos

- [race conditions]
- [consistência eventual]
- [edge cases]
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