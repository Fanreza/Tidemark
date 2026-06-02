<template>
  <div>

    <!-- ── Hero ─────────────────────────────────────────────── -->
    <section class="relative min-h-[92vh] flex items-center overflow-hidden">

      <!-- Grid pattern -->
      <GridPattern :size="48" />

      <!-- Radial fade overlay so grid fades out at edges -->
      <div class="pointer-events-none absolute inset-0"
           style="background: radial-gradient(ellipse 80% 60% at 50% 0%, transparent 30%, var(--background) 85%)" />

      <!-- Spotlight that follows cursor -->
      <SpotlightBackground
        class="absolute inset-0"
        color="oklch(0.52 0.18 230)"
        :size="700"
        :opacity="0.08"
      />

      <div class="relative w-full px-8 sm:px-12 lg:px-20 xl:px-32 2xl:px-48 pt-16 pb-24 grid lg:grid-cols-[1fr_420px] gap-16 items-center">

        <!-- Left: text -->
        <div class="hero-enter">
          <div class="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 mb-8">
            <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span class="text-[11px] text-muted-foreground tracking-wide">Blockchain · Decentralized · Encrypted</span>
          </div>

          <h1 class="font-serif font-medium leading-[1.03] text-foreground mb-8"
              style="font-size: clamp(2.8rem, 7vw, 5.5rem)">
            Documents that<br />
            <em class="not-italic text-primary">outlast the platform.</em>
          </h1>

          <p class="text-muted-foreground leading-relaxed mb-12 max-w-sm"
             style="font-size: 1.0625rem">
            Upload a contract, collect signatures, store it on
            decentralized storage. No server holds the master copy. No company can delete it.
          </p>

          <div class="flex flex-wrap items-center gap-5">
            <Button size="lg" class="px-8 h-12 text-sm" @click="getStarted">
              Get started
            </Button>
            <button
              class="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 group"
              @click="viewDemo"
            >
              See the dashboard
              <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        <!-- Right: mock document card with BorderBeam -->
        <div class="hero-enter hidden lg:block relative" style="animation-delay: 0.15s">
          <div class="doc-card relative overflow-hidden" style="box-shadow: 0 0 0 1px rgba(82,182,255,0.18), 0 0 40px rgba(82,182,255,0.08), 0 8px 40px oklch(0 0 0 / 0.1);">

            <div class="doc-card-header">
              <div class="flex items-center gap-2 mb-3">
                <img src="/logo.jpeg" alt="" class="w-4 h-4 rounded object-contain opacity-60" />
                <span class="text-[10px] text-muted-foreground tracking-wide uppercase">Tidemark</span>
              </div>
              <p class="font-serif text-base font-medium text-foreground/90 leading-snug">
                Service Agreement<br />
                <span class="text-sm font-normal text-muted-foreground">Q2 2025</span>
              </p>
            </div>

            <div class="px-5 py-4 space-y-2">
              <div class="h-1.5 bg-foreground/6 rounded-full w-full" />
              <div class="h-1.5 bg-foreground/6 rounded-full w-5/6" />
              <div class="h-1.5 bg-foreground/6 rounded-full w-4/5" />
              <div class="h-1.5 bg-foreground/6 rounded-full w-full mt-4" />
              <div class="h-1.5 bg-foreground/6 rounded-full w-3/4" />
            </div>

            <div class="px-5 py-4 border-t border-border space-y-3">
              <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Signers</p>

              <div class="signer-row">
                <div class="signer-dot bg-primary" />
                <span class="text-xs text-foreground/70 flex-1">alice@company.io</span>
                <span class="text-[10px] text-primary font-medium">Signed</span>
              </div>
              <div class="signer-row">
                <div class="signer-dot bg-muted-foreground/30" />
                <span class="text-xs text-foreground/70 flex-1">bob@partner.com</span>
                <span class="text-[10px] text-muted-foreground">Pending</span>
              </div>
            </div>

            <div class="px-5 py-3 border-t border-border flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span class="text-[10px] text-muted-foreground">Decentralized storage · testnet</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── Tech stack marquee ──────────────────────────────── -->
    <div class="border-y border-border bg-muted/30 py-4 overflow-hidden">
      <div class="marquee-track flex items-center gap-10">
        <template v-for="_ in 3" :key="_">
          <span v-for="item in techStack" :key="item.label" class="flex items-center gap-2 text-xs text-muted-foreground/60 shrink-0 font-medium tracking-wide uppercase">
            <span class="text-base">{{ item.icon }}</span>{{ item.label }}
          </span>
        </template>
      </div>
    </div>

    <!-- ── How it works ──────────────────────────────────────── -->
    <section class="max-w-5xl mx-auto px-6 py-28">
      <p class="label mb-20">How it works</p>

      <div class="space-y-20">

        <div class="reveal grid md:grid-cols-[80px_1fr_1fr] gap-8 items-start">
          <span class="font-serif text-4xl text-muted-foreground/20 font-medium select-none pt-1">01</span>
          <div>
            <h3 class="font-serif text-xl font-medium mb-3">Secure sharing</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Generate a link with an expiry date, an optional password, and view tracking.
              You see when someone opened it and whether they actually read it.
            </p>
          </div>
          <ul class="space-y-2.5 text-sm text-foreground/50 border-l border-border/60 pl-5">
            <li>Password protection and expiry</li>
            <li>Per-open view tracking</li>
            <li>Download on or off</li>
            <li>Revoke access any time</li>
          </ul>
        </div>

        <div class="reveal grid md:grid-cols-[80px_1fr_1fr] gap-8 items-start" style="transition-delay: 80ms">
          <span class="font-serif text-4xl text-muted-foreground/20 font-medium select-none pt-1">02</span>
          <div>
            <h3 class="font-serif text-xl font-medium mb-3">Blockchain signatures</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Each signature is recorded permanently on the blockchain. You do not need to trust Tidemark
              to verify the record. Anyone can verify it independently.
            </p>
          </div>
          <ul class="space-y-2.5 text-sm text-foreground/50 border-l border-border/60 pl-5">
            <li>Multi-party signing with order</li>
            <li>Immutable audit trail</li>
            <li>Permanent decentralized storage</li>
            <li>Decline with reason</li>
          </ul>
        </div>

      </div>
    </section>

    <!-- ── Rule ──────────────────────────────────────────────── -->
    <div class="max-w-5xl mx-auto px-6">
      <div class="border-t border-border" />
    </div>

    <!-- ── Three pillars ─────────────────────────────────────── -->
    <section class="max-w-5xl mx-auto px-6 py-28">
      <div class="grid md:grid-cols-3 gap-6">

        <Card class="reveal p-6 bg-card/60">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <h3 class="font-medium text-sm mb-2 tracking-tight">Permanent storage</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Your file is spread across a decentralized network.
            No single company controls it or can take it down.
          </p>
        </Card>

        <Card class="reveal p-6 bg-card/60" style="transition-delay: 100ms">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <h3 class="font-medium text-sm mb-2 tracking-tight">Verifiable signatures</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Every signature is a blockchain transaction.
            Anyone can verify it without asking us.
          </p>
        </Card>

        <Card class="reveal p-6 bg-card/60" style="transition-delay: 200ms">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h3 class="font-medium text-sm mb-2 tracking-tight">Full visibility</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Know when your document was opened, which pages were read,
            and who has signed and who has not.
          </p>
        </Card>

      </div>
    </section>

    <!-- ── Rule ──────────────────────────────────────────────── -->
    <div class="max-w-5xl mx-auto px-6">
      <div class="border-t border-border" />
    </div>

    <!-- ── FAQ ───────────────────────────────────────────────── -->
    <section class="max-w-5xl mx-auto px-6 py-28">
      <div class="grid md:grid-cols-[220px_1fr] gap-16">

        <div class="reveal">
          <p class="label mb-4">FAQ</p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Questions people ask before trusting a new tool with their contracts.
          </p>
        </div>

        <div class="reveal" style="transition-delay: 80ms">
          <Accordion type="single" collapsible>
            <AccordionItem
              v-for="item in faqItems"
              :key="item.q"
              :value="item.q"
            >
              <AccordionTrigger class="text-sm font-medium text-left py-5">
                {{ item.q }}
              </AccordionTrigger>
              <AccordionContent class="text-sm text-muted-foreground leading-relaxed">
                {{ item.a }}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </section>

    <!-- ── Bottom CTA ────────────────────────────────────────── -->
    <section class="relative border-t border-border overflow-hidden bg-card/40">
      <GridPattern :size="48" stroke="rgba(255,255,255,0.04)" />
      <div class="relative max-w-5xl mx-auto px-6 py-28 reveal">
        <p class="label mb-8">Start now</p>
        <h2 class="font-serif font-medium leading-tight mb-6 max-w-lg"
            style="font-size: clamp(2rem, 4vw, 3rem)">
          Stop trusting servers with documents that matter.
        </h2>
        <p class="text-sm text-muted-foreground mb-10 max-w-xs leading-relaxed">
          Connect your wallet and upload your first document in under a minute.
        </p>
        <Button size="lg" class="px-8 h-12 text-sm" @click="getStarted">
          Get started
        </Button>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import Card from '@/components/ui/card/Card.vue'
