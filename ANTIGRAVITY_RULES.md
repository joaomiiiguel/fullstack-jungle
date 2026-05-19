# Jungle Gaming - Crash Game
## Especificações Técnicas Oficiais do Projeto

Este documento define TODAS as especificações técnicas obrigatórias do projeto.

A IA DEVE ler este arquivo antes de gerar qualquer código.

Nenhuma implementação pode violar estas especificações.

---

# 1. Objetivo do Sistema

Construir uma plataforma de Crash Game multiplayer em tempo real com:

- Arquitetura distribuída
- DDD
- Event Driven Architecture
- Comunicação assíncrona
- Precisão monetária
- WebSocket em tempo real
- Provably Fair
- Alta consistência
- Escalabilidade
- Testabilidade

---

# 2. Arquitetura Geral

## Arquitetura obrigatória

```
                        ┌──────────────────────────┐
                        │        Frontend           │
                        │   (React + Tailwind CSS)  │
                        └─────┬────────────┬────────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼────────┐
                        │         Kong               │
                        │      (API Gateway)         │
                        └─────┬────────────┬────────┘
                              │            │
                    ┌─────────▼──┐   ┌─────▼────────┐
                    │   Game     │   │   Wallet     │
                    │  Service   │   │   Service    │
                    │  (NestJS)  │   │   (NestJS)   │
                    └──┬─────┬──┘   └──────┬───────┘
                       │     └──────┬──────┘
                  ┌────▼────┐  ┌────▼──────────┐
                  │PostgreSQL│  │ RabbitMQ/SQS  │
                  └─────────┘  └───────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │  (IdP — OIDC)   │
              └─────────────────┘
```

---

# 3. Tecnologias Obrigatórias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js |
| Backend | NestJS + TypeScript (strict mode) |
| Banco | PostgreSQL com TypeORM |
| Mensageria | RabbitMQ |
| API Gateway | Kong |
| IdP | Keycloak |
| WebSocket | @nestjs/websockets |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Estado | TanStack Query (server state) + Context (client state) |
| Testes | Bun test runner |
| Docs | Swagger (@nestjs/swagger) |
| Infra | Docker Compose |

---

# 4. Estrutura do Monorepo

```
/jungle-gaming
  ├── frontend/
  ├── services/
  │   ├── games/   # Game Service
  │   └── wallets/ # Wallet Service
  └── packages/
  └── docker/
```

---

# 5. Bounded Contexts

## Game Context

Responsável apenas por:

- rounds
- bets
- crash engine
- websocket

Nunca acessar saldo diretamente.

---

## Wallet Context

Responsável apenas por:

- saldo
- transações financeiras

Nunca conhecer regras do jogo.

---

# 6. Estrutura Backend (NestJS)

## Estrutura obrigatória

```
src/
  domain/
  application/
  infrastructure/
  presentation/
```

## Regras

- Controllers nunca possuem regra de negócio
- Use cases ficam em application/use-cases
- Domain nunca importa NestJS
- Infrastructure nunca contém regra de domínio

---

# 7. Serviços Obrigatórios

## Frontend

Responsável por:

- UI do jogo
- Comunicação REST
- Comunicação WebSocket
- Login OIDC
- Estado da aplicação
- Renderização do gráfico

---

## Game Service

Responsável por:

- Ciclo de vida das rodadas
- Lógica do crash
- Apostas
- Cashouts
- WebSocket
- Provably Fair
- Histórico de rodadas

---

## Wallet Service

Responsável por:

- Carteira
- Crédito
- Débito
- Histórico financeiro
- Consistência monetária

---

# 8. Banco de Dados

## Regras obrigatórias

- Separar banco de Game e Wallet
- Migrations obrigatórias
- Constraints obrigatórias
- Índices obrigatórios
- Usar TypeORM com repository pattern

---

# 9. API Gateway (Kong)

## Regras obrigatórias

- JWT Validation
- Rate Limiting
- CORS
- Plugin

---

# 10. Regras do Domínio

## Round

- Apenas uma rodada ativa
- Rodada deve passar:
  - BETTING
  - RUNNING
  - CRASHED
  - FINISHED

---

## Bet

- Um jogador só pode apostar uma vez por rodada
- Bet não pode mudar valor após criação
- Cashout só pode ocorrer antes do crash

---

## Wallet

- Saldo nunca pode ser negativo
- Toda operação deve gerar transaction log

---

# 11. Eventos de Domínio

## Game Events

- round.created
- round.started
- round.crashed
- bet.placed
- bet.cashout.requested
- bet.cashout.completed

---

## Wallet Events

- wallet.debit.requested
- wallet.debit.completed
- wallet.credit.completed
- wallet.transaction.failed

---

# 12. Estratégia WebSocket

## Regras obrigatórias

WebSocket é apenas broadcast.

Cliente nunca altera estado via socket.

---

## REST faz

- bet
- cashout

---

## WebSocket envia

- multiplier updates
- round events
- bets
- cashouts

---

# 13. Estratégia Monetária

## Obrigatório

Todos valores monetários devem usar:

- bigint em centavos

---

## Exemplo

```
R$10,50 => 1050
```

---

## Nunca usar

- float
- number decimal

---

# 14. Anti-Patterns Proibidos

- fat controllers
- god services
- repositories genéricos
- any
- ts-ignore
- lógica de negócio em hooks React
- fetch direto em componentes
- shared mutable state

---

# 15. Restrições Obrigatórias

## Nunca violar

- Não gerar código que viole estas especificações
- Não usar Float para dinheiro
- Não usar variáveis globais
- Não usar banco de dados compartilhado
- Não usar comunicação síncrona
- Não usar JWT sem validação
- Não usar Dockerfile que não funcione

---

# 16. Testes Obrigatórios

## Unit

- entities
- value objects
- domain services
- provably fair

---

## E2E

- bet flow
- crash flow
- wallet consistency
- websocket sync

---

# 17. Checklist Obrigatório

Antes de gerar código, verificar:

- DDD
- Separação de camadas
- Regras monetárias
- Consistência distribuída
- WebSocket
- Eventos
- Testes necessários
- Segurança
- Performance
- Linguagem obrigatória para comentários, mensagens para o usuário e documentação: Português (BR)

---

# 19. Formato Obrigatório de Resposta da IA

````
# Regras Aplicadas

- ...

# Arquitetura Aplicada

- ...

# Eventos Criados

- ...

# Regras de Domínio Validadas

- ...

# Possíveis Riscos

- ...