import { getWallets, SUI_MAINNET_CHAIN, SUI_TESTNET_CHAIN, SUI_DEVNET_CHAIN } from '@mysten/wallet-standard'
import type { Wallet, WalletAccount } from '@mysten/wallet-standard'
import { isEnokiWallet } from '@mysten/enoki'
import type { Transaction } from '@mysten/sui/transactions'

const SUI_CHAINS = [SUI_MAINNET_CHAIN, SUI_TESTNET_CHAIN, SUI_DEVNET_CHAIN]
const SESSION_KEY = 'tidemark_wallet'

export interface WalletState {
  address: string | null
  walletName: string | null
  walletIcon: string | null
  isConnected: boolean
  isLoading: boolean
}

export const showWalletModal = ref(false)

const walletState = reactive<WalletState>({
  address: null,
  walletName: null,
  walletIcon: null,
  isConnected: false,
  isLoading: false,
})

let _connectedWallet: Wallet | null = null
let _connectedAccount: WalletAccount | null = null

function saveSession(address: string, walletName: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ address, walletName }))
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

function loadSession(): { address: string; walletName: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useWallet() {
  function getAvailableWallets(): Wallet[] {
    if (import.meta.server) return []
    const all = getWallets().get() as Wallet[]
    const seen = new Set<string>()
    return all.filter((w) => {
      if (seen.has(w.name)) return false
      seen.add(w.name)
      const isSui = w.chains.some(c => SUI_CHAINS.includes(c as any))
      const isEnoki = isEnokiWallet(w)
      return isSui || isEnoki
    })
  }

  async function connect(wallet: Wallet, silent = false): Promise<void> {
    walletState.isLoading = true
    try {
      const raw = markRaw(wallet)
      const connectFeature = (raw.features as any)['standard:connect']
      const result = await connectFeature.connect(silent ? { silent: true } : undefined)
      const account: WalletAccount | undefined = result.accounts[0]
      if (!account) throw new Error('No accounts returned')
      _connectedWallet = raw
      _connectedAccount = account
      walletState.address = account.address
      walletState.walletName = wallet.name
      walletState.walletIcon = wallet.icon ?? null
      walletState.isConnected = true
      saveSession(account.address, wallet.name)
    } finally {
      walletState.isLoading = false
    }
  }

  async function tryReconnect(): Promise<boolean> {
    if (import.meta.server) return false
    const session = loadSession()
    if (!session) return false

    // Optimistically restore address so middleware doesn't redirect while we reconnect
    walletState.address = session.address
    walletState.walletName = session.walletName
    walletState.isConnected = true

    // Wait briefly for wallet extensions to register themselves
    await new Promise(r => setTimeout(r, 300))

    const wallets = getAvailableWallets()
    const wallet = wallets.find(w => w.name === session.walletName)
    if (!wallet) {
      // Wallet extension not installed anymore — clear session
      clearSession()
      walletState.address = null
      walletState.walletName = null
      walletState.isConnected = false
      return false
    }

    try {
      await connect(markRaw(wallet), true)
      return true
    } catch {
      // Silent connect rejected — clear saved session
      clearSession()
      walletState.address = null
      walletState.walletName = null
      walletState.walletIcon = null
      walletState.isConnected = false
      return false
    }
  }

  async function disconnect(): Promise<void> {
    try {
      const feature = (_connectedWallet?.features as any)?.['standard:disconnect']
      if (feature) await feature.disconnect()
    } catch {}
    _connectedWallet = null
    _connectedAccount = null
    walletState.address = null
    walletState.walletName = null
    walletState.walletIcon = null
    walletState.isConnected = false
    clearSession()
  }

  async function signMessage(message: string): Promise<string | null> {
    if (!_connectedWallet || !_connectedAccount) return null
    const features = _connectedWallet.features as any
    const feature = features['sui:signPersonalMessage'] ?? features['sui:signMessage']
    if (!feature) return null
    const result = await feature.signPersonalMessage({
      message: new TextEncoder().encode(message),
      account: _connectedAccount,
    })
    return result.signature
  }

  async function signBytes(bytes: Uint8Array): Promise<string | null> {
    if (!_connectedWallet || !_connectedAccount) return null
    const features = _connectedWallet.features as any
    const feature = features['sui:signPersonalMessage'] ?? features['sui:signMessage']
    if (!feature) return null
    const result = await feature.signPersonalMessage({
      message: bytes,
      account: _connectedAccount,
    })
    return result.signature
  }

  async function signAndExecuteTransaction(tx: Transaction | Uint8Array): Promise<string> {
    if (!_connectedWallet || !_connectedAccount) throw new Error('Wallet not connected')
    const features = _connectedWallet.features as any
    const feature = features['sui:signAndExecuteTransaction'] ?? features['sui:signAndExecuteTransactionBlock']
    if (!feature) throw new Error('Wallet does not support signing transactions')
    const transaction = tx instanceof Uint8Array
      ? { toJSON: () => Promise.resolve(btoa(String.fromCharCode(...tx))) }
      : tx
    const result = await feature.signAndExecuteTransaction({
      transaction,
      chain: 'sui:testnet',
      account: _connectedAccount,
    })
    return result.digest
  }

  return {
    ...toRefs(walletState),
    getAvailableWallets,
    connect,
    tryReconnect,
    disconnect,
    signMessage,
    signBytes,
    signAndExecuteTransaction,
  }
}
