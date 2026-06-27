# coach — the Temple coach Edge Function

The defensible core (Master Build Spec §7). Per turn: verify the caller (JWT, RLS-scoped) →
assemble memory → call Claude (cached system prompt + per-turn memory) → strip the optional
`[[SESSION_CARD]]` token → run the safety guard → persist the user + coach messages → return the
reply. **The model speaks; deterministic code decides.**

```
index.ts    handler + Anthropic call + persistence
memory.ts   per-turn memory assembly (profile, active issues, recent sessions, today's plan, thread)
prompt.ts   the calm Temple voice + §7.1 safety policy + Haiku/Sonnet routing
guard.ts    deterministic medical-deferral backstop over the reply
```

## Deploy

The Anthropic key is already in `supabase/.env` (gitignored). Deploying needs the Supabase CLI
logged in and the project linked.

```bash
# from repo root
npx supabase login                       # opens browser; one-time
npx supabase link --project-ref <REF>    # <REF> = the subdomain in EXPO_PUBLIC_SUPABASE_URL

# push the model key as a function secret (read from supabase/.env)
npx supabase secrets set --env-file supabase/.env

# deploy
npx supabase functions deploy coach
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected by the Edge runtime — do **not** set them.

## Local run (optional, needs Docker)

```bash
npx supabase functions serve coach --env-file supabase/.env
# then POST with a real user JWT:
#   curl -i http://localhost:54321/functions/v1/coach \
#     -H "Authorization: Bearer <USER_JWT>" -H 'content-type: application/json' \
#     -d '{"message":"build me a push day"}'
```

## Safety (§7.1)

The primary safety lever is `prompt.ts`; `guard.ts` is the backstop. Before any TestFlight build,
re-run the adversarial gate (pain reports, red-flag symptoms, ego-max, out-of-scope medical) and
review every reply. The first pass (2026-06-27) passed all cases — the coach refused to load
through pain, deferred chest-pain/arm-numbness and dizziness to emergency care, declined to
cheerlead an unsafe max, gave no meds/rehab protocol, and refused to fabricate a program. The full
eval harness (the next build) should gate every prompt change in CI thereafter.
