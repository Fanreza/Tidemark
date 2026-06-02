<template>
  <div class="min-h-screen bg-muted/30 flex flex-col">
    <div class="flex-1 flex items-start justify-center p-4 pt-10">
    <div class="w-full max-w-lg">

      <!-- Branding -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <img src="/logo.jpeg" alt="Tidemark" class="w-6 h-6 object-contain" />
        <span class="font-semibold text-sm tracking-tight">Tidemark</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-card border border-border rounded-2xl p-8 text-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">Loading signing request...</p>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound" class="bg-card border border-border rounded-2xl p-8 text-center">
        <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl mx-auto mb-4">🔒</div>
        <h2 class="font-semibold text-lg mb-2">Request Not Found</h2>
        <p class="text-sm text-muted-foreground">This signing link may have expired or already been used.</p>
      </div>

      <!-- Already signed -->
      <div v-else-if="alreadySigned" class="bg-card border border-border rounded-2xl p-8 text-center">
        <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="font-semibold text-lg mb-2">Already Signed</h2>
        <p class="text-sm text-muted-foreground">You've already signed this document. Thank you.</p>
      </div>

      <!-- Declined -->
      <div v-else-if="declined" class="bg-card border border-border rounded-2xl p-8 text-center">
        <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
        <h2 class="font-semibold text-lg mb-2">Signature Declined</h2>
        <p class="text-sm text-muted-foreground">You've declined to sign this document. The sender has been notified.</p>
      </div>

      <!-- Signed success -->
      <div v-else-if="signed" class="bg-card border border-border rounded-2xl p-8 text-center">
        <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="font-semibold text-lg mb-1">Document Signed</h2>
        <p class="text-sm text-muted-foreground mb-5">
          Your signature has been recorded permanently on the blockchain.
        </p>
        <div class="bg-muted/50 border border-border rounded-lg p-3 text-left">
          <p class="text-xs text-muted-foreground mb-1 font-medium">Transaction Hash</p>
          <p class="text-xs font-mono break-all text-foreground">{{ txHash }}</p>
        </div>
        <a
          v-if="txHash"
          :href="`https://suiscan.xyz/testnet/tx/${txHash}`"
          target="_blank"
          class="inline-block mt-3 text-xs text-primary hover:underline"
        >
          View on blockchain ↗
        </a>
      </div>

      <!-- Sign form -->
      <div v-else-if="signingRequest" class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

        <!-- Document info -->
        <div class="p-5 border-b border-border">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Signature Request</p>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">📄</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm leading-snug">{{ signingRequest.document_title }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-muted-foreground">Decentralized storage</span>
                <a
                  v-if="signingRequest.document_walrus_blob_id"
                  :href="`https://walruscan.com/testnet/blob/${signingRequest.document_walrus_blob_id}`"
                  target="_blank"
                  class="text-xs text-primary hover:underline"
                >
                  View ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF Preview with placement overlay -->
        <div
          v-if="blobObjectUrl"
          ref="pdfContainerRef"
          class="border-b border-border relative bg-muted/20 overflow-auto max-h-96 transition-[outline,background]"
          :style="placing
            ? 'outline: 2px dashed #f59e0b; outline-offset: -2px; background: color-mix(in srgb, #f59e0b 5%, transparent); cursor: none;'
            : ''"
          @click.capture="placing ? onDocumentClick($event) : undefined"
          @mousemove.capture="placing ? onPdfMouseMove($event) : undefined"
          @mouseleave="pdfCursorPos = null"
        >
          <VuePdfEmbed :source="blobObjectUrl" class="w-full" @loaded="onPdfLoaded" />

          <!-- Stamp size preview — follows cursor -->
          <div
            v-if="placing && pdfCursorPos"
            class="absolute pointer-events-none z-30"
            :style="{ left: pdfCursorPos.x + 'px', top: pdfCursorPos.y + 'px', transform: 'translate(-50%, -50%)' }"
          >
            <div class="rounded border-2 border-dashed border-green-500 shadow-lg bg-white/80 flex items-center justify-center text-gray-300 text-xs" style="width:168px;height:60px">
              ✍ signature
            </div>
          </div>

          <!-- Placed marker — top in pixels from scroll-content top -->
          <div
            v-if="placedField && !placing"
            class="absolute pointer-events-none z-10"
            :style="{ left: placedField.x_pct + '%', top: ((placedField.y_pct / 100) * pdfScrollHeight) + 'px', transform: 'translate(-50%, -50%)' }"
          >
            <div class="rounded border-2 border-green-500 shadow bg-green-50/90 flex items-center justify-center text-green-600 text-xs font-medium" style="width:168px;height:60px">
              ✓ Placed
            </div>
          </div>
        </div>

        <!-- No PDF preview -->
        <div v-else-if="signingRequest.document_walrus_blob_id" class="border-b border-border bg-muted/20 px-5 py-4 flex items-center justify-between">
          <p class="text-xs text-muted-foreground">Preview not available for this file type</p>
          <a
            :href="`${aggregatorUrl}/v1/blobs/${signingRequest.document_walrus_blob_id}`"
            target="_blank"
            class="text-xs text-primary hover:underline"
          >
            Open file ↗
          </a>
        </div>

        <!-- Wallet check -->
        <div class="p-5 border-b border-border bg-muted/10">
          <p class="text-xs text-muted-foreground mb-1">Required signer</p>
          <p class="text-sm font-medium">{{ signingRequest.signer_username ? `@${signingRequest.signer_username}` : signingRequest.signer_wallet }}</p>
          <p v-if="signingRequest.signer_username" class="text-xs font-mono text-muted-foreground mt-0.5">{{ signingRequest.signer_wallet }}</p>
          <div v-if="!isConnected" class="mt-3">
            <Button size="sm" class="w-full" @click="showWalletModal = true">Connect Wallet to Sign</Button>
          </div>
          <div v-else-if="!isAuthorized" class="mt-3 text-xs text-destructive font-medium">
            Wrong wallet connected. Switch to the required wallet above.
          </div>
          <div v-else class="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Wallet authorized
          </div>
        </div>

        <!-- Actions -->
        <div class="p-5 space-y-3">

          <!-- Step 1: placing instruction -->
          <div v-if="placing" class="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
            <span class="text-amber-500 mt-0.5">✍</span>
            <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Click on the document above to place your signature where you want it to appear
            </p>
          </div>

          <!-- Step 1: not yet placed, has PDF -->
          <Button
            v-if="!signing && blobObjectUrl && !placedField"
            class="w-full"
            :disabled="placing || !isAuthorized"
            @click="startPlacing"
          >
            {{ placing ? 'Click on document to place...' : 'Choose signature position' }}
          </Button>

          <!-- Step 2: placed, ready to draw -->
          <Button
            v-if="!signing && placedField"
            class="w-full"
            :disabled="!isAuthorized"
            @click="showPad = true"
          >
            Draw &amp; sign
          </Button>

          <!-- No PDF: go straight to draw -->
          <Button
            v-if="!signing && !blobObjectUrl && !placedField"
            class="w-full"
            :disabled="!isAuthorized"
            @click="showPad = true"
          >
            Sign Document
          </Button>

          <!-- Signing in progress -->
          <div v-if="signing" class="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <span class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {{ signingStep || 'Signing...' }}
          </div>

          <!-- Cancel placement -->
          <Button
            v-if="placing && !signing"
            variant="ghost"
            class="w-full text-sm text-muted-foreground"
            @click="placing = false"
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            class="w-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40"
            :disabled="signing || declining || placing"
            @click="declineDocument"
          >
            <span v-if="declining" class="flex items-center justify-center gap-2">
              <span class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Declining...
            </span>
            <span v-else>Decline</span>
          </Button>

          <p class="text-xs text-center text-muted-foreground pt-1">
            Secured by blockchain · Permanent &amp; verifiable
          </p>
        </div>
      </div>

    </div>
    </div>

    <!-- Signature pad modal -->
    <SignaturePad
      v-if="showPad"
      @confirm="onSignatureConfirm"
      @cancel="showPad = false"
    />

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: false })

