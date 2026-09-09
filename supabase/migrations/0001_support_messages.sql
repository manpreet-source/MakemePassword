-- Support contact form submissions.
-- Run this in the Supabase SQL editor (or via `supabase db push`) for your project.

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  subject text not null,
  category text not null default 'general',
  message text not null,
  locale text,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  user_agent text,
  ip_hash text
);

comment on table public.support_messages is 'Contact form submissions from /support. Inserted by the anon key via app/api/support/contact; never read by the browser.';

alter table public.support_messages enable row level security;

-- The public anon key may only INSERT new messages. It can never read, update,
-- or delete rows — that keeps other visitors' submitted details private even
-- though inserts happen from an unauthenticated browser session via the API route.
drop policy if exists "Anyone can submit a support message" on public.support_messages;
create policy "Anyone can submit a support message"
  on public.support_messages
  for insert
  to anon
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and char_length(subject) between 1 and 300
    and char_length(message) between 1 and 5000
  );

-- No select/update/delete policies are created for `anon`, so RLS denies those
-- operations by default. Read submissions from the Supabase dashboard (as the
-- project owner) or wire up an authenticated /admin view using the existing
-- NextAuth-protected admin session if you want an in-app inbox later.

create index if not exists support_messages_created_at_idx on public.support_messages (created_at desc);
