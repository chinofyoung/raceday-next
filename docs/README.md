# RaceDay Next — Documentation

RaceDay Next is a Philippine race event management platform that lets organizers publish and manage running events while allowing runners to discover, register, and pay for races. Built with Next.js 16 + React 19 + TypeScript, backed by Convex for real-time data, Clerk for authentication, Tailwind CSS v4 + shadcn/ui for the UI, and Xendit for payment processing.

---

## Where to start

| You are... | Go to... |
|---|---|
| New to the project | [Onboarding](#onboarding) |
| Building a feature | [Reference](#reference) |
| An AI agent | [AI Reference](#ai-reference) |

> Design language (colors, typography, component patterns, button styles) lives in **[`CLAUDE.md`](../CLAUDE.md)** at the project root.

---

## Onboarding

Step-by-step guides for getting oriented and productive.

| Doc | What it covers |
|---|---|
| [Getting Started](onboarding/getting-started.md) | Environment setup, prerequisites, first run |
| [Architecture](onboarding/architecture.md) | High-level architecture and data flow |
| [Key Concepts](onboarding/key-concepts.md) | Domain concepts — roles, event lifecycles, features |
| [Project Structure](onboarding/project-structure.md) | Annotated directory tree |

---

## Reference

Detailed reference for every system in the codebase.

| Doc | What it covers |
|---|---|
| [Data Model](reference/data-model.md) | All Convex tables, fields, indexes, and relationships |
| [API Routes](reference/api-routes.md) | All Next.js API routes |
| [Convex Functions](reference/convex-functions.md) | All queries, mutations, and actions |
| [Auth Flow](reference/auth-flow.md) | Clerk + Convex auth pipeline, roles, permissions |
| [Payment Flow](reference/payment-flow.md) | Xendit integration end-to-end |
| [Forms](reference/forms.md) | Multi-step form patterns |
| [Components](reference/components.md) | Component organization by feature area |
| [Services, Hooks & Utils](reference/services-hooks-utils.md) | Service layer, hooks, utilities, validations |

---

## AI Reference

Optimized for AI agents and tools working in this codebase.

| Doc | What it covers |
|---|---|
| [Codebase Map](ai-reference/codebase-map.md) | Complete annotated file tree |
| [Conventions](ai-reference/conventions.md) | Naming, imports, patterns, coding style |
| [Common Tasks](ai-reference/common-tasks.md) | Step-by-step recipes for frequent changes |
| [File Relationships](ai-reference/file-relationships.md) | Which files change together |
