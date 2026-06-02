<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">Loading secure document...</p>
      </div>
    </div>

    <!-- Gate: email or password required -->
    <div v-else-if="showGate" class="flex items-center justify-center h-screen">
      <div class="bg-card border border-border rounded-xl p-8 w-full max-w-sm mx-4 space-y-5">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <img src="/logo.jpeg" alt="Tidemark" class="w-6 h-6 object-contain" />
            <span class="font-semibold text-sm">Tidemark</span>
          </div>
          <h2 class="font-semibold text-lg">Secure Document</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ gateMessage }}
          </p>
        </div>

        <div v-if="requireEmail" class="space-y-1.5">
          <Label>Your Email</Label>
          <Input v-model="gateEmail" type="email" placeholder="your@email.com" @keyup.enter="submitGate" />
        </div>

        <div v-if="requirePassword" class="space-y-1.5">
          <Label>Password</Label>
          <Input v-model="gatePassword" type="password" placeholder="Enter link password" @keyup.enter="submitGate" />
        </div>

        <p v-if="gateError" class="text-xs text-destructive">{{ gateError }}</p>

        <Button class="w-full" :disabled="gateLoading" @click="submitGate">
          <span v-if="gateLoading" class="flex items-center gap-2">
            <span class="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </span>
          <span v-else>View Document</span>
        </Button>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center h-screen">
      <div class="text-center max-w-sm px-4">
        <div class="text-5xl mb-4">🔒</div>
        <h2 class="font-semibold text-lg mb-2">Access Denied</h2>
        <p class="text-sm text-muted-foreground">{{ error }}</p>
      </div>
    </div>

    <!-- Document viewer -->
    <div v-else-if="docData" class="flex flex-col h-screen">
      <!-- Viewer header -->
      <div class="border-b border-border bg-card px-4 md:px-6 h-14 flex items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <img src="/logo.jpeg" alt="" class="w-6 h-6 object-contain shrink-0" />
          <span class="font-semibold text-sm tracking-tight hidden sm:block">Tidemark</span>
          <span class="text-muted-foreground text-sm hidden sm:block">/</span>
          <h1 class="font-medium text-sm truncate text-muted-foreground">{{ docData.document.title }}</h1>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a
            :href="`https://walruscan.com/testnet/blob/${docData.document.walrus_blob_id}`"
            target="_blank"
          >
            <Button variant="ghost" size="sm" class="text-xs gap-1.5">
              Storage proof
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </Button>
          </a>
          <Button v-if="docData.shareLink.allow_download" variant="outline" size="sm" @click="downloadDoc">Download</Button>
          <NuxtLink to="/">
            <Button size="sm">Go to App</Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Document content area -->
      <div class="flex-1 overflow-auto bg-muted/40 p-4 md:p-6 flex flex-col">
        <!-- Loading blob -->
        <div v-if="loadingBlob" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </div>

        <!-- Video -->
        <div v-else-if="blobObjectUrl && mimeCategory === 'video'" class="flex-1 flex items-start justify-center">
          <video :src="blobObjectUrl" controls class="w-full max-w-4xl rounded-xl shadow-sm bg-black" />
        </div>

        <!-- Audio -->
        <div v-else-if="blobObjectUrl && mimeCategory === 'audio'" class="flex-1 flex items-center justify-center">
          <audio :src="blobObjectUrl" controls class="w-full max-w-lg" />
        </div>

        <!-- Image -->
        <div v-else-if="blobObjectUrl && mimeCategory === 'image'" class="flex-1 flex items-center justify-center">
          <img :src="blobObjectUrl" class="max-w-full max-h-full object-contain rounded-xl shadow-sm" alt="Document" />
        </div>

        <!-- PDF / text / anything browser can embed -->
        <div v-else-if="blobObjectUrl" class="flex-1 max-w-4xl w-full mx-auto rounded-xl overflow-hidden border border-border shadow-sm bg-white">
          <VuePdfEmbed :source="blobObjectUrl" class="w-full" />
        </div>

        <!-- Fallback: no blob -->
        <div v-else class="h-full flex items-center justify-center p-6">
          <div class="max-w-md text-center">
            <div class="text-6xl mb-4">📄</div>
            <h3 class="font-medium text-lg mb-2">{{ docData.document.title }}</h3>
            <p class="text-sm text-muted-foreground mb-6">
              {{ blobError || 'This file type cannot be previewed in-browser.' }}
            </p>

            <div class="bg-muted/50 rounded-lg p-4 text-left mb-4">
              <p class="text-xs font-medium mb-1">Storage Proof</p>
              <p class="text-xs font-mono text-muted-foreground break-all">
                walrus://{{ docData.document.walrus_blob_id }}
              </p>
            </div>

            <div class="flex gap-2 justify-center">
              <a :href="`${aggregatorUrl}/v1/blobs/${docData.document.walrus_blob_id}`" target="_blank">
                <Button variant="outline" size="sm">Verify storage →</Button>
              </a>
              <Button v-if="docData.shareLink.allow_download" size="sm" @click="downloadDoc">
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: false })

