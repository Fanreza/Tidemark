<template>
  <Dialog :open="true" @update:open="val => !val && $emit('close')">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <div class="flex items-center gap-2 mb-1">
          <img src="/logo.jpeg" alt="Tidemark" class="w-5 h-5 object-contain" />
          <span class="text-sm font-semibold">Tidemark</span>
        </div>
        <DialogTitle class="text-base">Connect wallet</DialogTitle>
        <DialogDescription>
          Choose how you want to sign in.
        </DialogDescription>
      </DialogHeader>

      <div v-if="wallets.length > 0" class="space-y-2 py-2">
        <button
          v-for="wallet in wallets"
          :key="wallet.name"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/60 transition-colors text-left disabled:opacity-50"
          :disabled="!!connecting"
          @click="connect(wallet)"
        >
          <img
            v-if="wallet.icon"
            :src="wallet.icon"
            :alt="wallet.name"
            class="w-8 h-8 rounded-md object-contain shrink-0"
          />
          <div
            v-else
            class="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0"
          >
            {{ wallet.name[0] }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ wallet.name }}</p>
            <p class="text-xs text-muted-foreground">{{ walletSubtitle(wallet) }}</p>
          </div>

          <svg
            v-if="connecting === wallet.name"
            class="w-4 h-4 animate-spin text-muted-foreground shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-muted-foreground shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div v-else class="py-6 text-center space-y-2">
        <p class="text-sm text-muted-foreground">No wallets detected.</p>
        <p class="text-xs text-muted-foreground">
          Install a compatible wallet extension like
          <a href="https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" class="underline hover:text-foreground">Sui Wallet</a>
          or
          <a href="https://chromewebstore.google.com/detail/slush-a-sui-wallet/albkcldkclhphbbgbilolmmkdlanlpab" target="_blank" class="underline hover:text-foreground">Slush</a>.
        </p>
      </div>

      <p v-if="errorMsg" class="text-xs text-destructive">{{ errorMsg }}</p>

      <DialogFooter class="text-xs text-muted-foreground justify-center sm:justify-center pt-0">
        Secured by blockchain · Decentralized storage
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Wallet } from '@mysten/wallet-standard'
import { isEnokiWallet } from '@mysten/enoki'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const emit = defineEmits<{ close: []; success: [] }>()

const { getAvailableWallets, connect: connectWallet } = useWallet()

const wallets = shallowRef<Wallet[]>([])
const connecting = ref<string | null>(null)
const errorMsg = ref('')

onMounted(() => {
  wallets.value = getAvailableWallets().map(w => markRaw(w))
})

function walletSubtitle(wallet: Wallet): string {
  try {
    return isEnokiWallet(wallet) ? 'Social login via zkLogin' : 'Browser extension'
  } catch {
    return 'Browser extension'
  }
}

async function connect(wallet: Wallet) {
  errorMsg.value = ''
  connecting.value = wallet.name
  try {
    await connectWallet(wallet)
    emit('success')
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to connect. Please try again.'
  } finally {
    connecting.value = null
  }
}
</script>
