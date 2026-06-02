<template>
  <div class="max-w-xl mx-auto px-4 py-12">
    <div class="mb-8">
      <h1 class="text-2xl font-serif font-medium">Upload Document</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Stored permanently on decentralized storage. Share or collect signatures after.
      </p>
    </div>

    <!-- Resume banner -->
    <div v-if="pendingResume && !uploadedDoc" class="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 mb-5 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-amber-800 dark:text-amber-300">Upload was interrupted</p>
          <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            "{{ pendingResume.title }}" ({{ pendingResume.fileName }}) wasn't fully uploaded.
            Re-select the file to continue.
          </p>
        </div>
        <button class="text-amber-600 hover:text-amber-800 text-xs shrink-0" @click="dismissResume">Dismiss</button>
      </div>
      <div class="flex items-center gap-2">
        <input
          type="file"
          class="hidden"
          :id="`resume-file-input`"
          :accept="pendingResume.fileType"
          @change="(e) => { resumeFile = (e.target as HTMLInputElement).files?.[0] ?? null }"
        />
        <label
          :for="`resume-file-input`"
          class="text-xs cursor-pointer border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          {{ resumeFile ? resumeFile.name : 'Select file' }}
        </label>
        <Button size="sm" :disabled="!resumeFile || isWorking" @click="resumeUpload">
          Continue upload
        </Button>
      </div>
    </div>

    <div v-if="!uploadedDoc" class="space-y-5">

      <!-- Drop zone -->
      <div
        class="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5"
        :class="{ 'border-primary bg-primary/5': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <input ref="fileInput" type="file" class="hidden" accept=".pdf,.doc,.docx" @change="onFileSelect" />

        <div v-if="!selectedFile">
          <p class="font-medium text-sm mb-1">Drop your document here or click to browse</p>
          <p class="text-xs text-muted-foreground">PDF, DOC, DOCX up to 50MB</p>
        </div>

        <div v-else class="flex items-center justify-center gap-3">
          <div class="text-2xl">{{ fileIcon }}</div>
          <div class="text-left">
            <div class="font-medium text-sm">{{ selectedFile.name }}</div>
            <div class="text-xs text-muted-foreground">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <Button variant="ghost" size="sm" @click.stop="selectedFile = null">Remove</Button>
        </div>
      </div>

      <!-- Title -->
      <div class="space-y-2">
        <Label for="title">Document Title</Label>
        <Input id="title" v-model="title" placeholder="e.g. NDA Agreement, Acme Corp" />
      </div>

      <!-- Visibility -->
      <div class="space-y-2">
        <Label class="text-sm">Visibility</Label>
        <div class="grid grid-cols-2 gap-3">
          <button
            class="rounded-lg border-2 px-4 py-3 text-left transition-colors"
            :class="!useEncryption ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'"
            @click="useEncryption = false"
          >
            <p class="font-medium text-sm">Public</p>
            <p class="text-xs text-muted-foreground mt-0.5">Shareable with anyone via link</p>
          </button>
          <button
            class="rounded-lg border-2 px-4 py-3 text-left transition-colors"
            :class="useEncryption ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'"
            @click="useEncryption = true"
          >
            <p class="font-medium text-sm">Private</p>
            <p class="text-xs text-muted-foreground mt-0.5">Encrypted — only your wallet</p>
          </button>
        </div>

        <p v-if="useEncryption" class="text-xs text-muted-foreground px-1">
          Requires 2 wallet approvals during upload. Encrypted before leaving your browser.
        </p>
      </div>

      <!-- Progress -->
      <div v-if="isWorking" class="bg-card border border-border rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ uploadStep }}</span>
          <span class="font-medium">{{ Math.round(displayPercent) }}%</span>
        </div>
        <Progress :model-value="displayPercent" class="h-1.5" />
        <p class="text-xs text-muted-foreground">{{ uploadDetail }}</p>
      </div>

      <Button
        class="w-full"
        :disabled="!selectedFile || !title || isWorking"
        @click="uploadDocument"
      >
        {{ isWorking ? uploadStep || 'Uploading...' : (useEncryption ? 'Encrypt & Upload' : 'Upload Document') }}
      </Button>
    </div>

    <!-- Success: request signatures or go to doc -->
    <div v-else class="space-y-5">
      <!-- Uploaded confirmation -->
      <div class="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
        <div class="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm">{{ uploadedDoc.title }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ uploadedDoc.is_encrypted ? 'Encrypted · ' : '' }}Stored on decentralized storage
          </p>
        </div>
      </div>

      <!-- Request signatures section -->
      <div class="border border-border rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border bg-muted/30">
          <p class="text-sm font-medium">Request Signatures</p>
          <p class="text-xs text-muted-foreground mt-0.5">Search by username to add signers</p>
        </div>
        <div class="p-4 space-y-3">
          <!-- Selected signers -->
          <div v-if="selectedSigners.length" class="flex flex-wrap gap-2">
            <div
              v-for="s in selectedSigners"
              :key="s.wallet_address"
              class="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1 text-xs"
            >
              <span class="font-medium">@{{ s.username }}</span>
              <button class="text-muted-foreground hover:text-destructive" @click="removeSigner(s.wallet_address)">✕</button>
            </div>
          </div>

          <!-- Search input -->
          <div class="relative">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
              <Input
                v-model="signerSearch"
                placeholder="username or wallet address..."
                class="pl-7"
                @input="onSearchInput"
                @keydown.escape="searchResults = []; searchLoading = false"
              />
              <span v-if="searchLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
                <span class="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin block" />
              </span>
            </div>
            <div
              v-if="searchResults.length || (signerSearch.trim().length >= 2 && !searchLoading && searchQueried)"
              class="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div v-if="!searchResults.length" class="px-3 py-3 text-xs text-muted-foreground text-center">
                No users found for "{{ signerSearch.trim() }}"
              </div>
              <button
                v-for="u in searchResults"
                :key="u.wallet_address"
                class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                @click="addSigner(u)"
              >
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {{ u.username.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium">@{{ u.username }}</p>
                  <p class="text-xs text-muted-foreground font-mono truncate">{{ u.wallet_address }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        class="w-full"
        :disabled="sendingRequests || !hasValidSigners"
        @click="sendSigningRequests"
      >
        <span v-if="sendingRequests" class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Sending...
        </span>
        <span v-else>Send Signing Requests</span>
      </Button>

      <div class="flex flex-col gap-2">
        <Button variant="outline" class="w-full" @click="goToDocument()">Skip — open document</Button>
        <Button variant="ghost" class="w-full text-sm" @click="navigateTo('/dashboard')">Back to dashboard</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

const isWorking = ref(false)
const { createDocument, requestSignatures } = useDocuments()
const { createAllowlist, encryptFile } = useSeal()
const { address } = useWallet()

const PENDING_KEY = 'tidemark_pending_upload'

interface PendingUpload {
  documentId: string
  title: string
  fileName: string
  fileType: string
  fileSize: number
  isEncrypted: boolean
}

const pendingResume = ref<PendingUpload | null>(null)
const resumeFile = ref<File | null>(null)

interface UserResult { wallet_address: string; username: string }
const selectedSigners = ref<UserResult[]>([])
const signerSearch = ref('')
const searchResults = ref<UserResult[]>([])
const searchLoading = ref(false)
const searchQueried = ref(false)
const sendingRequests = ref(false)
const hasValidSigners = computed(() => selectedSigners.value.length > 0)

let _searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  searchQueried.value = false
  if (_searchTimer) clearTimeout(_searchTimer)
  const q = signerSearch.value.trim()
  if (q.length < 2) { searchResults.value = []; searchLoading.value = false; return }
  searchLoading.value = true
  _searchTimer = setTimeout(async () => {
    try {
      const results = await $fetch<UserResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`)
      searchResults.value = results.filter(u => !selectedSigners.value.some(s => s.wallet_address === u.wallet_address))
    } catch (e) { console.error(e); searchResults.value = [] }
    finally { searchLoading.value = false; searchQueried.value = true }
  }, 300)
}

function addSigner(user: UserResult) {
  if (!selectedSigners.value.some(s => s.wallet_address === user.wallet_address))
    selectedSigners.value.push(user)
  signerSearch.value = ''
  searchResults.value = []
}

function removeSigner(wallet: string) {
  selectedSigners.value = selectedSigners.value.filter(s => s.wallet_address !== wallet)
}

async function sendSigningRequests() {
  if (!uploadedDoc.value || !selectedSigners.value.length) return
  sendingRequests.value = true
  try {
    await requestSignatures(uploadedDoc.value.id, selectedSigners.value.map(s => s.wallet_address))
    toast.success(`Signing request sent to ${selectedSigners.value.length} signer${selectedSigners.value.length > 1 ? 's' : ''}`)
    navigateTo(`/document/${uploadedDoc.value.id}`)
  } catch (e: any) { console.error(e)
    toast.error(e.message ?? 'Failed to send requests')
  } finally {
    sendingRequests.value = false
  }
}

const useEncryption = ref(false)
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const title = ref('')
const uploadStep = ref('')
const uploadDetail = ref('')
const uploadedDoc = ref<any>(null)

// Smooth progress: displayPercent animates toward targetPercent
const targetPercent = ref(0)
const displayPercent = ref(0)
let _ticker: ReturnType<typeof setInterval> | null = null

function setProgress(target: number) {
  targetPercent.value = target
  if (_ticker) return
  _ticker = setInterval(() => {
    const diff = targetPercent.value - displayPercent.value
    if (Math.abs(diff) < 0.5) {
      displayPercent.value = targetPercent.value
    } else {
      // Ease toward target — faster when far, slower when close
      displayPercent.value += diff * 0.08
    }
  }, 16)
}

function stopProgress() {
  if (_ticker) { clearInterval(_ticker); _ticker = null }
  displayPercent.value = 0
  targetPercent.value = 0
}


const fileIcon = computed(() => {
  if (!selectedFile.value) return '📄'
  const type = selectedFile.value.type
  if (type.includes('pdf')) return '📄'
  if (type.includes('word')) return '📝'
  return '📁'
})

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) selectedFile.value = file
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) selectedFile.value = file
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadDocument() {
  if (!selectedFile.value || !title.value) return

  isWorking.value = true
  setProgress(0)
  try {
    let fileToUpload: File | Blob = selectedFile.value
    let sealAllowlistId: string | undefined
    let sealEncryptionId: string | undefined

    if (useEncryption.value) {
      uploadStep.value = 'Creating access policy on Sui...'
      uploadDetail.value = 'Approve the transaction in your wallet'
      setProgress(5)
      sealAllowlistId = await createAllowlist()

      uploadStep.value = 'Encrypting...'
      uploadDetail.value = 'File is being encrypted before upload'
      setProgress(28)
      const { encryptedBytes, encryptionId } = await encryptFile(selectedFile.value, sealAllowlistId)
      sealEncryptionId = encryptionId
      fileToUpload = new Blob([encryptedBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' })
      setProgress(38)
    }

    uploadStep.value = 'Creating document...'
    setProgress(42)

    const pendingDoc = await createDocument({
      title: title.value,
      walrus_blob_id: '',
      file_type: selectedFile.value.type,
      file_size: selectedFile.value.size,
      is_encrypted: useEncryption.value,
      seal_allowlist_id: sealAllowlistId,
      seal_encryption_id: sealEncryptionId,
    })

    localStorage.setItem(PENDING_KEY, JSON.stringify({
      documentId: pendingDoc.id,
      title: title.value,
      fileName: selectedFile.value.name,
      fileType: selectedFile.value.type,
      fileSize: selectedFile.value.size,
      isEncrypted: useEncryption.value,
    } satisfies PendingUpload))

    setProgress(48)
    await doWalrusUpload(pendingDoc.id, fileToUpload)
  } catch (err: any) {
    toast.error(err.message ?? 'Upload failed')
    stopProgress()
    uploadStep.value = ''
  } finally {
    isWorking.value = false
  }
}

async function doWalrusUpload(documentId: string, fileToUpload: File | Blob) {
  uploadStep.value = 'Uploading to decentralized storage...'
  uploadDetail.value = 'This may take a minute — safe to wait'
  setProgress(50)

  const params = new URLSearchParams({ owner: address.value ?? '' })
  const res = await $fetch<{ blobId: string; objectId: string | null }>(
    `/api/documents/${documentId}/blob?${params}`,
    {
      method: 'POST',
      body: fileToUpload,
      headers: { 'Content-Type': 'application/octet-stream' },
    },
  )

  setProgress(95)
  uploadStep.value = 'Done'
  uploadDetail.value = `Blob ID: ${res.blobId}`
  localStorage.removeItem(PENDING_KEY)
  pendingResume.value = null

  const doc = await $fetch<any>(`/api/documents/${documentId}`)
  setProgress(100)
  uploadedDoc.value = doc
}

async function resumeUpload() {
  if (!pendingResume.value || !resumeFile.value) return
  isWorking.value = true
  setProgress(0)
  try {
    await doWalrusUpload(pendingResume.value.documentId, resumeFile.value)
  } catch (err: any) {
    toast.error(err.message ?? 'Upload failed')
    stopProgress()
    uploadStep.value = ''
  } finally {
    isWorking.value = false
  }
}

function dismissResume() {
  localStorage.removeItem(PENDING_KEY)
  pendingResume.value = null
}

function goToDocument() {
  navigateTo(`/document/${uploadedDoc.value.id}`)
}

onMounted(() => {
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return
  try {
    const p = JSON.parse(raw) as PendingUpload
    pendingResume.value = p
  } catch {
    localStorage.removeItem(PENDING_KEY)
  }
})
</script>

