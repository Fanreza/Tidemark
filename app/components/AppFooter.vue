<template>
  <footer class="border-t border-border mt-auto">
    <div class="max-w-5xl mx-auto px-6 py-10">
      <div class="grid sm:grid-cols-[1fr_auto] gap-8 items-start">

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

        <nav class="flex flex-col gap-2.5 text-xs text-muted-foreground">
          <NuxtLink to="/" class="hover:text-foreground transition-colors">Home</NuxtLink>
          <NuxtLink to="/verify" class="hover:text-foreground transition-colors">Verify Document</NuxtLink>
          <NuxtLink to="/dashboard" class="hover:text-foreground transition-colors">Go to App</NuxtLink>
        </nav>

      </div>

      <div class="border-t border-border mt-8 pt-6 flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} Tidemark. All rights reserved.
        </p>
        <p class="text-xs text-muted-foreground">testnet</p>
      </div>
    </div>
  </footer>
</template>
