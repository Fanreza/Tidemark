export interface Document {
  id: string
  title: string
  owner_wallet: string
  walrus_blob_id: string
  walrus_object_id?: string | null
  file_type: string
  file_size: number
  is_encrypted: boolean
  seal_allowlist_id?: string | null
  seal_encryption_id?: string | null
  status: 'pending' | 'draft' | 'shared' | 'signing' | 'completed'
  created_at: string
  updated_at: string
  share_links?: ShareLink[]
  signing_requests?: SigningRequest[]
}

export interface ShareLink {
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

export interface SigningRequest {
  id: string
  document_id: string
  signer_email: string
  signer_wallet: string | null
  signer_username?: string | null
  status: 'pending' | 'signed' | 'declined'
  signed_at: string | null
  sui_tx_hash: string | null
  order_index: number
}

const documents = ref<Document[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useDocuments() {
  const { address } = useWallet()

  async function fetchDocuments() {
    loading.value = true
    error.value = null
    try {
      const wallet = address.value ?? 'demo-wallet'
      const data = await $fetch<Document[]>(`/api/documents?wallet=${encodeURIComponent(wallet)}`)
      documents.value = data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchDocument(id: string): Promise<Document> {
    return $fetch<Document>(`/api/documents/${id}`)
  }

  async function createDocument(payload: {
    title: string
    walrus_blob_id: string
    walrus_object_id?: string | null
    file_type: string
    file_size: number
    is_encrypted: boolean
    seal_allowlist_id?: string
    seal_encryption_id?: string
  }): Promise<Document> {
    return $fetch<Document>('/api/documents', {
      method: 'POST',
      body: {
        ...payload,
        owner_wallet: address.value ?? 'demo-wallet',
      },
    })
  }

  async function createShareLink(documentId: string, options: {
    password?: string
    expires_at?: string
    allow_download?: boolean
    require_email?: boolean
  }): Promise<ShareLink> {
    return $fetch<ShareLink>(`/api/documents/${documentId}/share`, {
      method: 'POST',
      body: { ...options, owner_wallet: address.value ?? 'demo-wallet' },
    })
  }

  async function deactivateShareLink(token: string): Promise<void> {
    const wallet = address.value ?? 'demo-wallet'
    await $fetch(`/api/share/${token}?wallet=${encodeURIComponent(wallet)}` as string, { method: 'DELETE' as any })
  }

  async function updateShareLink(token: string, options: {
    allow_download?: boolean
    password?: string
    expires_at?: string
  }): Promise<ShareLink> {
    return $fetch<ShareLink>(`/api/share/${token}`, {
      method: 'PATCH' as any,
      body: { ...options, wallet: address.value ?? 'demo-wallet' },
    })
  }

  async function requestSignatures(documentId: string, signerWallets: string[]): Promise<void> {
    await $fetch(`/api/documents/${documentId}/sign`, {
      method: 'POST',
      body: { signers: signerWallets, owner_wallet: address.value ?? 'demo-wallet' },
    })
  }

  async function deleteDocument(id: string): Promise<void> {
    const wallet = address.value ?? 'demo-wallet'
    await $fetch(`/api/documents/${id}?wallet=${encodeURIComponent(wallet)}`, { method: 'DELETE' as any })
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function getDocumentByToken(
    token: string,
    credentials?: { password?: string; email?: string },
  ): Promise<{ document: Document; shareLink: ShareLink }> {
    const query: Record<string, string> = {}
    if (credentials?.password) query.password = credentials.password
    if (credentials?.email) query.email = credentials.email
    const url = `/api/share/${token}`
    return (($fetch as any)(url, { query })) as Promise<{ document: Document; shareLink: ShareLink }>
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getStatusColor(status: Document['status']): string {
    return ({
      pending: 'bg-muted text-muted-foreground',
      draft: 'bg-muted text-muted-foreground',
      shared: 'bg-blue-100 text-blue-700',
      signing: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
    } as Record<string, string>)[status] ?? 'bg-muted text-muted-foreground'
  }

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    fetchDocument,
    createDocument,
    deleteDocument,
    createShareLink,
    deactivateShareLink,
    requestSignatures,
    getDocumentByToken,
    formatFileSize,
    getStatusColor,
    updateShareLink,
  }
}
