-- SAATHI: cases table (Victim <-> Guardian relay + risk-analysis persistence)
--
-- Run this once in the Supabase SQL Editor for your project:
-- https://supabase.com/dashboard/project/nfpwitwhscxawksrkvwj/sql/new
--
-- The app's secret-key server client bypasses RLS entirely (all writes go
-- through Next.js API routes), so RLS here only governs what an anon/public
-- key could ever read directly against the REST API. Case ids are random
-- UUIDs, so this is "unguessable link" privacy, consistent with the PRD's
-- non-goal of building enterprise auth for the hackathon MVP.

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  input_type text not null check (input_type in ('text', 'screenshot', 'voice')),
  analysis jsonb not null,
  guardian_evidence_summary text not null,
  status text not null default 'awaiting_guardian'
    check (status in ('pending', 'awaiting_guardian', 'resolved_safe', 'resolved_stop')),
  guardian_decision text check (guardian_decision in ('STOP', 'SAFE')),
  guardian_responded_at timestamptz
);

alter table public.cases enable row level security;

drop policy if exists "public read access" on public.cases;
create policy "public read access" on public.cases
  for select using (true);

-- No insert/update/delete policy for anon/authenticated: all mutations go
-- through server API routes using the secret key, which bypasses RLS.
