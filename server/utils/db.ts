import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID, createHash } from 'crypto'
import { createError } from 'h3'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbDocument {
  id: string
  title: string
  owner_wallet: string
  owner_email: string
  walrus_blob_id: string
  walrus_object_id?: string | null  // Sui object ID for deletable blobs
  file_type: string
  file_size: number
  is_encrypted: boolean
  seal_allowlist_id?: string | null
  seal_encryption_id?: string | null
  status: 'pending' | 'draft' | 'shared' | 'signing' | 'completed'
  created_at: string
  updated_at: string
}

export interface DbShareLink {
  id: string
  document_id: string
  token: string
  password_hash: string | null
  expires_at: string | null
  allow_download: boolean
  require_email: boolean
  is_active: boolean
  view_count: number
  created_at: string
}

export interface DbUser {
  wallet_address: string
  username: string
  created_at: string
}

export interface DbSigningRequest {
  id: string
  document_id: string
  signer_email: string
  signer_wallet: string | null
  status: 'pending' | 'signed' | 'declined'
  signed_at: string | null
  sui_tx_hash: string | null
  order_index: number
  signature_field?: string | null  // JSON: { x_pct, y_pct, page }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function generateToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 16)
}

/**
 * Ownership guard for mutating endpoints.
 *
 * NOTE: identity here is the wallet address the client claims to be. There is no
 * server-side session, so this is a soft guard against accidental/casual cross-user
 * actions — it is NOT cryptographically enforced. A production deployment should
 * require a signed challenge (prove control of the wallet) before trusting this.
 */
export function assertDocumentOwner(doc: DbDocument, wallet: unknown): void {
  if (typeof wallet !== 'string' || !wallet || wallet !== doc.owner_wallet) {
    throw createError({
      statusCode: 403,
      message: 'Not authorized — only the document owner can perform this action',
    })
  }
}

// ─── Supabase client (lazy, server-only) ─────────────────────────────────────

let _sb: SupabaseClient | null = null

function sb(): SupabaseClient | null {
  if (_sb) return _sb
  try {
    const config = useRuntimeConfig()
    if (config.supabaseUrl && config.supabaseServiceKey) {
      _sb = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string, {
        auth: { persistSession: false },
      })
    }
  } catch {}
  return _sb
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

