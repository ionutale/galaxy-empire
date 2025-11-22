# Galaxy Empire

A browser-based space strategy game built with SvelteKit, Drizzle ORM, and PostgreSQL.

## 🚀 Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Testing**: Vitest & Playwright
- **Containerization**: Docker

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd galaxy-empire/app
pnpm install
```

### 2. Start Database

Start the PostgreSQL database using Docker Compose:

```bash
docker compose up -d
```

### 3. Configure Environment

Create a `.env` file in the `app` directory:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env` to point to your local Postgres instance:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/galaxy_empire
```

### 4. Database Migration

Push the schema to the database:

```bash
pnpm db:push
```

### 5. Run Development Server

```bash
pnpm dev
```

The game will be available at `http://localhost:5173`.

## 🎮 Features

- **Resource Management**: Mine Metal, Crystal, and Fuel.
- **Base Building**: Construct and upgrade facilities like Mines, Shipyards, and Research Labs.
- **Research**: Unlock new technologies in the Research Lab.
- **Shipyard**: Build a fleet of ships, from Scouts to Battleships.
- **Game Loop**: Server-side tick processor handles construction queues, resource production, and fleet movements.

## 📜 Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm db:push`: Push schema changes to DB
- `pnpm db:studio`: Open Drizzle Studio to inspect DB
- `pnpm test:unit`: Run unit tests
- `pnpm lint`: Run linter
