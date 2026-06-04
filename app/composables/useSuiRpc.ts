// Single source of truth for the Sui RPC URL used across the app.
// In the browser, every SuiClient talks to our same-origin proxy (/api/rpc),
// which forwards to Tatum's RPC gateway server-side (keeping the API key secret).
export function useSuiRpcUrl(): string {
  if (import.meta.client) return `${window.location.origin}/api/rpc`
  // SSR fallback (clients are created client-side in practice).
  const net = (useRuntimeConfig().public.suiNetwork as string) || 'testnet'
  return `https://fullnode.${net}.sui.io:443`
}