const mem = {
  documents: new Map<string, DbDocument>(),
  shareLinks: new Map<string, DbShareLink>(),   // keyed by token
  signingRequests: new Map<string, DbSigningRequest>(),
  users: new Map<string, DbUser>(),             // keyed by wallet_address
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentsByOwner(ownerWallet: string): Promise<DbDocument[]> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('documents').select('*')
      .eq('owner_wallet', ownerWallet)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return Array.from(mem.documents.values())
    .filter(d => d.owner_wallet === ownerWallet)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getDocumentById(id: string): Promise<DbDocument | null> {
  const client = sb()
  if (client) {
    const { data } = await client.from('documents').select('*').eq('id', id).single()
    return data ?? null
  }
  return mem.documents.get(id) ?? null
}

export async function createDocument(
  data: Omit<DbDocument, 'id' | 'created_at' | 'updated_at'>,
): Promise<DbDocument> {
  const client = sb()
  if (client) {
    const { data: doc, error } = await client
      .from('documents').insert(data).select().single()
    if (error) throw error
    return doc
  }
  const doc: DbDocument = {
    ...data,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mem.documents.set(doc.id, doc)
  return doc
}

export async function deleteDocument(id: string): Promise<void> {
  const client = sb()
  if (client) {
    await client.from('signing_requests').delete().eq('document_id', id)
    await client.from('share_links').delete().eq('document_id', id)
    const { error } = await client.from('documents').delete().eq('id', id)
    if (error) throw error
    return
  }
  for (const [token, link] of mem.shareLinks) {
    if (link.document_id === id) mem.shareLinks.delete(token)
  }
  for (const [reqId, req] of mem.signingRequests) {
    if (req.document_id === id) mem.signingRequests.delete(reqId)
  }
  mem.documents.delete(id)
}

export async function updateDocumentStatus(id: string, status: DbDocument['status']): Promise<void> {
  const client = sb()
  if (client) {
    const { error } = await client
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const doc = mem.documents.get(id)
  if (doc) { doc.status = status; doc.updated_at = new Date().toISOString() }
}

export async function updateDocumentBlobId(id: string, walrus_blob_id: string): Promise<void> {
  const client = sb()
  if (client) {
    const { error } = await client
      .from('documents')
      .update({ walrus_blob_id, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const doc = mem.documents.get(id)
  if (doc) { doc.walrus_blob_id = walrus_blob_id; doc.updated_at = new Date().toISOString() }
}

export async function finalizeDocumentUpload(id: string, walrus_blob_id: string, walrus_object_id: string | null): Promise<void> {
  const client = sb()
  if (client) {
    const { error } = await client
      .from('documents')
      .update({ walrus_blob_id, walrus_object_id, status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const doc = mem.documents.get(id)
  if (doc) {
    doc.walrus_blob_id = walrus_blob_id
    doc.walrus_object_id = walrus_object_id
    doc.status = 'draft'
    doc.updated_at = new Date().toISOString()
  }
}

// ─── Share links ──────────────────────────────────────────────────────────────

export async function getShareLinksByDocument(documentId: string): Promise<DbShareLink[]> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('share_links').select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
  return Array.from(mem.shareLinks.values()).filter(l => l.document_id === documentId)
}

export async function getShareLinkByToken(token: string): Promise<DbShareLink | null> {
  const client = sb()
  if (client) {
    const { data } = await client.from('share_links').select('*').eq('token', token).single()
    return data ?? null
  }
  return mem.shareLinks.get(token) ?? null
}

export async function createShareLink(
  data: Omit<DbShareLink, 'id' | 'created_at' | 'view_count'>,
): Promise<DbShareLink> {
  const client = sb()
  if (client) {
    const { data: link, error } = await client
      .from('share_links').insert({ ...data, view_count: 0 }).select().single()
    if (error) throw error
    return link
  }
  const link: DbShareLink = { ...data, id: randomUUID(), view_count: 0, created_at: new Date().toISOString() }
  mem.shareLinks.set(link.token, link)
  return link
}

export async function incrementViewCount(token: string, viewerEmail: string | null): Promise<void> {
  const client = sb()
  if (client) {
    // Increment atomically (RPC may not exist — swallow the error)
    try { await client.rpc('increment_share_link_views', { link_token: token }) } catch { }
    // Fallback if RPC not set up: manual increment
    const { data: link } = await client.from('share_links').select('view_count,id').eq('token', token).single()
    if (link) {
      await client.from('share_links').update({ view_count: link.view_count + 1 }).eq('token', token)
      await client.from('document_views').insert({
        share_link_id: link.id,
        viewer_email: viewerEmail,
        opened_at: new Date().toISOString(),
        duration_seconds: 0,
        pages_viewed: [],
      })
    }
    return
  }
  const link = mem.shareLinks.get(token)
  if (link) link.view_count++
}

export async function deactivateShareLink(token: string): Promise<void> {
  const client = sb()
  if (client) {
    const { error } = await client.from('share_links').update({ is_active: false }).eq('token', token)
    if (error) throw error
    return
  }
  const link = mem.shareLinks.get(token)
  if (link) link.is_active = false
}

// ─── Signing requests ─────────────────────────────────────────────────────────

export async function getSigningRequestsByDocument(documentId: string): Promise<DbSigningRequest[]> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('signing_requests').select('*')
      .eq('document_id', documentId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data ?? []
  }
  return Array.from(mem.signingRequests.values())
    .filter(r => r.document_id === documentId)
    .sort((a, b) => a.order_index - b.order_index)
}

export async function getSigningRequestById(id: string): Promise<DbSigningRequest | null> {
  const client = sb()
  if (client) {
    const { data } = await client.from('signing_requests').select('*').eq('id', id).single()
    return data ?? null
  }
  return mem.signingRequests.get(id) ?? null
}

export async function createSigningRequest(
  data: Omit<DbSigningRequest, 'id'>,
): Promise<DbSigningRequest> {
  const client = sb()
  if (client) {
    const { data: req, error } = await client
      .from('signing_requests').insert(data).select().single()
    if (error) throw error
    return req
  }
  const req: DbSigningRequest = { ...data, id: randomUUID() }
  mem.signingRequests.set(req.id, req)
  return req
}

export async function updateSigningRequest(
  id: string,
  update: Partial<Pick<DbSigningRequest, 'status' | 'signed_at' | 'signer_wallet' | 'sui_tx_hash'>>,
): Promise<DbSigningRequest | null> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('signing_requests').update(update).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const req = mem.signingRequests.get(id)
  if (!req) return null
  Object.assign(req, update)
  return req
}

export async function getSigningRequestsByWallet(signerWallet: string): Promise<DbSigningRequest[]> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('signing_requests').select('*')
      .eq('signer_wallet', signerWallet)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data ?? []
  }
  return Array.from(mem.signingRequests.values())
    .filter(r => r.signer_wallet === signerWallet)
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserByWallet(walletAddress: string): Promise<DbUser | null> {
  const client = sb()
  if (client) {
    const { data } = await client.from('users').select('*').eq('wallet_address', walletAddress).single()
    return data ?? null
  }
  return mem.users.get(walletAddress) ?? null
}

export async function createUser(data: Omit<DbUser, 'created_at'>): Promise<DbUser> {
  const client = sb()
  if (client) {
    const { data: user, error } = await client.from('users').insert(data).select().single()
    if (error) throw error
    return user
  }
  const user: DbUser = { ...data, created_at: new Date().toISOString() }
  mem.users.set(user.wallet_address, user)
  return user
}

export async function enrichWithUsername<T extends { signer_wallet?: string | null }>(
  req: T,
): Promise<T & { signer_username: string | null }> {
  const username = req.signer_wallet ? (await getUserByWallet(req.signer_wallet))?.username ?? null : null
  return { ...req, signer_username: username }
}

export async function searchUsers(query: string, limit = 10): Promise<DbUser[]> {
  const client = sb()
  if (client) {
    const { data, error } = await client
      .from('users').select('*')
      .ilike('username', `%${query}%`)
      .limit(limit)
    if (error) throw error
    return data ?? []
  }
  const q = query.toLowerCase()
  return Array.from(mem.users.values())
    .filter(u => u.username.toLowerCase().includes(q))
    .slice(0, limit)
}