import SpotlightBackground from '@/components/inspira/SpotlightBackground.vue'
import GridPattern from '@/components/inspira/GridPattern.vue'

const { isConnected } = useWallet()

const techStack = [
  { icon: '🔵', label: 'Blockchain' },
  { icon: '🗄️', label: 'Decentralized Storage' },
  { icon: '🔒', label: 'End-to-End Encryption' },
  { icon: '⚡', label: 'Blockchain Signing' },
  { icon: '🌐', label: 'Decentralized' },
  { icon: '🔑', label: 'Wallet Login' },
]

const faqItems = [
  {
    q: 'Do signers need a crypto wallet?',
    a: 'Not in the traditional sense. Signers can connect via Google login using zkLogin and get a real Sui address derived from their OAuth token, with no extension to install. Users who already have a Sui wallet can connect that instead.',
  },
  {
    q: 'Is my document actually permanent?',
    a: 'Once uploaded, the file is spread across a decentralized storage network. No single company, including us, controls it or can remove it. The storage ID lets anyone retrieve the original file independently.',
  },
  {
    q: 'Can I edit a document after uploading?',
    a: 'No, and that is intentional. Immutability is what makes the signature meaningful. If you need to change something, upload a new version and start a fresh signing round.',
  },
  {
    q: 'How does blockchain signing actually work?',
    a: 'When a signer approves, their wallet submits a blockchain transaction that records the document hash, their address, and a timestamp. The transaction hash is stored alongside the document so anyone can verify it independently without us.',
  },
  {
    q: 'What happens if Tidemark shuts down?',
    a: 'Your documents remain on decentralized storage and your signatures remain on the blockchain. Both are publicly readable. You do not need Tidemark to prove a document was signed.',
  },
  {
    q: 'Is document content encrypted?',
    a: 'Public documents are retrievable by anyone with the storage ID. Choose "Private" on upload to encrypt before the file leaves your browser — only your wallet can decrypt it.',
  },
]

onMounted(() => {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
    }),
    { threshold: 0.1 },
  )
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
})

function getStarted() {
  if (isConnected.value) { navigateTo('/dashboard'); return }
  showWalletModal.value = true
}

function viewDemo() { navigateTo('/dashboard') }

useSeoMeta({
  title: 'Tidemark: Documents that outlast the platform.',
  description: 'Document signing and sharing, secured by blockchain. Permanent decentralized storage. No server holds the master copy.',
})
</script>

<style scoped>
.hero-enter {
  animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.visible { opacity: 1; transform: translateY(0); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--muted-foreground);
  font-family: var(--font-sans);
  display: block;
}

.doc-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  overflow: hidden;
  box-shadow: 0 8px 40px oklch(0 0 0 / 0.06), 0 1px 3px oklch(0 0 0 / 0.04);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
}
.doc-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px oklch(0 0 0 / 0.1), 0 2px 6px oklch(0 0 0 / 0.05);
}

.doc-card-header {
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--border);
}

.signer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.signer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Marquee */
.marquee-track {
  animation: marquee 30s linear infinite;
  white-space: nowrap;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-33.333%); }
}
</style>
