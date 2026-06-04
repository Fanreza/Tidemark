import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'

let client: SuiJsonRpcClient | null = null

function getSuiClient(): SuiJsonRpcClient {
  if (!client) {
    // Primary RPC → /api/rpc proxy → Tatum RPC gateway.
    client = new SuiJsonRpcClient({ url: useSuiRpcUrl(), network: 'testnet' })
  }
  return client
}

export function useSui() {
  const { address } = useWallet()

  async function getBalance(addr?: string): Promise<string> {
    const target = addr ?? address.value
    if (!target) return '0'
    try {
      const balance = await getSuiClient().getBalance({ owner: target })
      return balance.totalBalance
    } catch {
      return '0'
    }
  }

  /**
   * Record a signature as a real on-chain Sui transaction and return its digest.
   *
   * The transaction is a 1-MIST self-transfer: a genuine, explorable transaction
   * timestamped by the chain and tied to the signer's address. The returned digest
   * resolves on Sui explorers (e.g. suiscan.xyz/testnet/tx/<digest>).
   *
   * Note: the document hash itself is NOT stored on-chain — that would require a
   * dedicated Move package. The on-chain record proves *who* signed and *when*;
   * the document binding lives in Tidemark's records alongside this digest.
   *
   * Requires the signer to hold a small amount of network SUI for gas.
   */
  async function recordSignature(_params: {
    documentId: string
    signerAddress: string
    documentTitle: string
    walrusBlobId: string
  }): Promise<string> {
    const { signAndExecuteTransaction, address } = useWallet()
    const signer = address.value
    if (!signer) throw new Error('Wallet not connected')

    const tx = new Transaction()
    const [coin] = tx.splitCoins(tx.gas, [1])
    tx.transferObjects([coin], signer)

    const digest = await signAndExecuteTransaction(tx)
    if (!digest) throw new Error('Wallet did not approve the transaction')

    // Wait for finality so the digest is queryable on explorers immediately.
    try {
      await getSuiClient().waitForTransaction({ digest })
    } catch {
      // Non-fatal: the transaction is submitted; explorer indexing may lag.
    }

    return digest
  }

  async function getObject(objectId: string) {
    return getSuiClient().getObject({ id: objectId, options: { showContent: true } })
  }

  return { getBalance, recordSignature, getObject }
}
