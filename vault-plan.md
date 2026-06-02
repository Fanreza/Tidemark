# Vault — Product Plan
**Status:** Parked / On Hold
**Stack:** Sui · Walrus · Seal · Tatum
**Tagline:** A permanent internet home for creators.

---

## Core Concept

Web app profil kreator yang beautiful, punya permanent archive, dan bisa monetize lewat supporter passes. Crypto invisible — user tidak perlu tahu tentang wallets, RPC, atau blockchain.

Analog: Linktree evolved + Patreon dengan permanence + Are.na aesthetic.

---

## Tech Stack Roles

| Layer | Tool | Fungsi |
|---|---|---|
| Storage | Walrus | Semua media kreator disimpan permanen |
| Encryption + Access Control | Seal (Mysten Labs) | Gate exclusive content untuk supporters |
| Identity + Passes | Sui | Creator identity objects, supporter passes, era objects |
| RPC Infrastructure | Tatum | Sui RPC, wallet creation, webhooks |
| Auth | Enoki (zkLogin) | Google/Apple login → Sui wallet, no seed phrase |

---

## Key Features

1. **Creator Vault** — satu profil URL (vault.app/username) untuk semua karya
2. **Timeline Eras** — organize karya per chapter/era perjalanan kreatif
3. **Supporter Passes** — Sui objects sebagai membership, bukan subscription database entry
4. **Memory Capsules** — konten encrypted di Walrus, terbuka di waktu/kondisi tertentu
5. **Digital Scrapbook** — section raw/personal, lebih intimate dari konten "official"
6. **Exclusive Drops** — limited content hanya untuk tier supporter tertentu

---

## Sui Object Model

```
CreatorVault { owner, username, bio, cover_blob_id (Walrus), era_count }
Era { vault_id, name, description, blob_ids[] (Walrus), min_tier_required }
SupporterPass { vault_id, holder, tier, is_founding, era_at_acquisition }
MemoryCapsule { vault_id, encrypted_blob_id (Walrus), seal_policy_id, unlock_timestamp }
```

---

## Walrus Integration

- Public content: upload langsung → blob ID disimpan di Sui object
- Private content: Seal.encrypt() → upload encrypted blob → blob ID + policy di Sui
- Retrieve private: check Sui object ownership → Seal.decrypt() → content tampil
- Testnet endpoints (no auth, gratis untuk demo):
  - Publisher: `https://publisher.walrus-testnet.walrus.space`
  - Aggregator: `https://aggregator.walrus-testnet.walrus.space`

---

## Hackathon Demo Flow (2 menit)

1. Tunjukkan creator profile yang indah
2. Upload file → tunjukkan blob ID → buka di aggregator URL langsung → "ini tersimpan permanent, bukan di server kami"
3. Demo supporter pass sebagai Sui object di explorer
4. Demo content gating: user dengan pass bisa akses, user tanpa pass tidak bisa
5. Tunjukkan Memory Capsule countdown

**WOW moment:** File accessible via aggregator URL tanpa backend Vault.

---

## Why Parked

Risiko terlalu generic — "creator profile + exclusive content + storage" terlalu broad.

**Yang genuine differentiating:**
- Era system (culturally resonant, belum ada yang build ini)
- Memory Capsule (genuinely novel, no competitor)
- Supporter pass sebagai collectible artifact, bukan subscription

**Untuk validasi lebih lanjut:**
- Niche down ke satu tipe kreator dulu (rekomendasi: indie musician)
- Buat Era UX jauh lebih bagus dari siapapun
- Memory Capsule sebagai primary viral mechanic

---

## Business Model (jika dilanjutkan)

- Free: 5GB, 1 supporter tier, public profile
- Pro ($12/mo): 100GB, 3 tiers, capsules, customization
- Studio ($29/mo): unlimited, API, collaboration
- Platform fee: 5% dari supporter pass sales

---

## Product Names (Top 5)

1. Vault
2. Fold
3. Tome
4. Epoch
5. Amber