const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'))

const route = useRoute()
const config = useRuntimeConfig()
const aggregatorUrl = config.public.walrusAggregator as string
const { getDocumentByToken } = useDocuments()

const loading = ref(true)
const loadingBlob = ref(false)
const gateLoading = ref(false)
const error = ref<string | null>(null)
const blobError = ref<string | null>(null)
const docData = ref<any>(null)
const blobObjectUrl = ref<string | null>(null)

// Gate state
const showGate = ref(false)
const requireEmail = ref(false)
const requirePassword = ref(false)
const gateEmail = ref('')
const gatePassword = ref('')
const gateError = ref('')

const gateMessage = computed(() => {
  if (requireEmail.value && requirePassword.value) return 'Enter your email and the link password to access this document.'
  if (requireEmail.value) return 'Enter your email to access this document.'
  return 'Enter the password to access this document.'
})

const mimeCategory = computed(() => docData.value?.document.file_type?.split('/')[0] ?? '')

onMounted(async () => {
  try {
    await loadDocument()
  } catch {
    // 401 handled inside loadDocument (sets showGate)
  }
})

onUnmounted(() => {
  if (blobObjectUrl.value) URL.revokeObjectURL(blobObjectUrl.value)
})

async function loadDocument(credentials?: { password?: string; email?: string }) {
  try {
    docData.value = await getDocumentByToken(route.params.token as string, credentials)
    showGate.value = false
    await loadBlob()
  } catch (e: any) {
    const statusCode = e.status ?? e.statusCode
    if (statusCode === 401) {
      const data = e.data?.data ?? e.data
      requirePassword.value = data?.requirePassword ?? false
      requireEmail.value = data?.requireEmail ?? false
      showGate.value = true
      throw e // rethrow so submitGate can show error
    } else {
      error.value = e.data?.message ?? 'This link is invalid or has expired.'
    }
  } finally {
    loading.value = false
  }
}

async function submitGate() {
  gateError.value = ''
  if (requireEmail.value && !gateEmail.value) {
    gateError.value = 'Please enter your email.'
    return
  }
  if (requirePassword.value && !gatePassword.value) {
    gateError.value = 'Please enter the password.'
    return
  }
  gateLoading.value = true
  try {
    await loadDocument({
      email: gateEmail.value || undefined,
      password: gatePassword.value || undefined,
    })
  } catch {
    gateError.value = 'Incorrect password or email. Please try again.'
  } finally {
    gateLoading.value = false
  }
}

const AGGREGATORS = [
  'https://wal-aggregator-testnet.staketab.org',
  'https://aggregator.walrus-testnet.walrus.space',
  'https://walrus-testnet-aggregator.bartestnet.com',
  'https://walrus-testnet.blockscope.net',
]

async function loadBlob() {
  const blobId = docData.value?.document.walrus_blob_id
  if (!blobId) return
  loadingBlob.value = true
  const mime = docData.value?.document.file_type || 'application/octet-stream'
  for (const agg of AGGREGATORS) {
    try {
      const res = await fetch(`${agg}/v1/blobs/${blobId}`)
      if (!res.ok) continue
      const bytes = await res.arrayBuffer()
      const blob = new Blob([bytes], { type: mime })
      blobObjectUrl.value = URL.createObjectURL(blob)
      loadingBlob.value = false
      return
    } catch { }
  }
  blobError.value = 'Could not load from decentralized storage'
  loadingBlob.value = false
}

function downloadDoc() {
  const blobId = docData.value?.document.walrus_blob_id
  if (!blobId) return
  if (blobObjectUrl.value) {
    const a = document.createElement('a')
    a.href = blobObjectUrl.value
    a.download = docData.value.document.title
    a.click()
  } else {
    window.open(`${aggregatorUrl}/v1/blobs/${blobId}`, '_blank')
  }
}
</script>
