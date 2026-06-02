<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6 text-center">

      <div class="space-y-2">
        <div class="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.jpeg" alt="Tidemark" class="w-8 h-8 object-contain" />
          <span class="font-semibold text-lg tracking-tight">Tidemark</span>
        </div>
        <h1 class="text-2xl font-serif font-medium">Connect your wallet</h1>
        <p class="text-sm text-muted-foreground">
          Connect your wallet to access your documents.
        </p>
      </div>

      <div class="border border-border rounded-xl p-6 space-y-4 bg-card">
        <ClientOnly>
          <div v-if="isConnected" class="space-y-4">
            <div class="flex items-center justify-center gap-2 text-sm">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span class="text-muted-foreground font-mono">{{ shortAddress }}</span>
            </div>
            <Button class="w-full" @click="navigateTo('/dashboard')">
              Go to Dashboard
            </Button>
            <Button variant="ghost" size="sm" class="w-full" @click="disconnect">
              Disconnect
            </Button>
          </div>

          <div v-else class="space-y-3">
            <Button class="w-full" @click="showModal = true">
              Connect Wallet
            </Button>
            <p class="text-xs text-muted-foreground">
              Supports: Sui Wallet, Slush, Suiet, and more.
            </p>
          </div>
        </ClientOnly>
      </div>

      <p class="text-xs text-muted-foreground">
        No account needed. Your wallet is your identity.
      </p>
    </div>

    <WalletModal v-if="showModal" @close="showModal = false" @success="onConnected" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: [] })

const { isConnected, address, disconnect } = useWallet()
const showModal = ref(false)

const shortAddress = computed(() =>
  address.value ? `${address.value.slice(0, 6)}…${address.value.slice(-4)}` : ''
)

function onConnected() {
  showModal.value = false
  navigateTo('/dashboard')
}
</script>
