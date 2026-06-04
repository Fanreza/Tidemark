<template>
  <div class="max-w-2xl mx-auto px-4 py-14">

    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-semibold mb-2">Verify a Document</h1>
      <p class="text-sm text-muted-foreground max-w-sm mx-auto">
        Check the authenticity and signing status of any document stored on decentralized storage.
        No login required.
      </p>
    </div>

    <!-- Input -->
    <div class="border border-border rounded-xl p-6 bg-card mb-6">
      <label class="block text-sm font-medium mb-2">Document ID</label>
      <div class="flex gap-2">
        <Input
          v-model="query"
          placeholder="e.g. 3f8a2c..."
          class="font-mono text-sm"
          @keydown.enter="verify"
        />
        <Button :disabled="!query.trim() || verifying" @click="verify">
          <span v-if="verifying" class="flex items-center gap-2">
            <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            Checking...
          </span>
          <span v-else>Verify</span>
        </Button>
      </div>
      <p class="text-xs text-muted-foreground mt-2">
        Enter the document ID from Tidemark or the storage blob ID.
      </p>
    </div>

    <!-- Error -->
    <div v-if="notFound" class="border border-border rounded-xl p-6 text-center bg-card">
      <div class="text-3xl mb-3">🔍</div>
      <p class="font-medium text-sm mb-1">Document not found</p>
      <p class="text-xs text-muted-foreground">Check the document ID and try again.</p>
    </div>

    <!-- Result -->
    <div v-else-if="result" class="space-y-4">

      <!-- Document info -->
      <div class="border border-border rounded-xl overflow-hidden bg-card">
        <div class="px-5 py-4 border-b border-border bg-muted/30">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-semibold text-sm">{{ result.title }}</p>
              <p class="text-xs text-muted-foreground font-mono mt-1 truncate max-w-xs">
                {{ result.owner_wallet }}
              </p>
            </div>
            <StatusBadge :status="result.status" />
          </div>
        </div>

        <div class="px-5 py-4 space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Uploaded</span>
            <span>{{ formatDate(result.created_at) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">File type</span>
            <span class="font-mono text-xs">{{ result.file_type || '—' }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Storage blob</span>
            <a
              :href="`https://walruscan.com/testnet/blob/${result.walrus_blob_id}`"
              target="_blank"
              class="text-xs font-mono text-primary hover:underline"
            >
              {{ result.walrus_blob_id.slice(0, 20) }}… ↗
            </a>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Encrypted</span>
            <span>{{ result.is_encrypted ? 'Yes (E2E encrypted)' : 'No' }}</span>
          </div>
        </div>
      </div>

      <!-- Signing records -->
      <div class="border border-border rounded-xl overflow-hidden bg-card">
        <div class="px-5 py-3.5 border-b border-border">
          <p class="text-sm font-medium">Signing Records</p>
        </div>

        <div v-if="!result.signing_requests?.length" class="px-5 py-8 text-center">
          <p class="text-sm text-muted-foreground">No signing requests for this document.</p>
        </div>

        <div v-else class="divide-y divide-border">
          <div
            v-for="req in result.signing_requests"
            :key="req.id"
            class="px-5 py-4 flex items-start justify-between gap-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border shrink-0"
                :class="{
                  'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400': req.status === 'signed',
                  'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-400': req.status === 'declined',
                  'bg-muted border-border text-muted-foreground': req.status === 'pending',
                }"
              >
                {{ (req.signer_username ?? req.signer_wallet ?? req.signer_email ?? '?').charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium">{{ req.signer_username ? `@${req.signer_username}` : (req.signer_wallet ? req.signer_wallet.slice(0, 8) + '…' + req.signer_wallet.slice(-6) : req.signer_email) }}</p>
                <p v-if="req.signer_username && req.signer_wallet" class="text-xs font-mono text-muted-foreground">{{ req.signer_wallet }}</p>
                <p v-if="req.signed_at" class="text-xs text-muted-foreground">
                  Signed {{ formatDate(req.signed_at) }}
                </p>
                <p v-else class="text-xs text-muted-foreground capitalize">{{ req.status }}</p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <div
                class="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': req.status === 'signed',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': req.status === 'declined',
                  'bg-muted text-muted-foreground': req.status === 'pending',
                }"
              >
                {{ req.status }}
              </div>
              <a
                v-if="req.sui_tx_hash"
                :href="`https://suiscan.xyz/testnet/tx/${req.sui_tx_hash}`"
                target="_blank"
                class="text-xs font-mono text-primary hover:underline block mt-1"
              >
                {{ req.sui_tx_hash.slice(0, 12) }}… ↗
              </a>
              <p
                v-if="req.sui_tx_hash && txChecks[req.sui_tx_hash]?.found"
                class="text-[11px] text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1 justify-end"
                title="Transaction confirmed on the Sui chain via Tatum RPC"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                On-chain · verified via Tatum
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Verification stamp -->
      <div class="border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 bg-green-50 dark:bg-green-900/20 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <div>
          <p class="text-sm font-medium text-green-800 dark:text-green-300">Document verified on decentralized storage</p>
          <p class="text-xs text-green-700 dark:text-green-400 mt-0.5">
            This document is permanently stored on decentralized storage.
            {{ result.status === 'completed' ? 'All signatures have been recorded on the blockchain.' : '' }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: [] })
useSeoMeta({ title: 'Verify Document | Tidemark' })

const query = ref('')
const verifying = ref(false)
const notFound = ref(false)
const result = ref<any>(null)
// On-chain verification results keyed by tx digest (powered by Tatum RPC).
const txChecks = ref<Record<string, any>>({})

async function verify() {
  const id = query.value.trim()
  if (!id) return

  verifying.value = true
  notFound.value = false
  result.value = null
  txChecks.value = {}

  try {
    const data = await $fetch<any>(`/api/documents/${id}`)
    result.value = data
    verifyOnChain()
  } catch {
    notFound.value = true
  } finally {
    verifying.value = false
  }
}

// Confirm each signed request's transaction on the Sui chain through Tatum's RPC gateway.
async function verifyOnChain() {
  const reqs = (result.value?.signing_requests ?? []).filter(
    (r: any) => r.status === 'signed' && r.sui_tx_hash,
  )
  await Promise.all(reqs.map(async (r: any) => {
    try {
      txChecks.value[r.sui_tx_hash] = await $fetch(`/api/tx/${r.sui_tx_hash}`)
    } catch {
      txChecks.value[r.sui_tx_hash] = { found: false }
    }
  }))
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
