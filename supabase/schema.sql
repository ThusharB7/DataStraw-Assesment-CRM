create table if not exists public.tickets (
 id bigint generated always as identity primary key, ticket_id text unique, customer_name text not null, customer_email text not null, subject text not null, description text not null,
 status text not null default 'Open' check (status in ('Open','In Progress','Closed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.notes (id bigint generated always as identity primary key, ticket_id text not null references public.tickets(ticket_id) on delete cascade, note_text text not null, created_at timestamptz not null default now());
create or replace function public.assign_ticket_id() returns trigger language plpgsql as $$begin new.ticket_id := 'TKT-' || lpad(new.id::text,4,'0'); return new; end;$$;
create or replace function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at := now(); return new; end;$$;
drop trigger if exists tickets_assign_ticket_id on public.tickets; create trigger tickets_assign_ticket_id before insert on public.tickets for each row execute function public.assign_ticket_id();
drop trigger if exists tickets_set_updated_at on public.tickets; create trigger tickets_set_updated_at before update on public.tickets for each row execute function public.set_updated_at();
alter table public.tickets enable row level security; alter table public.notes enable row level security;
