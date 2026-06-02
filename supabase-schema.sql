-- SignVault — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com → SQL Editor)

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_wallet text not null,
  owner_email text default '',
  walrus_blob_id text not null,
  file_type text not null,
  file_size bigint not null,
  is_encrypted boolean default false,
  status text default 'draft' check (status in ('draft', 'shared', 'signing', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  token text unique not null,
  password_hash text,
  expires_at timestamptz,
  allow_download boolean default false,
  require_email boolean default false,
  is_active boolean default true,
  view_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists signing_requests (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  signer_email text not null,
  signer_wallet text,
  status text default 'pending' check (status in ('pending', 'signed', 'declined')),
  signed_at timestamptz,
  sui_tx_hash text,
  order_index integer default 0
);

create table if not exists document_views (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid references share_links(id) on delete cascade,
  viewer_email text,
  opened_at timestamptz default now(),
  duration_seconds integer default 0,
  pages_viewed integer[] default '{}'
);

-- Indexes for common queries
create index if not exists documents_owner_wallet_idx on documents(owner_wallet);
create index if not exists share_links_token_idx on share_links(token);
create index if not exists share_links_document_id_idx on share_links(document_id);
create index if not exists signing_requests_document_id_idx on signing_requests(document_id);

-- Disable RLS (service role key bypasses anyway, but explicit is cleaner)
alter table documents disable row level security;
alter table share_links disable row level security;
alter table signing_requests disable row level security;
alter table document_views disable row level security;
