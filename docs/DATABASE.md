# Database Migrations Guide

## Overview

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL.

- **Local Development**: Docker PostgreSQL on port 5433
- **Production**: Neon Serverless Postgres (via Vercel integration)

## How Migrations Work

### Automatic (Recommended)

**Migrations run automatically during Vercel deployment.**

When you push to GitHub:

1. Vercel triggers a build
2. `npm run build` runs `scripts/migrate.ts` first
3. Pending migrations are applied to Neon database
4. Then Next.js builds the app

This ensures your database schema is always in sync with your code.

### Manual (For Testing)

You can also run migrations manually:

```bash
# Apply to local database
npm run db:migrate

# Apply to production (requires .env.production)
vercel env pull .env.production
npm run db:migrate:prod
```

## Quick Reference

```bash
# Check database status
npm run db:status

# Generate migration from schema changes
npm run db:generate

# Apply migrations to LOCAL database
npm run db:migrate

# Apply migrations to PRODUCTION database (manual)
npm run db:migrate:prod

# Quick sync for development (skips migrations)
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio

# Local build without migrations
npm run build:local
```

## Workflow

### 1. Make Schema Changes

Edit `src/lib/db/schema.ts`:

```typescript
// Example: Add a new column
export const projects = pgTable("projects", {
  // ... existing columns
  archived: boolean("archived").default(false), // NEW
});
```

### 2. Generate Migration

```bash
npm run db:generate
```

This creates a new SQL file in `drizzle/` folder:

```
drizzle/
├── 0000_majestic_carnage.sql    # Initial migration (tables)
├── 0001_fuzzy_sinister_six.sql  # Performance indexes
├── 0002_*.sql                   # Your new migration
└── meta/
    └── _journal.json            # Migration history
```

### 3. Review Migration

Always review the generated SQL:

```bash
cat drizzle/0001_*.sql
```

### 4. Apply Locally & Test

```bash
npm run db:migrate    # Apply to local DB
npm run dev           # Test the app
```

### 5. Commit & Deploy

```bash
git add drizzle/
git commit -m "feat: add archived column to projects"
git push origin main
```

**That's it!** Vercel will automatically:

1. Run migrations on Neon
2. Build and deploy the app

## Commands Explained

| Command           | Description                            | When to Use             |
| ----------------- | -------------------------------------- | ----------------------- |
| `db:generate`     | Creates SQL migration file from schema | After editing schema.ts |
| `db:migrate`      | Applies migrations to local database   | Testing locally         |
| `db:migrate:prod` | Applies migrations to Neon (manual)    | Emergency/debugging     |
| `db:push`         | Syncs schema directly (no migration)   | Quick prototyping only  |
| `db:status`       | Shows database info and migrations     | Debugging               |
| `db:studio`       | Opens GUI to browse database           | Exploring data          |
| `db:reset`        | Resets local Docker database           | Starting fresh          |
| `build:local`     | Build without running migrations       | Local testing           |

## Important Notes

### ⚠️ db:push vs db:migrate

- **`db:push`**: Fast, but dangerous. Directly modifies database. **Never use in production.**
- **`db:migrate`**: Safe. Uses versioned SQL files. **Always use for production.**

### Migration Files Are Immutable

- Never edit migration files after they're applied
- They run in order (0000, 0001, 0002...)
- Each runs only once (tracked in `__drizzle_migrations` table)

### Rolling Back

Drizzle doesn't auto-rollback. To undo:

1. Create a new migration that reverses changes
2. Or restore from database backup (Neon has point-in-time recovery)

### Skipping Migrations

Set `SKIP_MIGRATIONS=true` in Vercel env vars to disable auto-migrations.

## Troubleshooting

### "No DATABASE_URL found"

Expected for local development. Use `db:migrate` directly or set up `.env.local`.

### "Migration table not found"

Database was created with `db:push`. Migrations will start tracking from now.

### "Connection refused"

For local, make sure Docker is running:

```bash
npm run docker:up
```

### Migration Failed on Vercel

1. Check Vercel build logs
2. Run `npm run db:migrate:prod` manually to see detailed error
3. Fix the issue and redeploy

## Schema Overview

The database has 7 tables:

| Table       | Purpose                              | Used By                    |
| ----------- | ------------------------------------ | -------------------------- |
| `users`     | User profiles from OAuth             | API routes via JWT session |
| `accounts`  | OAuth provider links (future)        | Not used (JWT strategy)    |
| `sessions`  | Database sessions (future)           | Not used (JWT strategy)    |
| `projects`  | User's projects for organizing ideas | Projects API               |
| `ideas`     | Captured ideas with time tracking    | Ideas API                  |
| `tags`      | User-defined tags (future)           | Not yet implemented        |
| `idea_tags` | Many-to-many ideas↔tags (future)     | Not yet implemented        |

### Performance Indexes

The following indexes optimize common queries:

- `projects_user_id_created_at_idx` - List user's projects by date
- `ideas_user_id_created_at_idx` - List user's ideas by date
- `ideas_project_id_idx` - Filter ideas by project
- `ideas_user_id_status_idx` - Filter ideas by status (inbox, in-progress, etc.)
- `ideas_scheduled_for_today_idx` - Daily focus view

## Auth Flow

The app uses **JWT sessions** (not database sessions):

1. User signs in with Google OAuth
2. JWT token stores user info (id, name, email, image)
3. First API call triggers `ensureUserInDb()` which creates user record
4. All subsequent API calls use user ID from JWT

This means:

- `accounts` and `sessions` tables exist but are **not used**
- They're kept for potential future switch to database sessions
- User creation happens lazily on first API interaction
