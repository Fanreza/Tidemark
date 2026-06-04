# Tidemark

**Documents that outlast the platform.**

Tidemark is a document signing and sharing app secured by blockchain. Upload a
contract, collect signatures, and store it on decentralized storage — no server
holds the master copy, and no company can delete it.

- **Permanent storage** — files are spread across the [Walrus](https://walrus.xyz)
  decentralized network. The blob ID lets anyone retrieve the original
  independently of Tidemark.
- **On-chain signatures** — each signature is a real [Sui](https://sui.io)
  transaction, timestamped by the chain and tied to the signer's address. The
  transaction digest is publicly verifiable on any Sui explorer.
- **End-to-end encryption** — mark a document "Private" and it is encrypted with
  [Seal](https://github.com/MystenLabs/seal) before it leaves your browser; only
  your wallet can decrypt it.
- **Wallet login** — connect a Sui wallet extension (Sui Wallet, Slush, Suiet, …).

## Tech stack

| Layer            | Tool                                                |
| ---------------- | --------------------------------------------------- |
| Framework        | Nuxt 4 (Vue 3), TypeScript                          |
| UI               | Tailwind CSS v4, shadcn-vue / reka-ui               |
| Blockchain       | Sui (`@mysten/sui`, `@mysten/wallet-standard`)      |
| Storage          | Walrus (`@mysten/walrus`)                           |
| Encryption       | Seal (`@mysten/seal`)                               |
| Database         | Supabase (Postgres) — in-memory fallback if unset   |
| PDF              | pdf-lib (sign), vue-pdf-embed (preview)             |

> The app targets the **Sui testnet** with the public Walrus testnet endpoints.

## Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

### Environment variables

All config is read through Nuxt `runtimeConfig` (see [nuxt.config.ts](nuxt.config.ts)).
`NUXT_PUBLIC_*` values are exposed to the browser; the rest are server-only.

| Variable                        | Required | Description                                                                 |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `NUXT_SUPABASE_URL`             | No\*     | Supabase project URL. If unset, an in-memory store is used (data is lost on restart). |
| `NUXT_SUPABASE_SERVICE_KEY`     | No\*     | Supabase service-role key (server-only — bypasses RLS).                     |
| `NUXT_PUBLIC_SUI_NETWORK`       | No       | `testnet` (default) \| `mainnet` \| `devnet`.                               |
| `NUXT_PUBLIC_WALRUS_PUBLISHER`  | No       | Walrus publisher endpoint. Defaults to the public testnet publisher.        |
| `NUXT_PUBLIC_WALRUS_AGGREGATOR` | No       | Walrus aggregator endpoint. Defaults to the public testnet aggregator.      |
| `NUXT_TATUM_API_KEY`            | No       | Reserved for future Sui RPC use — not required for current features.        |

\* Both Supabase variables must be set together; otherwise the app runs on the
in-memory fallback (great for local demos, not for production).

### Database schema

If you use Supabase, run [supabase-schema.sql](supabase-schema.sql) in the
Supabase SQL editor to create the tables.

## Development

Start the dev server on `http://localhost:3000`:

```bash
npm run dev
```

Signers need a small amount of testnet SUI for gas to record an on-chain
signature. Get some from the [Sui testnet faucet](https://faucet.sui.io).

## Production

```bash
npm run build      # build
npm run preview    # preview the production build locally
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment)
for hosting options.

## How it works

1. **Upload** — the file is uploaded to Walrus (two wallet approvals: register +
   certify). A document record is created in the database with the blob ID.
2. **Sign** — the owner and any requested signers each submit a Sui transaction
   to record their signature on-chain; the drawn signature is embedded into the
   PDF, which is re-uploaded to Walrus.
3. **Share** — generate a link with optional password, expiry, download toggle,
   and per-open view tracking. Revoke any time.
4. **Verify** — anyone can look up a document by ID (no login) to see its
   storage proof and signing records, with links to the Sui explorer.

## Project structure

```
app/
  components/        # UI components (shadcn-vue) + app-specific (SignaturePad, WalletModal, …)
  composables/       # useWallet, useWalrus, useSeal, useSui, usePdfSigner, useDocuments
  pages/             # index, login, register, dashboard, upload, verify,
                     #   document/[id], sign/[requestId], view/[token]
  middleware/auth.ts # wallet-gated routes
  plugins/           # wallet session restore (client-only)
server/
  api/               # documents, share links, signing requests, users, Walrus blob proxy
  utils/db.ts        # Supabase access layer with in-memory fallback
```

## Security notes

- Tidemark has **no server-side session layer** — API ownership checks trust the
  wallet address the client sends. This is a soft guard against casual/accidental
  cross-user actions, **not** a cryptographic guarantee. A production deployment
  should require a signed challenge proving control of the wallet before trusting
  these checks. See `assertDocumentOwner` in [server/utils/db.ts](server/utils/db.ts).
- The on-chain signature records *who* signed and *when*. The document hash itself
  is not stored on-chain (that would require a dedicated Move package); the binding
  between a signature and a document lives in Tidemark's records alongside the
  transaction digest.
