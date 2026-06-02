<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="flex items-center justify-center gap-2 mb-8">
        <img src="/logo.jpeg" alt="Tidemark" class="w-6 h-6 object-contain" />
        <span class="font-semibold text-sm tracking-tight">Tidemark</span>
      </div>

      <div class="border border-border rounded-2xl p-8 bg-card">
        <h1 class="text-lg font-semibold mb-1">Create your account</h1>
        <p class="text-sm text-muted-foreground mb-6">Choose a username to identify yourself on Tidemark.</p>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="e.g. john_doe"
              @keyup.enter="register"
            />
            <p class="text-xs text-muted-foreground">Letters, numbers, and underscores only. Min 3 characters.</p>
          </div>

          <div class="rounded-lg bg-muted/50 border border-border p-3">
            <p class="text-xs text-muted-foreground font-medium mb-0.5">Connected wallet</p>
            <p class="text-xs font-mono truncate">{{ address }}</p>
          </div>

          <Button class="w-full" :disabled="!isValid || loading" @click="register">
            <span v-if="loading" class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </span>
            <span v-else>Create Account</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

const { address } = useWallet()
const username = ref('')
const loading = ref(false)

const isValid = computed(() => {
  const clean = username.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  return clean.length >= 3
})

async function register() {
  if (!isValid.value || !address.value) return
  loading.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: { wallet_address: address.value, username: username.value.trim() },
    })
    toast.success('Account created!')
    await navigateTo('/dashboard')
  } catch (e: any) {
    console.error(e)
    toast.error(e.data?.message ?? e.message ?? 'Registration failed')
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Register | Tidemark' })
</script>
