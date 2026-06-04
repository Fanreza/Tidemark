<template>
  <div class="max-w-5xl mx-auto px-4 py-10">

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="space-y-2">
        <div class="h-7 w-72 bg-muted animate-pulse rounded" />
        <div class="h-4 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div class="h-10 w-80 bg-muted animate-pulse rounded" />
      <div class="h-64 bg-muted animate-pulse rounded-xl" />
    </div>

    <!-- Not found -->
    <div v-else-if="!doc" class="text-center py-24">
      <p class="text-lg font-medium mb-2">Document not found</p>
      <p class="text-sm text-muted-foreground mb-6">This document may have been removed or you may not have access.</p>
      <NuxtLink to="/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </NuxtLink>
    </div>

    <!-- Document -->
    <div v-else class="space-y-8">

      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <NuxtLink to="/dashboard" class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Dashboard
          </NuxtLink>
          <h1 class="text-2xl font-serif font-medium leading-snug">{{ doc.title }}</h1>
          <div class="flex items-center gap-2.5 flex-wrap">
            <span :class="['text-xs px-2.5 py-1 rounded-full font-medium', getStatusColor(effectiveStatus)]">
              {{ effectiveStatus }}
            </span>
            <span class="text-xs text-muted-foreground">Uploaded {{ formatDate(doc.created_at) }}</span>
            <span class="text-xs text-muted-foreground px-2 py-0.5 rounded border border-border bg-muted/40">Decentralized</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">Document ID</span>
            <code class="text-xs font-mono text-muted-foreground truncate max-w-xs">{{ doc.id }}</code>
            <button class="text-xs text-primary hover:underline shrink-0" @click="copyDocId">Copy</button>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <a
            :href="`https://walruscan.com/testnet/blob/${doc.walrus_blob_id}`"
            target="_blank"
          >
            <Button variant="outline" size="sm">Storage proof ↗</Button>
          </a>
        </div>
      </div>

      <!-- PDF Preview -->
      <div class="border border-border rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <div class="flex items-center gap-2">
            <p class="text-xs text-muted-foreground font-medium">Preview</p>
            <span v-if="ownerPlacing" class="text-xs text-amber-600 font-medium animate-pulse">
              Click on document to place your signature
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="ownerPlacing"
              class="text-xs text-destructive hover:underline"
              @click="ownerPlacing = false"
            >
              Cancel
            </button>
            <a
              v-else
              :href="`${aggregatorUrl}/v1/blobs/${doc.walrus_blob_id}`"
              target="_blank"
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Open full
            </a>
          </div>
        </div>
        <div v-if="previewLoading" class="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading document...
        </div>
        <!-- Encrypted: needs wallet to decrypt (Seal hidden for now — demo) -->
        <div v-else-if="false && doc.is_encrypted && !previewUrl" class="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
          <p class="text-sm font-medium">End-to-end encrypted</p>
          <p class="text-xs text-muted-foreground max-w-sm">
            This document is end-to-end encrypted. Sign with your wallet to decrypt and preview it.
          </p>
          <Button size="sm" :disabled="decrypting" @click="decryptAndPreview">
            {{ decrypting ? 'Decrypting...' : 'Decrypt to preview' }}
          </Button>
        </div>

        <!-- Video -->
        <video
          v-else-if="previewUrl && mimeCategory === 'video'"
          :src="previewUrl"
          controls
          class="w-full max-h-130 bg-black"
        />

        <!-- Audio -->
        <div v-else-if="previewUrl && mimeCategory === 'audio'" class="flex items-center justify-center p-8">
          <audio :src="previewUrl" controls class="w-full" />
        </div>

        <!-- Image -->
        <div v-else-if="previewUrl && mimeCategory === 'image'" class="flex items-center justify-center p-6 bg-muted/10">
          <img :src="previewUrl" class="max-w-full max-h-130 rounded object-contain" alt="Preview" />
        </div>

        <!-- PDF preview with owner self-sign placement -->
        <div
          v-else-if="previewUrl && mimeCategory === 'application'"
          ref="previewContainerRef"
          class="relative w-full bg-muted/20 overflow-auto max-h-130 transition-[outline,background]"
          :style="ownerPlacing
            ? 'outline: 2px dashed #f59e0b; outline-offset: -2px; background: color-mix(in srgb, #f59e0b 5%, transparent); cursor: none;'
            : ''"
          @click.capture="ownerPlacing ? onOwnerPreviewClick($event) : undefined"
          @mousemove.capture="ownerPlacing ? onOwnerMouseMove($event) : undefined"
          @mouseleave="ownerCursorPos = null"
        >
          <VuePdfEmbed :source="previewUrl" class="w-full" @loaded="updateContainerScrollHeight" />

          <!-- Signature stamp size preview — follows the cursor -->
          <div
            v-if="ownerPlacing && ownerCursorPos"
            class="absolute pointer-events-none z-30"
            :style="{ left: ownerCursorPos.x + 'px', top: ownerCursorPos.y + 'px', transform: 'translate(-50%, -50%)' }"
          >
            <div class="rounded border-2 border-dashed border-green-500 shadow-lg bg-white/80 flex items-center justify-center text-gray-300 text-xs" style="width:168px;height:60px">
              ✍ signature
            </div>
          </div>

          <!-- Placed marker — top in pixels from scroll-content top -->
          <div
            v-if="ownerPlacedField"
            class="absolute pointer-events-none z-20"
            :style="{ left: ownerPlacedField.x_pct + '%', top: ((ownerPlacedField.y_pct / 100) * containerScrollHeight) + 'px', transform: 'translate(-50%, -50%)' }"
          >
            <div class="rounded border-2 border-green-500 shadow bg-green-50/90 flex items-center justify-center text-green-600 text-xs font-medium" style="width:168px;height:60px">
              ✓ Placed
            </div>
          </div>
        </div>

        <!-- Still loading / no URL yet -->
        <div v-else class="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
          <p class="text-sm text-muted-foreground">No preview available.</p>
          <a :href="walrusBlobUrl" target="_blank">
            <Button variant="outline" size="sm">Open file</Button>
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <div>
        <div class="flex border-b border-border">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === tab.value
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- SHARE TAB (owner only) -->
        <div v-if="isOwner" v-show="activeTab === 'share'" class="mt-6">
          <div class="max-w-xl space-y-1">

            <p class="text-sm font-medium mb-4">Share "{{ doc.title }}"</p>

            <!-- Permission row -->
            <div class="border border-border rounded-xl divide-y divide-border overflow-hidden">

              <!-- Access level -->
              <div class="flex items-center justify-between px-4 py-3 gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium">Anyone with the link</p>
                    <p class="text-xs text-muted-foreground">{{ shareOptions.allow_download ? 'Can view and download' : 'Can view only' }}</p>
                  </div>
                </div>
                <select
                  v-model="shareOptions.allow_download"
                  class="text-sm border border-border rounded-lg px-2 py-1.5 bg-background text-foreground shrink-0 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option :value="false">View only</option>
                  <option :value="true">View + Download</option>
                </select>
              </div>

              <!-- Password -->
              <div class="flex items-center justify-between px-4 py-3 gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div>
                    <p class="text-sm">Password protection</p>
                    <p v-if="activeLink?.password_hash && !shareOptions.password" class="text-xs text-green-600 mt-0.5">Password set — type to change</p>
                  </div>
                </div>
                <div class="relative w-36">
                  <Input
                    v-model="shareOptions.password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="activeLink?.password_hash ? '••••••••' : 'No password'"
                    class="h-8 text-sm pr-8"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    @click="showPassword = !showPassword"
                  >
                    <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <!-- Expires -->
              <div class="flex items-center justify-between px-4 py-3 gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  </div>
                  <p class="text-sm">Expiry date</p>
                </div>
                <div class="w-44">
                  <DatePicker v-model="shareOptions.expires_at" />
                </div>
              </div>
            </div>

            <!-- Save button -->
            <div v-if="activeLink" class="flex justify-end pt-2">
              <Button size="sm" :disabled="savingPermissions" @click="savePermissions">
                {{ savingPermissions ? 'Saving...' : 'Save settings' }}
              </Button>
            </div>

            <!-- Copy link row -->
            <div class="flex items-center gap-2 pt-1">
              <div class="flex-1 flex items-center gap-2 border border-border rounded-lg px-3 h-9 bg-muted/30 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <code class="text-xs text-muted-foreground truncate">
                  {{ activeLink ? shareUrl(activeLink.token) : 'No link yet' }}
                </code>
              </div>
              <Button v-if="activeLink" size="sm" @click="copyLink(activeLink.token)">Copy link</Button>
              <Button v-else size="sm" :disabled="creatingLink" @click="createLink">
                {{ creatingLink ? '...' : 'Enable sharing' }}
              </Button>
              <Button
                v-if="activeLink"
                variant="ghost"
                size="sm"
                class="text-destructive hover:bg-destructive/10 shrink-0"
                :disabled="!!deactivating"
                @click="deactivateLink(activeLink.token)"
              >
                {{ deactivating ? '...' : 'Revoke' }}
              </Button>
            </div>

          </div>
        </div>

        <!-- SIGN TAB -->
        <div v-show="activeTab === 'sign'" class="mt-6 space-y-6">

          <!-- Owner signature card (owner only) -->
          <div
            v-if="isOwner"
            class="border rounded-xl p-5"
            :class="ownerSigned ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border shrink-0"
                  :class="ownerSigned
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400'
                    : 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400'"
                >
                  {{ ownerSigned ? '✓' : '!' }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ ownerSigned ? 'You have signed this document' : 'You haven\'t signed this document yet' }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ ownerSigned ? `Signed ${formatDate(ownerSignedAt!)}` : 'As the document owner, you should sign before requesting others to sign.' }}
                  </p>
                  <a
                    v-if="ownerSigned && ownerTxHash"
                    :href="`https://suiscan.xyz/testnet/tx/${ownerTxHash}`"
                    target="_blank"
                    class="text-xs text-primary hover:underline"
                  >
                    View on blockchain ↗
                  </a>
                </div>
              </div>

              <div class="shrink-0">
                <!-- Placing mode: show instruction -->
                <span v-if="ownerPlacing" class="text-xs text-amber-700 dark:text-amber-400 animate-pulse">
                  Click PDF above ↑
                </span>
                <!-- Placed, ready to draw -->
                <Button
                  v-else-if="!ownerSigned && ownerPlacedField && !ownerSigningStep"
                  size="sm"
                  @click="showOwnerPad = true"
                >
                  Draw &amp; sign
                </Button>
                <!-- Default: start flow -->
                <Button
                  v-else-if="!ownerSigned && !ownerSigningStep"
                  size="sm"
                  @click="startOwnerSign"
                >
                  Sign Document
                </Button>
                <!-- Recording -->
                <span v-else-if="ownerSigningStep" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  {{ ownerSigningStep }}
                </span>
              </div>
            </div>
          </div>

          <div :class="isOwner ? 'grid md:grid-cols-[360px_1fr] gap-6 items-start' : ''">

            <div v-if="isOwner" class="border border-border rounded-xl p-6 space-y-5">
              <div>
                <h2 class="font-medium text-sm">Request signatures</h2>
                <p class="text-xs text-muted-foreground mt-1">Each signature is recorded permanently on the blockchain and is publicly verifiable.</p>
              </div>

              <div class="space-y-3">
                <!-- Selected signers -->
                <div v-if="selectedSigners.length" class="flex flex-wrap gap-2">
                  <div
                    v-for="s in selectedSigners"
                    :key="s.wallet_address"
                    class="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1 text-xs"
                  >
                    <span class="font-medium">@{{ s.username }}</span>
                    <button class="text-muted-foreground hover:text-destructive" @click="removeDocSigner(s.wallet_address)">✕</button>
                  </div>
                </div>
                <!-- Search -->
                <div class="relative">
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                    <Input
                      v-model="signerSearch"
                      placeholder="username or wallet address..."
                      class="pl-7"
                      @input="onDocSearchInput"
                      @keydown.escape="docSearchResults = []; docSearchLoading = false"
                    />
                    <span v-if="docSearchLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <span class="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin block" />
                    </span>
                  </div>
                  <div
                    v-if="docSearchResults.length || (signerSearch.trim().length >= 2 && !docSearchLoading && docSearchQueried)"
                    class="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                  >
                    <div v-if="!docSearchResults.length" class="px-3 py-3 text-xs text-muted-foreground text-center">
                      No users found for "{{ signerSearch.trim() }}"
                    </div>
                    <button
                      v-for="u in docSearchResults"
                      :key="u.wallet_address"
                      class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                      @click="addDocSigner(u)"
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

              <Button
                class="w-full"
                :disabled="selectedSigners.length === 0 || sendingRequests"
                @click="sendSigningRequests"
              >
                {{ sendingRequests ? 'Sending...' : 'Send requests' }}
              </Button>
            </div>

            <!-- Signing status -->
            <div class="space-y-3">
              <h2 class="font-medium text-sm">
                All signatures
                <span class="text-muted-foreground font-normal">({{ doc.signing_requests?.length ?? 0 }})</span>
              </h2>

              <div v-if="!doc.signing_requests?.length" class="border border-border rounded-xl p-8 text-center">
                <p class="text-sm text-muted-foreground">No signatures yet.</p>
                <p class="text-xs text-muted-foreground mt-1">Sign the document first, then add external signers.</p>
              </div>

              <div
                v-for="req in [...(doc.signing_requests ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)"
                :key="req.id"
                class="border border-border rounded-xl p-4 space-y-2.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium truncate">
                        {{ req.order_index === -1 ? (isOwner ? 'You (owner)' : 'Owner') : displayIdentity(req.signer_username, req.signer_wallet) }}
                      </p>
                      <span v-if="req.order_index === -1" class="text-xs text-muted-foreground">(owner)</span>
                    </div>
                    <p v-if="req.order_index !== -1 && req.signer_wallet" class="text-xs text-muted-foreground font-mono truncate">{{ req.signer_wallet }}</p>
                  </div>
                  <span :class="[
                    'text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0',
                    req.status === 'signed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                    req.status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  ]">{{ req.status }}</span>
                </div>

                <div v-if="req.sui_tx_hash" class="bg-muted/50 rounded px-3 py-2 flex items-center justify-between gap-2">
                  <p class="text-xs font-mono text-muted-foreground truncate">{{ req.sui_tx_hash.slice(0, 24) }}...</p>
                  <a :href="`https://suiscan.xyz/testnet/tx/${req.sui_tx_hash}`" target="_blank" class="text-xs text-primary hover:underline shrink-0">View ↗</a>
                </div>

                <div v-if="req.status === 'pending' && req.order_index !== -1">
                  <button class="text-xs text-primary hover:underline" @click="copySignLink(req.id)">
                    Copy signing link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AUDIT TAB -->
        <div v-show="activeTab === 'audit'" class="mt-6">
          <div class="border border-border rounded-xl divide-y divide-border overflow-hidden">
            <div class="px-6 py-4">
              <h2 class="font-medium text-sm">Audit trail</h2>
              <p class="text-xs text-muted-foreground mt-1">All events are recorded on the blockchain and cannot be modified.</p>
            </div>

            <div class="divide-y divide-border">
              <!-- Upload event -->
              <div class="flex items-start gap-4 px-6 py-4">
                <div class="mt-1 w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">Uploaded to decentralized storage</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(doc.created_at) }}</p>
                  <code class="text-xs text-muted-foreground mt-1 block truncate">{{ doc.walrus_blob_id }}</code>
                </div>
              </div>

              <!-- Share link events -->
              <div
                v-for="link in sortedShareLinks"
                :key="'link-' + link.id"
                class="flex items-start gap-4 px-6 py-4"
              >
                <div class="mt-1 w-2 h-2 rounded-full shrink-0" :class="link.is_active ? 'bg-blue-400' : 'bg-muted-foreground/40'" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">Share link {{ link.is_active ? 'created' : 'revoked' }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(link.created_at) }} · {{ link.view_count }} view{{ link.view_count !== 1 ? 's' : '' }}</p>
                </div>
              </div>

              <!-- Signing request events -->
              <div
                v-for="req in doc.signing_requests"
                :key="'req-' + req.id"
                class="flex items-start gap-4 px-6 py-4"
              >
                <div
                  class="mt-1 w-2 h-2 rounded-full shrink-0"
                  :class="req.status === 'signed' ? 'bg-green-500' : req.status === 'declined' ? 'bg-red-400' : 'bg-amber-400'"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">
                    <span v-if="req.order_index === -1">
                      {{ req.status === 'signed' ? 'Signed by owner' : 'Owner signature pending' }}
                    </span>
                    <span v-else-if="req.status === 'signed'">Signed by {{ displayIdentity(req.signer_username, req.signer_wallet) }}</span>
                    <span v-else-if="req.status === 'declined'">Declined by {{ displayIdentity(req.signer_username, req.signer_wallet) }}</span>
                    <span v-else>Awaiting signature from {{ displayIdentity(req.signer_username, req.signer_wallet) }}</span>
                  </p>
                  <p v-if="req.signed_at" class="text-xs text-muted-foreground mt-0.5">{{ formatDate(req.signed_at) }}</p>
                  <code v-if="req.sui_tx_hash" class="text-xs text-muted-foreground mt-1 block truncate">{{ req.sui_tx_hash }}</code>
                </div>
              </div>
            </div>

            <!-- Walrus verification -->
            <div class="px-6 py-4 bg-muted/20">
              <p class="text-xs font-medium mb-1.5">Storage proof</p>
              <a
                :href="`${aggregatorUrl}/v1/blobs/${doc.walrus_blob_id}`"
                target="_blank"
                class="text-xs font-mono text-muted-foreground hover:text-foreground break-all transition-colors"
              >
                {{ aggregatorUrl }}/v1/blobs/{{ doc.walrus_blob_id }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Owner signature pad modal -->
  <SignaturePad
    v-if="showOwnerPad"
    @confirm="onOwnerSignatureConfirm"
    @cancel="showOwnerPad = false"
  />
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'))

const { decryptFile } = useSeal()

const route = useRoute()
const config = useRuntimeConfig()
const aggregatorUrl = config.public.walrusAggregator as string
const { fetchDocument, createShareLink, deactivateShareLink, updateShareLink, requestSignatures, getStatusColor } = useDocuments()
const { recordSignature } = useSui()
const { embedDrawnSignature } = usePdfSigner()

const tabs = computed(() =>
  isOwner.value
    ? [
        { value: 'share', label: 'Share' },
        { value: 'sign', label: 'Signatures' },
        { value: 'audit', label: 'Audit Trail' },
      ]
    : [
        { value: 'sign', label: 'Signatures' },
        { value: 'audit', label: 'Audit Trail' },
      ],
)
const activeTab = ref((route.query.tab as string) || 'share')


const { address } = useWallet()

const loading = ref(true)
const previewLoading = ref(false)
const previewUrl = ref<string | null>(null)
const decrypting = ref(false)
const creatingLink = ref(false)
const sendingRequests = ref(false)
const deactivating = ref<string | null>(null)
const doc = ref<any>(null)
const isOwner = computed(() =>
  !!doc.value && !!address.value &&
  doc.value.owner_wallet?.toLowerCase() === address.value.toLowerCase(),
)
const effectiveStatus = computed(() => {
  const reqs = doc.value?.signing_requests ?? []
  if (reqs.length && reqs.every((r: any) => r.status === 'signed')) return 'completed'
  if (reqs.some((r: any) => r.status === 'pending')) return 'signing'
  return doc.value?.status ?? ''
})
interface UserResult { wallet_address: string; username: string }
const selectedSigners = ref<UserResult[]>([])
const signerSearch = ref('')
const docSearchResults = ref<UserResult[]>([])
const docSearchLoading = ref(false)
const docSearchQueried = ref(false)

let _docSearchTimer: ReturnType<typeof setTimeout> | null = null
function onDocSearchInput() {
  docSearchQueried.value = false
  if (_docSearchTimer) clearTimeout(_docSearchTimer)
  const q = signerSearch.value.trim()
  if (q.length < 2) { docSearchResults.value = []; docSearchLoading.value = false; return }
  docSearchLoading.value = true
  _docSearchTimer = setTimeout(async () => {
    try {
      const results = await $fetch<UserResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`)
      docSearchResults.value = results.filter(u => !selectedSigners.value.some(s => s.wallet_address === u.wallet_address))
    } catch (e) { console.error(e); docSearchResults.value = [] }
    finally { docSearchLoading.value = false; docSearchQueried.value = true }
  }, 300)
}
function addDocSigner(user: UserResult) {
  if (!selectedSigners.value.some(s => s.wallet_address === user.wallet_address))
    selectedSigners.value.push(user)
  signerSearch.value = ''
  docSearchResults.value = []
}
function removeDocSigner(wallet: string) {
  selectedSigners.value = selectedSigners.value.filter(s => s.wallet_address !== wallet)
}
const previewContainerRef = ref<HTMLElement | null>(null)
const shareOptions = reactive({
  allow_download: false,
  password: '',
  expires_at: '',
})
const showPassword = ref(false)
const savingPermissions = ref(false)

// Owner self-sign flow
const ownerSigningStep = ref('')
const ownerPlacing = ref(false)
const ownerPlacedField = ref<{ x_pct: number; y_pct: number } | null>(null)
const showOwnerPad = ref(false)
const containerScrollHeight = ref(0)
const ownerCursorPos = ref<{ x: number; y: number } | null>(null)

function updateContainerScrollHeight() {
  nextTick(() => {
    if (previewContainerRef.value) {
      containerScrollHeight.value = previewContainerRef.value.scrollHeight
    }
  })
}

const walrusBlobUrl = computed(() =>
  doc.value ? `${aggregatorUrl}/v1/blobs/${doc.value.walrus_blob_id}` : ''
)
const mimeCategory = computed(() => doc.value?.file_type?.split('/')[0] ?? '')
const isOffice = computed(() =>
  doc.value?.file_type?.includes('word') ||
  doc.value?.file_type?.includes('officedocument') ||
  doc.value?.file_type?.includes('msword')
)

const ownerSigningReq = computed(() =>
  doc.value?.signing_requests?.find((r: any) => r.order_index === -1)
)
const ownerSigned = computed(() => ownerSigningReq.value?.status === 'signed')
const ownerTxHash = computed(() => ownerSigningReq.value?.sui_tx_hash ?? null)
const ownerSignedAt = computed(() => ownerSigningReq.value?.signed_at ?? null)

const activeLinks = computed(() => doc.value?.share_links?.filter((l: any) => l.is_active) ?? [])
const activeLink = computed(() => activeLinks.value[0] ?? null)
const revokedLinks = computed(() => doc.value?.share_links?.filter((l: any) => !l.is_active) ?? [])
const sortedShareLinks = computed(() =>
  [...(doc.value?.share_links ?? [])].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
)

async function reload() {
  doc.value = await fetchDocument(route.params.id as string)
}

watch(activeLink, (link) => {
  if (!link) return
  shareOptions.allow_download = link.allow_download ?? false
  shareOptions.expires_at = link.expires_at ?? ''
  // password_hash is hashed server-side — don't try to show it, leave the field empty
}, { immediate: true })

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function displayIdentity(username: string | null | undefined, wallet: string | null | undefined): string {
  if (!wallet && !username) return 'Unknown'
  const walletPart = wallet ? wallet.slice(0, 8) + '…' + wallet.slice(-6) : ''
  if (username) return `@${username} (${walletPart})`
  return walletPart
}

function shareUrl(token: string): string {
  return `${window.location.origin}/view/${token}`
}

async function copyLink(token: string) {
  await navigator.clipboard.writeText(shareUrl(token))
  toast.success('Link copied to clipboard')
}

async function copyDocId() {
  if (!doc.value) return
  await navigator.clipboard.writeText(doc.value.id)
  toast.success('Document ID copied — paste it on the Verify page')
}

async function copySignLink(requestId: string) {
  await navigator.clipboard.writeText(`${window.location.origin}/sign/${requestId}`)
  toast.success('Signing link copied')
}

async function savePermissions() {
  if (!activeLink.value) return
  savingPermissions.value = true
  try {
    await updateShareLink(activeLink.value.token, {
      allow_download: shareOptions.allow_download,
      password: shareOptions.password || undefined,
      expires_at: shareOptions.expires_at || undefined,
    })
    shareOptions.password = ''
    await reload()
    toast.success('Settings saved')
  } catch (e: any) {
    toast.error(e.data?.message ?? e.message)
  } finally {
    savingPermissions.value = false
  }
}

async function createLink() {
  if (!doc.value) return
  creatingLink.value = true
  try {
    await createShareLink(doc.value.id, {
      allow_download: shareOptions.allow_download,
      password: shareOptions.password || undefined,
      expires_at: shareOptions.expires_at || undefined,
    })
    shareOptions.password = ''
    await reload()
    toast.success('Sharing enabled')
  } catch (e: any) {
    toast.error(e.data?.message ?? e.message)
  } finally {
    creatingLink.value = false
  }
}

async function deactivateLink(token: string) {
  deactivating.value = token
  try {
    await deactivateShareLink(token)
    await reload()
    toast.success('Share link revoked')
  } catch (e: any) {
    toast.error(e.data?.message ?? e.message)
  } finally {
    deactivating.value = null
  }
}

function startOwnerSign() {
  if (previewUrl.value && doc.value?.file_type?.includes('pdf')) {
    ownerPlacedField.value = null
    ownerPlacing.value = true
    nextTick(() => {
      updateContainerScrollHeight()
      previewContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  } else {
    showOwnerPad.value = true
  }
}

function onOwnerMouseMove(e: MouseEvent) {
  if (!previewContainerRef.value) return
  const el = previewContainerRef.value
  const rect = el.getBoundingClientRect()
  ownerCursorPos.value = {
    x: e.clientX - rect.left + el.scrollLeft,
    y: e.clientY - rect.top + el.scrollTop,
  }
}

function onOwnerPreviewClick(e: MouseEvent) {
  if (!previewContainerRef.value || !ownerPlacing.value) return
  const el = previewContainerRef.value
  const rect = el.getBoundingClientRect()
  const scrollH = el.scrollHeight || containerScrollHeight.value || rect.height
  ownerPlacedField.value = {
    x_pct: ((e.clientX - rect.left) / rect.width) * 100,
    y_pct: ((e.clientY - rect.top + el.scrollTop) / scrollH) * 100,
  }
  ownerPlacing.value = false
  ownerCursorPos.value = null
  showOwnerPad.value = true
}

async function onOwnerSignatureConfirm(dataUrl: string) {
  showOwnerPad.value = false
  await signAsOwner(dataUrl)
}

async function signAsOwner(signatureDataUrl: string) {
  if (!doc.value) return
  ownerSigningStep.value = 'Recording on blockchain...'
  try {
    const hash = await recordSignature({
      documentId: doc.value.id,
      signerAddress: address.value ?? '',
      documentTitle: doc.value.title,
      walrusBlobId: doc.value.walrus_blob_id,
    })

    let signedBlobId: string | undefined

    if (previewUrl.value && doc.value.file_type?.includes('pdf')) {
      ownerSigningStep.value = 'Embedding signature...'
      const res = await fetch(previewUrl.value)
      const bytes = await res.arrayBuffer()
      const field = ownerPlacedField.value ?? { x_pct: 80, y_pct: 88 }
      const signedPdf = await embedDrawnSignature(bytes, {
        dataUrl: signatureDataUrl,
        x_pct: field.x_pct,
        y_pct: field.y_pct,
        signerEmail: address.value ?? doc.value.owner_wallet,
        txHash: hash,
        signedAt: new Date().toISOString(),
      })

      ownerSigningStep.value = 'Uploading...'
      const uploadRes = await fetch('/api/blob/upload', {
        method: 'POST',
        body: new Blob([signedPdf.buffer as ArrayBuffer], { type: 'application/pdf' }),
        headers: { 'Content-Type': 'application/octet-stream' },
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { blobId } = await uploadRes.json()
      signedBlobId = blobId
    }

    await $fetch(`/api/documents/${doc.value.id}/owner-sign`, {
      method: 'POST',
      body: { sui_tx_hash: hash, signed_blob_id: signedBlobId, owner_wallet: address.value ?? 'demo-wallet' },
    })
    ownerPlacedField.value = null
    await reload()
    if (signedBlobId) {
      previewUrl.value = null
      loadPreview()
    }
    toast.success('Document signed — signature embedded and stored on decentralized storage')
  } catch (e: any) {
    toast.error(e.data?.message ?? e.message ?? 'Signing failed')
  } finally {
    ownerSigningStep.value = ''
  }
}

async function sendSigningRequests() {
  if (!doc.value || !selectedSigners.value.length) return
  sendingRequests.value = true
  try {
    await requestSignatures(doc.value.id, selectedSigners.value.map(s => s.wallet_address))
    selectedSigners.value = []
    await reload()
    toast.success(`Signing request sent to ${selectedSigners.value.length || 1} signer(s)`)
  } catch (e: any) {
    console.error(e)
    toast.error(e.data?.message ?? e.message)
  } finally {
    sendingRequests.value = false
  }
}

async function loadPreview() {
  if (!doc.value?.walrus_blob_id || doc.value?.is_encrypted) return
  // Office files use Google Docs Viewer directly — no fetch needed
  if (isOffice.value) return
  previewLoading.value = true
  const AGGREGATORS = [
    'https://wal-aggregator-testnet.staketab.org',
    'https://aggregator.walrus-testnet.walrus.space',
    'https://walrus-testnet-aggregator.bartestnet.com',
    'https://walrus-testnet.blockscope.net',
  ]
  for (const agg of AGGREGATORS) {
    try {
      const res = await fetch(`${agg}/v1/blobs/${doc.value.walrus_blob_id}`)
      if (!res.ok) continue
      const bytes = await res.arrayBuffer()
      const mime = doc.value.file_type || 'application/pdf'
      const blob = new Blob([bytes], { type: mime })
      previewUrl.value = URL.createObjectURL(blob)
      break
    } catch {
      // try next
    }
  }
  previewLoading.value = false
}

async function decryptAndPreview() {
  if (!doc.value?.seal_allowlist_id || !doc.value?.seal_encryption_id) {
    toast.error('Encryption metadata missing')
    return
  }
  decrypting.value = true
  try {
    const res = await fetch(`/api/blob/${doc.value.walrus_blob_id}`)
    if (!res.ok) throw new Error('File not found on decentralized storage')
    const encryptedBytes = new Uint8Array(await res.arrayBuffer())

    const decrypted = await decryptFile(
      encryptedBytes,
      doc.value.seal_encryption_id,
      doc.value.seal_allowlist_id,
    )

    const blob = new Blob([decrypted.buffer as ArrayBuffer], { type: doc.value.file_type || 'application/pdf' })
    previewUrl.value = URL.createObjectURL(blob)
  } catch (e: any) {
    toast.error(e?.message ?? 'Decryption failed')
  } finally {
    decrypting.value = false
  }
}

onMounted(async () => {
  try {
    await reload()
    // Signers (non-owners) can't use the Share tab — land them on Signatures.
    if (!isOwner.value && activeTab.value === 'share') activeTab.value = 'sign'
    loadPreview()
  } catch {
    doc.value = null
  } finally {
    loading.value = false
  }
})

useSeoMeta({ title: () => doc.value ? `${doc.value.title} | Tidemark` : 'Tidemark' })
</script>