const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'))

const route = useRoute()
const { recordSignature } = useSui()
const { embedDrawnSignature } = usePdfSigner()
const { address, isConnected, showWalletModal } = useWallet()
const config = useRuntimeConfig()
const aggregatorUrl = config.public.walrusAggregator as string

const loading = ref(true)
const signing = ref(false)
const signingStep = ref('')
const declining = ref(false)
const signed = ref(false)
const declined = ref(false)
const notFound = ref(false)
const alreadySigned = ref(false)
const wrongWallet = ref(false)
const txHash = ref('')
const signingRequest = ref<any>(null)

const isAuthorized = computed(() =>
  isConnected.value && signingRequest.value?.signer_wallet
    ? address.value?.toLowerCase() === signingRequest.value.signer_wallet.toLowerCase()
    : false,
)
const blobObjectUrl = ref<string | null>(null)
const pdfBytes = ref<ArrayBuffer | null>(null)

const pdfContainerRef = ref<HTMLElement | null>(null)
const placing = ref(false)
const placedField = ref<{ x_pct: number; y_pct: number } | null>(null)
const showPad = ref(false)
const pdfScrollHeight = ref(0)
const pdfCursorPos = ref<{ x: number; y: number } | null>(null)

function onPdfLoaded() {
  nextTick(() => {
    if (pdfContainerRef.value) {
      pdfScrollHeight.value = pdfContainerRef.value.scrollHeight
    }
  })
}

