# Despact

Plataforma pessoal de finanças orientada a decisões. O Despact não é apenas um registador de despesas: deve ajudar o utilizador a perceber a sua situação financeira e a decidir o que fazer a seguir.

## Estado actual

- Sprint 0 concluído: produto, arquitectura, decisões de domínio e desenho de dados documentados.
- Sprint 1 iniciado: aplicação Next.js 16 com TypeScript, App Router, Tailwind e ESLint criada.
- Ainda não existem Supabase, autenticação, base de dados, componentes shadcn/ui ou funcionalidades financeiras.

## Começar localmente

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm ci
npm run dev
```

Validação antes de integrar alterações:

```bash
npm run lint
npm run build
```

## Documentação

1. [Contexto do projecto](docs/PROJECT_CONTEXT.md) — fonte de verdade para visão e âmbito.
2. [Passagem para Claude Code](docs/HANDOFF_CLAUDE_CODE.md) — estado, próximos passos e procedimento de transição.
3. [Produto](docs/PRODUCT.md)
4. [Decisões de domínio](docs/DECISIONS.md)
5. [Arquitectura](docs/ARCHITECTURE.md)
6. [Desenho de dados](docs/DATABASE.md)
7. [Roadmap](docs/ROADMAP.md)

O ficheiro [CLAUDE.md](CLAUDE.md) contém as instruções operacionais para Claude Code.
