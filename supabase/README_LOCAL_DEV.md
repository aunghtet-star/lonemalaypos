# Local Supabase Dev

## Commands

```bash
npm run supabase:login        # authenticate CLI (once)
npm run supabase:link         # link project (enter project ref)
npm run supabase:start        # start local stack (needs Docker)
npm run supabase:stop         # stop local stack
npm run supabase:db:pull      # pull remote schema into migrations
npm run supabase:db:push      # push local migrations to remote
```

## Migrations Flow
1. Edit SQL in a new file under `supabase/migrations/` with incremental number.
2. Run `npm run supabase:db:push` to apply.
3. Commit migration file.

## Seeding
Run seeds manually:
```bash
npx supabase db execute --file supabase/seed.sql
```

## Project Ref
After linking, update `supabase/config.toml` `ref = "<your-ref>"`.

## Notes
- Docker required for `supabase:start` local stack.
- For production tighten RLS policies and remove dev_* policies.
- Use `supabase secrets set` for functions if you add edge functions later.