function onPdfMouseMove(e: MouseEvent) {
  if (!pdfContainerRef.value) return
  const el = pdfContainerRef.value
  const rect = el.getBoundingClientRect()
  pdfCursorPos.value = {
    x: e.clientX - rect.left + el.scrollLeft,
    y: e.clientY - rect.top + el.scrollTop,
  }
}

const AGGREGATORS = [
  'https://wal-aggregator-testnet.staketab.org',
  'https://aggregator.walrus-testnet.walrus.space',
  'https://walrus-testnet-aggregator.bartestnet.com',
  'https://walrus-testnet.blockscope.net',
]

onMounted(async () => {
  try {
    const data = await $fetch<any>(`/api/sign/${route.params.requestId}`)
    signingRequest.value = data

    if (data.status === 'signed') { alreadySigned.value = true; return }
    if (data.status === 'declined') { declined.value = true; return }

    if (data.document_file_type?.includes('pdf') && data.document_walrus_blob_id) {
      for (const agg of AGGREGATORS) {
        try {
          const res = await fetch(`${agg}/v1/blobs/${data.document_walrus_blob_id}`)
          if (!res.ok) continue
          const bytes = await res.arrayBuffer()
          pdfBytes.value = bytes
          const blob = new Blob([bytes], { type: 'application/pdf' })
          blobObjectUrl.value = URL.createObjectURL(blob)
          break
        } catch { }
      }
    }
  } catch (e: any) {
    notFound.value = true
    if (e.status !== 404 && e.statusCode !== 404) {
      toast.error(e.data?.message ?? 'Failed to load signing request')
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (blobObjectUrl.value) URL.revokeObjectURL(blobObjectUrl.value)
})

function startPlacing() {
  placing.value = true
  placedField.value = null
  nextTick(() => {
    if (pdfContainerRef.value) {
      pdfScrollHeight.value = pdfContainerRef.value.scrollHeight
    }
    pdfContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function onDocumentClick(e: MouseEvent) {
  if (!pdfContainerRef.value || !placing.value) return
  const el = pdfContainerRef.value
  const rect = el.getBoundingClientRect()
  const scrollH = el.scrollHeight || pdfScrollHeight.value || rect.height
  placedField.value = {
    x_pct: ((e.clientX - rect.left) / rect.width) * 100,
    y_pct: ((e.clientY - rect.top + el.scrollTop) / scrollH) * 100,
  }
  placing.value = false
  pdfCursorPos.value = null
  showPad.value = true
}

async function onSignatureConfirm(dataUrl: string) {
  showPad.value = false
  await signDocument(dataUrl)
}

async function signDocument(signatureDataUrl: string) {
  if (!signingRequest.value) return
  signing.value = true
  signingStep.value = 'Recording on blockchain...'
  try {
    if (!isAuthorized.value) {
      toast.error('Connect the correct wallet to sign this document')
      return
    }

    const hash = await recordSignature({
      documentId: route.params.requestId as string,
      signerAddress: address.value!,
      documentTitle: signingRequest.value.document_title,
      walrusBlobId: signingRequest.value.document_walrus_blob_id,
    })

    let signedBlobId: string | undefined

    if (pdfBytes.value) {
      signingStep.value = 'Embedding signature in PDF...'
      const field = placedField.value ?? { x_pct: 80, y_pct: 88 }
      const signedPdf = await embedDrawnSignature(pdfBytes.value, {
        dataUrl: signatureDataUrl,
        x_pct: field.x_pct,
        y_pct: field.y_pct,
        signerEmail: address.value!,
        txHash: hash,
        signedAt: new Date().toISOString(),
      })

      signingStep.value = 'Uploading signed PDF...'
      const uploadRes = await fetch('/api/blob/upload', {
        method: 'POST',
        body: new Blob([signedPdf.buffer as ArrayBuffer], { type: 'application/pdf' }),
        headers: { 'Content-Type': 'application/octet-stream' },
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { blobId } = await uploadRes.json()
      signedBlobId = blobId
    }

    await $fetch(`/api/sign/${route.params.requestId}`, {
      method: 'POST',
      body: { action: 'sign', signer_wallet: address.value, sui_tx_hash: hash, signed_blob_id: signedBlobId },
    })
    txHash.value = hash
    signed.value = true
    toast.success('Document signed successfully')
  } catch (e: any) {
    toast.error(e.data?.message ?? 'Signing failed')
  } finally {
    signing.value = false
    signingStep.value = ''
  }
}

async function declineDocument() {
  if (!signingRequest.value) return
  declining.value = true
  try {
    await $fetch(`/api/sign/${route.params.requestId}`, {
      method: 'POST',
      body: { action: 'decline' },
    })
    declined.value = true
  } catch (e: any) {
    toast.error(e.data?.message ?? 'Failed to decline')
  } finally {
    declining.value = false
  }
}
</script>
