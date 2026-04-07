# Database Migrations Guide

## Overview

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL.

- **Local Development**: Docker PostgreSQL on port 5433
- **Production**: Neon Serverless Postgres (via Vercel integration)

## Quick Reference

```bash
# Check database status
npm run db:status

# Generate migration from schema changes
npm run db:generate

# Apply migrations to LOCAL database
npm run db:migrate

# Apply migrations to PRODUCTION database
npm run db:migrate:prod

# Quick sync for development (skips migrations)
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

## Workflow

### 1. Making Schema Changes

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
├── 0000_majestic_carnage.sql    # Initial migration
├── 0001_sweet_hulk.sql          # Your new migration
└── meta/
    └── _journal.json            # Migration history
```

### 3. Review Migration

Always review the generated SQL before applying:

```bash
cat drizzle/0001_*.sql
```

### 4. Apply to Local Database

```bash
npm run db:migrate
```

### 5. Test Your Changes

Run the app and verify everything works:

```bash
npm run dev
```

### 6. Apply to Production

After testing locally, deploy to production:

```bash
# First, pull production credentials
vercel env pull .env.production

# Then run production migration
npm run db:migrate:prod
```

The script will:

- Show connection info
- Ask for confirmation (it's production!)
- Apply pending migrations

### 7. Commit & Deploy

```bash
git add drizzle/
git commit -m "feat: add archived column to projects"
git push origin main
```

## Commands Explained

| Command           | Description                                    | When to Use             |
| ----------------- | ---------------------------------------------- | ----------------------- |
| `db:generate`     | Creates SQL migration file from schema changes | After editing schema.ts |
| `db:migrate`      | Applies pending migrations to database         | Before testing changes  |
| `db:migrate:prod` | Applies migrations to production (Neon)        | After testing locally   |
| `db:push`         | Syncs schema directly (no migration file)      | Quick prototyping only  |
| `db:status`       | Shows database info and applied migrations     | Debugging               |
| `db:studio`       | Opens GUI to browse database                   | Exploring data          |
| `db:reset`        | Resets local Docker database                   | Starting fresh          |

## Important Notes

### ⚠️ db:push vs db:migrate

- **`db:push`**: Fast, but dangerous. Directly modifies database without migration files. **Never use in production.**
- **`db:migrate`**: Safe. Uses versioned migration files. **Always use for production.**

### Migration Files

- Migration files in `drizzle/` are **immutable** - never edit them after applying
- They are versioned and applied in order
- Each migration runs only once (tracked in `__drizzle_migrations` table)

### Rolling Back

Drizzle doesn't have automatic rollback. To undo a migration:

1. Create a new migration that reverses the changes
2. Or restore from database backup

### Production Safety

The `db:migrate:prod` script:

- Detects production databases (Neon, Supabase, AWS)
- Shows warning and requires confirmation
- Uses secure SSL connection

## Troubleshooting

### "Migration table not found"

Database was created with `db:push`. Migrations will start tracking from now on.

### "Connection refused"

For local: Make sure Docker is running:

```bash
npm run docker:up
```

### "SSL required"

Production databases require SSL. The migration script handles this automatically.

### "Permission denied"

Check your database credentials in `.env.local` or `.env.production`.
