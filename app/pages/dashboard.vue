<template>
  <div class="max-w-5xl mx-auto px-4 py-10">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-xl font-semibold">My Documents</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ shortAddress }}
        </p>
      </div>
      <NuxtLink to="/upload">
        <Button size="sm">+ Upload Document</Button>
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 border-b border-border mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === tab.key
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
          :class="activeTab === tab.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-20 bg-muted/50 animate-pulse rounded-xl" />
    </div>

    <!-- Inbox tab -->
    <div v-else-if="activeTab === 'inbox'">
      <div v-if="inbox.length === 0" class="text-center py-20 border border-dashed border-border rounded-xl">
        <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl mx-auto mb-4">📬</div>
        <p class="font-medium text-sm mb-1">No signing requests</p>
        <p class="text-muted-foreground text-xs">Documents sent to you for signing will appear here</p>
      </div>
      <div v-else class="divide-y divide-border border border-border rounded-xl overflow-hidden">
        <div
          v-for="req in inbox"
          :key="req.id"
          class="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/20 transition-colors"
        >
          <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">📄</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-sm truncate">{{ req.document_title }}</p>
              <StatusBadge :status="req.status" />
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              From {{ displayIdentity(req.owner_username, req.owner_wallet) }}
            </p>
          </div>
          <div class="shrink-0">
            <NuxtLink :to="req.status === 'pending' ? `/sign/${req.id}` : `/document/${req.document_id}`">
              <Button size="sm" :variant="req.status === 'pending' ? 'default' : 'ghost'">
                {{ req.status === 'pending' ? 'Sign' : 'View' }}
              </Button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDocs.length === 0 && !(activeTab === 'all' && sharedDocs.length)" class="text-center py-20 border border-dashed border-border rounded-xl">
      <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl mx-auto mb-4">📄</div>
      <p class="font-medium text-sm mb-1">
        {{ activeTab === 'all' ? 'No documents yet' : `No ${activeTab} documents` }}
      </p>
      <p class="text-muted-foreground text-xs mb-5">
        {{ activeTab === 'all' ? 'Upload your first document to get started' : 'Documents will appear here' }}
      </p>
      <NuxtLink v-if="activeTab === 'all'" to="/upload">
        <Button size="sm">Upload Document</Button>
      </NuxtLink>
    </div>

    <!-- Document list (owned by me) -->
    <div v-else-if="filteredDocs.length" class="divide-y divide-border border border-border rounded-xl overflow-hidden">
      <div
        v-for="doc in filteredDocs"
        :key="doc.id"
        class="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/20 transition-colors"
      >
        <!-- File icon -->
        <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
          {{ fileIcon(doc.file_type) }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium text-sm truncate">{{ doc.title }}</p>
            <StatusBadge :status="effectiveStatus(doc)" />
          </div>
          <div class="flex items-center gap-3 mt-1.5">
            <span class="text-xs text-muted-foreground">{{ formatDate(doc.created_at) }}</span>
            <span class="text-xs text-muted-foreground">{{ formatFileSize(doc.file_size) }}</span>
          </div>

          <!-- Signer progress -->
          <div v-if="doc.signing_requests?.length" class="flex items-center gap-1.5 mt-2">
            <div
              v-for="req in doc.signing_requests"
              :key="req.id"
              class="flex items-center gap-1"
            >
              <div
                :title="`${displayIdentity(req.signer_username, req.signer_wallet)} — ${req.status}`"
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border"
                :class="{
                  'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400': req.status === 'signed',
                  'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-400': req.status === 'declined',
                  'bg-muted border-border text-muted-foreground': req.status === 'pending',
                }"
              >
                {{ initials(req.signer_username ?? req.signer_wallet) }}
              </div>
            </div>
            <span class="text-xs text-muted-foreground">
              {{ doc.signing_requests.filter((r: any) => r.status === 'signed').length }}/{{ doc.signing_requests.length }} signed
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <NuxtLink :to="`/document/${doc.id}`">
            <Button variant="ghost" size="sm" class="text-xs">Open</Button>
          </NuxtLink>
          <Button
            variant="ghost"
            size="sm"
            class="text-xs text-muted-foreground hover:text-destructive"
            @click="confirmDelete(doc)"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>

    <!-- Shared with me to sign (My Documents tab) -->
    <div v-if="!loading && activeTab === 'all' && sharedDocs.length" class="mt-8">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Shared with you to sign</p>
      <div class="divide-y divide-border border border-border rounded-xl overflow-hidden">
        <div
          v-for="req in sharedDocs"
          :key="req.id"
          class="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/20 transition-colors"
        >
          <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">📄</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-sm truncate">{{ req.document_title }}</p>
              <StatusBadge :status="req.status" />
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              From {{ displayIdentity(req.owner_username, req.owner_wallet) }}
            </p>
          </div>
          <div class="shrink-0">
            <NuxtLink :to="req.status === 'pending' ? `/sign/${req.id}` : `/document/${req.document_id}`">
              <Button size="sm" :variant="req.status === 'pending' ? 'default' : 'outline'">
                {{ req.status === 'pending' ? 'Sign' : 'View' }}
              </Button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <AlertDialog v-if="docToDelete" :open="true">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            "{{ docToDelete.title }}" will be permanently deleted. {{ docToDelete.walrus_object_id ? 'You will approve a wallet transaction to remove it from decentralized storage.' : 'The file on decentralized storage will remain.' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="docToDelete = null">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deleting"
            @click="handleDelete"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { Document } from '@/composables/useDocuments'

definePageMeta({ middleware: 'auth' })

const { documents, loading, fetchDocuments, deleteDocument, formatFileSize } = useDocuments()
const { address } = useWallet()
const { deleteBlob } = useWalrus()

const shortAddress = computed(() =>
  address.value ? `${address.value.slice(0, 8)}…${address.value.slice(-6)}` : ''
)

const activeTab = ref<'all' | 'inbox'>('all')

const inbox = ref<any[]>([])

const tabs = computed(() => [
  { key: 'all', label: 'My Documents', count: documents.value.length },
  { key: 'inbox', label: 'Inbox', count: inbox.value.filter(r => r.status === 'pending').length },
] as const)

const filteredDocs = computed(() =>
  activeTab.value === 'all' ? documents.value : [],
)

// Display status derived from signatures (a single stored `status` field can't
// represent both "shared" and "fully signed" at once).
function effectiveStatus(doc: any): string {
  const reqs = doc.signing_requests ?? []
  if (reqs.length && reqs.every((r: any) => r.status === 'signed')) return 'completed'
  if (reqs.some((r: any) => r.status === 'pending')) return 'signing'
  return doc.status
}

// Documents shared with me to sign (owned by someone else). Surfaced inside the
// "My Documents" tab so signers can access them as documents, not just as inbox items.
const sharedDocs = computed(() =>
  inbox.value.filter(r => r.owner_wallet && r.owner_wallet !== address.value),
)

const docToDelete = ref<Document | null>(null)
const deleting = ref(false)

function confirmDelete(doc: Document) {
  docToDelete.value = doc
}

async function handleDelete() {
  if (!docToDelete.value) return
  deleting.value = true
  try {
    const doc = docToDelete.value
    if (doc.walrus_object_id) {
      try {
        await deleteBlob(doc.walrus_object_id)
      } catch (e: any) { console.error(e)
        toast.error(`Storage deletion failed: ${e.message ?? 'wallet error'}`)
        deleting.value = false
        return
      }
    }
    await deleteDocument(doc.id)
    toast.success('Document deleted')
    docToDelete.value = null
  } catch (e: any) { console.error(e)
    toast.error(e.message ?? 'Failed to delete')
  } finally {
    deleting.value = false
  }
}

function fileIcon(type: string): string {
  if (type?.includes('pdf')) return '📄'
  if (type?.includes('word') || type?.includes('doc')) return '📝'
  if (type?.includes('image')) return '🖼️'
  if (type?.includes('video')) return '🎬'
  return '📁'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(s: string | null | undefined): string {
  return s?.charAt(0).toUpperCase() ?? '?'
}

function shortWallet(w: string): string {
  return w.slice(0, 8) + '…' + w.slice(-6)
}

function displayIdentity(username: string | null | undefined, wallet: string | null | undefined): string {
  if (!wallet && !username) return 'Unknown'
  const walletPart = wallet ? shortWallet(wallet) : ''
  if (username) return `@${username} (${walletPart})`
  return walletPart
}

async function fetchInbox() {
  if (!address.value) return
  try {
    inbox.value = await $fetch(`/api/signing-requests/inbox?wallet=${encodeURIComponent(address.value)}`)
  } catch (e) { console.error(e) }
}

onMounted(() => { fetchDocuments(); fetchInbox() })
useSeoMeta({ title: 'Dashboard | Tidemark' })
</script>

