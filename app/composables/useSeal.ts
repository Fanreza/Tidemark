import { SealClient, SessionKey } from '@mysten/seal'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex, toHex } from '@mysten/bcs'

const SEAL_PACKAGE_ID = '0xc5ce2742cac46421b62028557f1d7aea8a4c50f651379a79afdf12cd88628807'
const KEY_SERVER_OBJ_ID = '0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98'
const SEAL_AGGREGATOR = 'https://seal-aggregator-testnet.mystenlabs.com'

let _suiClient: SuiJsonRpcClient | null = null
let _sealClient: SealClient | null = null

function getSuiClient(): SuiJsonRpcClient {
  if (!_suiClient) {
    // Primary RPC → /api/rpc proxy → Tatum RPC gateway.
    _suiClient = new SuiJsonRpcClient({ url: useSuiRpcUrl(), network: 'testnet' })
  }
  return _suiClient
}

function getSealClient(): SealClient {
  if (!_sealClient) {
    _sealClient = new SealClient({
      suiClient: getSuiClient() as any,
      serverConfigs: [{
        objectId: KEY_SERVER_OBJ_ID,
        weight: 1,
        aggregatorUrl: SEAL_AGGREGATOR,
      }],
      verifyKeyServers: false,
    })
  }
  return _sealClient
}

export function useSeal() {
  const { address, signBytes, signAndExecuteTransaction } = useWallet()

  async function createAllowlist(): Promise<string> {
    if (!address.value) throw new Error('Wallet not connected')
    console.log('[Seal] createAllowlist: building tx for address', address.value)

    const tx = new Transaction()
    tx.moveCall({
      target: `${SEAL_PACKAGE_ID}::allowlist::create_allowlist_entry`,
      arguments: [tx.pure.string('tidemark')],
    })

    console.log('[Seal] createAllowlist: signing and executing tx...')
    const digest = await signAndExecuteTransaction(tx)
    console.log('[Seal] createAllowlist: tx digest', digest)

    const result: any = await getSuiClient().waitForTransaction({
      digest,
      options: { showObjectChanges: true },
    })
    console.log('[Seal] createAllowlist: waitForTransaction result', JSON.stringify(result))

    const changes: any[] = result.objectChanges ?? []
    const created = changes.find(
      (c) => c.type === 'created' && typeof c.objectType === 'string' && c.objectType.includes('::allowlist::Allowlist'),
    )

    if (!created) throw new Error('Allowlist object not found in transaction result')
    console.log('[Seal] createAllowlist: allowlist object ID', created.objectId)
    return created.objectId
  }

  async function encryptFile(file: File | Blob, allowlistId: string): Promise<{ encryptedBytes: Uint8Array; encryptionId: string }> {
    console.log('[Seal] encryptFile: allowlistId', allowlistId)
    const data = new Uint8Array(await file.arrayBuffer())
    const nonce = crypto.getRandomValues(new Uint8Array(5))
    const policyBytes = fromHex(allowlistId.replace('0x', ''))
    const id = toHex(new Uint8Array([...policyBytes, ...nonce]))
    console.log('[Seal] encryptFile: encryption id', id)

    const { encryptedObject: encryptedBytes } = await getSealClient().encrypt({
      threshold: 1,
      packageId: SEAL_PACKAGE_ID,
      id,
      data,
    })
    console.log('[Seal] encryptFile: encrypted', encryptedBytes.length, 'bytes')
    return { encryptedBytes, encryptionId: id }
  }

  async function buildSessionKey(): Promise<SessionKey> {
    if (!address.value) throw new Error('Wallet not connected')

    const sessionKey = await SessionKey.create({
      address: address.value,
      packageId: SEAL_PACKAGE_ID,
      ttlMin: 10,
      suiClient: getSuiClient() as any,
    })

    const msgBytes = sessionKey.getPersonalMessage()
    const signature = await signBytes(msgBytes)
    if (!signature) throw new Error('User rejected signing')

    await sessionKey.setPersonalMessageSignature(signature)
    return sessionKey
  }

  async function decryptFile(encryptedBytes: Uint8Array, encryptionId: string, allowlistId: string): Promise<Uint8Array> {
    const sessionKey = await buildSessionKey()

    const tx = new Transaction()
    tx.moveCall({
      target: `${SEAL_PACKAGE_ID}::allowlist::seal_approve`,
      arguments: [
        tx.pure.vector('u8', fromHex(encryptionId)),
        tx.object(allowlistId),
      ],
    })

    const txBytes = await tx.build({ client: getSuiClient() as any, onlyTransactionKind: true })

    const sealClient = getSealClient()
    await sealClient.fetchKeys({
      ids: [encryptionId],
      txBytes,
      sessionKey,
      threshold: 1,
    })

    return sealClient.decrypt({
      data: encryptedBytes,
      sessionKey,
      txBytes,
    })
  }

  return { createAllowlist, encryptFile, decryptFile }
}
