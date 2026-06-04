import { getSuiTransaction } from '../../utils/tatum'

// Confirm a signature transaction on-chain via Tatum's Sui RPC gateway.
export default defineEventHandler(async (event) => {
  const digest = getRouterParam(event, 'digest')!

  try {
    const tx: any = await getSuiTransaction(digest)
    if (!tx?.digest) return { found: false, digest, provider: 'tatum' }

    return {
      found: true,
      provider: 'tatum',
      digest: tx.digest,
      sender: tx.transaction?.data?.sender ?? null,
      timestampMs: tx.timestampMs ? Number(tx.timestampMs) : null,
      status: tx.effects?.status?.status ?? null,
    }
  } catch (e: any) {
    return { found: false, digest, provider: 'tatum', error: e.message }
  }
})
