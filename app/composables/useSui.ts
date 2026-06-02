import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'

let client: SuiJsonRpcClient | null = null

function getSuiClient(): SuiJsonRpcClient {
  if (!client) {
    client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' })
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

  async function recordSignature(params: {
    documentId: string
    signerAddress: string
    documentTitle: string
    walrusBlobId: string
  }): Promise<string> {
    const { signMessage } = useWallet()
    const message = [
      'Tidemark Document Signature',
      `Document: ${params.documentTitle}`,
      `ID: ${params.documentId}`,
      `Blob: ${params.walrusBlobId}`,
      `Signer: ${params.signerAddress}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n')

    const sig = await signMessage(message)
    if (!sig) throw new Error('Wallet did not approve the signature')
    return sig
  }

  async function getObject(objectId: string) {
    return getSuiClient().getObject({ id: objectId, options: { showContent: true } })
  }

  return { getBalance, recordSignature, getObject }
}
