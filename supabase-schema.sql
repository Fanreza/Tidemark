-- Tidemark — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com → SQL Editor).
-- If your tables already exist from an older version, run the migration block
-- at the bottom of this file instead (the create-if-not-exists above won't alter them).

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_wallet text not null,
  owner_email text default '',
  walrus_blob_id text not null default '',
  walrus_object_id text,                       -- Sui object ID for deletable blobs
  file_type text not null,
  file_size bigint not null,
  is_encrypted boolean default false,
  seal_allowlist_id text,                      -- Seal allowlist object (encrypted docs)
  seal_encryption_id text,                     -- Seal encryption ID (encrypted docs)
  status text default 'pending' check (status in ('pending', 'draft', 'shared', 'signing', 'completed')),
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
  order_index integer default 0,
  signature_field text                         -- JSON: { x_pct, y_pct, page }
);

create table if not exists users (
  wallet_address text primary key,
  username text unique not null,
  created_at timestamptz default now()
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
create index if not exists signing_requests_signer_wallet_idx on signing_requests(signer_wallet);
create index if not exists users_username_idx on users(username);

-- Disable RLS (service role key bypasses anyway, but explicit is cleaner)
alter table documents disable row level security;
alter table share_links disable row level security;
alter table signing_requests disable row level security;
alter table document_views disable row level security;
alter table users disable row level security;

-- ─── Migration (run if your tables already exist from an older schema) ────────
-- Safe to run repeatedly. Brings an existing database up to date with the app.

alter table documents drop constraint if exists documents_status_check;
alter table documents add constraint documents_status_check
  check (status in ('pending','draft','shared','signing','completed'));

alter table documents add column if not exists walrus_object_id   text;
alter table documents add column if not exists seal_allowlist_id  text;
alter table documents add column if not exists seal_encryption_id text;

alter table signing_requests add column if not exists signature_field text;

create table if not exists users (
  wallet_address text primary key,
  username text unique not null,
  created_at timestamptz default now()
);
alter table users disable row level security;
