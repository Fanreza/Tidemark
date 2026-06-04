import { createError } from 'h3'

// ─── Tatum — Sui RPC Gateway (server-side) ──────────────────────────────────
//
// Tatum's typed SDK (@tatumio/tatum) does not expose Sui, but Tatum's RPC
// Gateway does, via:
//   https://sui-{mainnet|testnet|devnet}.gateway.tatum.io   (JSON-RPC)
// Docs: https://docs.tatum.io/reference/rpc-sui
//
// The API key is a secret, so all Tatum calls run on the server only.
// NOTE: Tatum JSON-RPC for Sui is slated for EOL after July 2026 in favour of
// gRPC (sui-{net}-grpc.gateway.tatum.io). For now JSON-RPC is the simplest path.

export function tatumSuiGatewayUrl(): string {
  const config = useRuntimeConfig()
  const net = (config.public.suiNetwork as string) || 'testnet'
  return `https://sui-${net}.gateway.tatum.io`
}

export async function tatumSuiRpc<T = any>(method: string, params: any[] = []): Promise<T> {
  const config = useRuntimeConfig()
  const apiKey = config.tatumApiKey as string
  if (!apiKey) {
    throw createError({ statusCode: 503, message: 'Tatum API key not configured (NUXT_TATUM_API_KEY)' })
  }

  const res = await $fetch<{ result?: T; error?: { message: string } }>(tatumSuiGatewayUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: { jsonrpc: '2.0', id: 1, method, params },
  })

  if (res.error) throw createError({ statusCode: 502, message: `Tatum RPC error: ${res.error.message}` })
  return res.result as T
}

/** Fetch a Sui transaction block by digest via Tatum. */
export async function getSuiTransaction(digest: string) {
  return tatumSuiRpc('sui_getTransactionBlock', [
    digest,
    { showInput: true, showEffects: true },
  ])
}
