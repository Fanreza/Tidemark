<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Tidemark" class="w-7 h-7 object-contain" />
          <span class="font-semibold text-sm tracking-tight">Tidemark</span>
        </NuxtLink>

        <nav class="flex items-center gap-2">
          <ClientOnly>
            <!-- Landing page: only show Go to App -->
            <template v-if="isLanding">
              <NuxtLink :to="isConnected ? '/dashboard' : '/login'">
                <Button size="sm">Go to App</Button>
              </NuxtLink>
            </template>

            <!-- App pages: full wallet nav -->
            <template v-else>
              <NuxtLink to="/verify">
                <Button variant="ghost" size="sm">Verify</Button>
              </NuxtLink>
              <NuxtLink v-if="isConnected" to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </NuxtLink>
              <NuxtLink v-if="isConnected" to="/upload">
                <Button size="sm">Upload</Button>
              </NuxtLink>
              <NuxtLink v-if="!isConnected" to="/login">
                <Button size="sm">Connect Wallet</Button>
              </NuxtLink>
              <div v-else class="flex items-center gap-2">
                <div class="hidden sm:flex items-center gap-1.5">
                  <img
                    v-if="walletIcon"
                    :src="walletIcon"
                    class="w-4 h-4 rounded object-contain"
                    alt=""
                  />
                  <span class="text-xs text-muted-foreground font-mono truncate max-w-35">
                    {{ shortAddress }}
                  </span>
                </div>
                <Button variant="ghost" size="sm" @click="handleDisconnect">Disconnect</Button>
              </div>
            </template>
          </ClientOnly>

          <!-- Dark mode toggle -->
          <ClientOnly>
            <button
              class="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleColorMode"
            >
              <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            </button>
          </ClientOnly>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <Sonner position="bottom-right" rich-colors close-button />

    <footer class="border-t border-border mt-auto">
      <div class="max-w-5xl mx-auto px-6 py-12">
        <div class="grid sm:grid-cols-[1fr_auto] gap-8 items-start">

          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <img src="/logo.jpeg" alt="Tidemark" class="w-5 h-5 object-contain" />
              <span class="font-semibold text-sm tracking-tight">Tidemark</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Document signing and sharing, secured by blockchain.
              Permanent decentralized storage. No server holds the master copy.
            </p>
          </div>

          <!-- Links -->
          <nav class="flex flex-col gap-2.5 text-xs text-muted-foreground">
            <NuxtLink to="/" class="hover:text-foreground transition-colors">Home</NuxtLink>
            <NuxtLink to="/verify" class="hover:text-foreground transition-colors">Verify Document</NuxtLink>
            <ClientOnly>
              <NuxtLink v-if="isConnected" to="/dashboard" class="hover:text-foreground transition-colors">Dashboard</NuxtLink>
              <NuxtLink v-if="isConnected" to="/upload" class="hover:text-foreground transition-colors">Upload</NuxtLink>
            </ClientOnly>
          </nav>

        </div>

        <div class="border-t border-border mt-10 pt-6 flex items-center justify-between">
          <p class="text-xs text-muted-foreground">
            &copy; {{ new Date().getFullYear() }} Tidemark. All rights reserved.
          </p>
          <p class="text-xs text-muted-foreground">testnet</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Toaster as Sonner } from '@/components/ui/sonner'
const { isConnected, address, walletIcon, disconnect } = useWallet()
const colorMode = useColorMode()
const route = useRoute()
const isLanding = computed(() => route.path === '/')

const isDark = computed(() => colorMode.value === 'dark')
function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const shortAddress = computed(() =>
  address.value ? `${address.value.slice(0, 6)}…${address.value.slice(-4)}` : ''
)

async function handleDisconnect() {
  await disconnect()
  navigateTo('/')
}
</script>
