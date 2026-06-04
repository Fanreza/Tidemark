export function useWalrus() {
  const config = useRuntimeConfig()
  const AGGREGATOR = config.public.walrusAggregator as string
  const { address, signAndExecuteTransaction } = useWallet()

  const uploading = ref(false)
  const uploadProgress = ref(0)

  async function makeClients() {
    const { WalrusClient } = await import('@mysten/walrus')
    const { SuiJsonRpcClient } = await import('@mysten/sui/jsonRpc')
    // Primary RPC → /api/rpc proxy → Tatum RPC gateway.
    const suiClient = new SuiJsonRpcClient({ url: useSuiRpcUrl(), network: 'testnet' } as any)
    const walrusClient = new WalrusClient({ network: 'testnet', suiClient: suiClient as any })
    return { suiClient, walrusClient }
  }

  async function uploadBlob(
    file: File | Blob,
    onStep?: (step: string, detail: string) => void,
  ): Promise<{ blobId: string; objectId: string | null }> {
    if (!address.value) throw new Error('Wallet not connected')

    uploading.value = true
    uploadProgress.value = 0

    try {
      const { suiClient, walrusClient } = await makeClients()
      const bytes = new Uint8Array(await file.arrayBuffer())
      const flow = walrusClient.writeBlobFlow({ blob: bytes })

      onStep?.('Encoding document...', 'Preparing for decentralized storage')
      uploadProgress.value = 10
      const { blobId } = await flow.encode()
      uploadProgress.value = 20

      onStep?.('Registering on blockchain...', 'Approve in your wallet (1 of 2)')
      const registerTx = flow.register({ deletable: true, epochs: 50, owner: address.value })
      registerTx.setSenderIfNotSet(address.value)
      const registerBytes = await registerTx.build({ client: suiClient as any })
      const registerDigest = await signAndExecuteTransaction(registerBytes as any)
      uploadProgress.value = 40

      onStep?.('Uploading to storage nodes...', 'Distributing across decentralized network')
      const uploadResult = await flow.upload({ digest: registerDigest })
      const objectId = (uploadResult as any).blobObjectId ?? null
      uploadProgress.value = 80

      onStep?.('Certifying on blockchain...', 'Approve in your wallet (2 of 2)')
      const certifyTx = flow.certify()
      certifyTx.setSenderIfNotSet(address.value)
      const certifyBytes = await certifyTx.build({ client: suiClient as any })
      await signAndExecuteTransaction(certifyBytes as any)
      uploadProgress.value = 100

      return { blobId, objectId }
    } finally {
      uploading.value = false
    }
  }

  async function deleteBlob(objectId: string): Promise<string> {
    if (!address.value) throw new Error('Wallet not connected')
    const { suiClient, walrusClient } = await makeClients()
    const tx = walrusClient.deleteBlobTransaction({ blobObjectId: objectId, owner: address.value })
    tx.setSenderIfNotSet(address.value)
    const bytes = await tx.build({ client: suiClient as any })
    return signAndExecuteTransaction(bytes as any)
  }

  function getBlobUrl(blobId: string): string {
    return `${AGGREGATOR}/v1/blobs/${blobId}`
  }

  async function fetchBlob(blobId: string): Promise<ArrayBuffer> {
    const res = await fetch(getBlobUrl(blobId))
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`)
    return res.arrayBuffer()
  }

  return { uploading, uploadProgress, uploadBlob, deleteBlob, getBlobUrl, fetchBlob }
}
