# Despact

Version: 0.1

---

# Project Vision

despact is a modern personal finance platform focused on helping users make better financial decisions.

This is NOT an expense tracker.

Expense tracking is only one feature.

The goal is to give users clarity, confidence and organization regarding their financial life.

The application should answer questions like:

- How am I financially?
- Am I on track to reach my goals?
- Can I comfortably buy this?
- How much am I saving?
- What should I do next?

The application should always prioritize decision making over data visualization.

---

# Initial User

Initially there is only one user (the project owner).

However, the whole architecture must be designed to support multiple users from day one.

Never make architectural decisions assuming there is only one user.

---

# Product Principles

Priority order:

## 1. Decision Making

The application should help users make financial decisions.

It should explain what the numbers mean instead of only showing them.

---

## 2. Automation

The architecture should assume that in the future data may come from:

- Open Banking
- CSV imports
- PDF imports
- Email parsing
- AI classification

Although V1 will mostly use manual input, everything should be designed with automation in mind.

---

## 3. Simplicity

The interface must be clean.

A user should understand their financial situation within 10 seconds.

Avoid unnecessary complexity.

---

## 4. Organization

Everything should feel centralized.

Different bank accounts should appear as one financial ecosystem.

---

## 5. Precision

Detailed analytics are important but should never make the interface harder to use.

---

# MVP Scope (LOCKED)

The MVP includes ONLY:

- Authentication
- Dashboard
- Accounts
- Transactions
- Categories
- Goals
- Net Worth
- Basic Insights
- Responsive Design

Nothing else.

---

# Out of Scope

Do NOT implement these features in V1.

- Open Banking
- OCR
- AI Chat
- Email integrations
- Investment recommendations
- Budget automation
- Notifications
- Shared accounts
- Family mode

These features belong to future versions.

---

# V2 Scope (decided by the owner on 17 July 2026)

The MVP is complete and in production. V2 unlocks, in this order:

- Open Banking (automatic transaction sync) via GoCardless Bank Account Data — Sprint 5
- Automatic categorization rules and CSV import — Sprint 6
- Launch preparation: onboarding tutorial (PWA install), About section, SMTP/email confirmation — Sprint 7

Investments: V3 may add investment account tracking (portfolio value in net worth). The app will NEVER give investment recommendations — this is a permanent product decision, not a phase.

Everything else in "Out of Scope" remains out of scope.

---

# Tech Stack

Frontend

- Next.js
- React
- TypeScript

UI

- Tailwind CSS
- shadcn/ui

Backend

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Deployment

- Vercel

Charts

Prefer Recharts.

---

# Architecture Principles

Use modern best practices.

Prefer clean architecture.

Prefer reusable components.

Avoid duplicated logic.

Strong typing is mandatory.

Keep business logic outside UI components whenever possible.

Create scalable folder structures.

Always think about future growth.

---

# Main Entities

Initial entities are expected to include:

User

Account

Transaction

Category

Goal

Insight

The database should be normalized.

---

# Dashboard Philosophy

The dashboard should answer:

How am I?

Not:

What happened?

The dashboard is the most important page of the application.

---

# User Experience

Adding a transaction should take less than 15 seconds.

Navigation should require as few clicks as possible.

Desktop and mobile experiences should both feel first-class.

---

# Working Method

We are NOT generating the entire application at once.

Development will happen in sprints.

Before implementing each sprint:

- explain the architecture
- explain important design decisions
- justify technical choices

Code quality is more important than speed.

---

# Sprint Roadmap

Sprint 0

Project setup

Documentation

Architecture

---

Sprint 1

Project creation

Supabase

Authentication

Deployment

---

Sprint 2

Accounts

Transactions

Categories

---

Sprint 3

Dashboard

Goals

Net Worth

---

Sprint 4

Insights

Polish

Responsive improvements

---

# Coding Rules

Never over-engineer.

Never add features outside the sprint.

Prefer readability over clever code.

Whenever a decision has multiple valid approaches, explain trade-offs before implementing.

Assume this project will become production-ready in the future.

---

End of Context
