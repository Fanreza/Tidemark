import { EnokiClient, EnokiFlow, registerEnokiWallets } from '@mysten/enoki'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiKey = config.public.enokiApiKey as string
  const googleClientId = config.public.googleClientId as string
  const network = (config.public.suiNetwork as string) || 'testnet'

  if (!apiKey) {
    console.warn('[Enoki] NUXT_PUBLIC_ENOKI_API_KEY not set — social login disabled')
    return
  }

  const providers: Record<string, { clientId: string }> = {}
  if (googleClientId) providers.google = { clientId: googleClientId }

  if (Object.keys(providers).length === 0) {
    console.warn('[Enoki] No OAuth providers configured — set NUXT_PUBLIC_GOOGLE_CLIENT_ID')
    return
  }

  registerEnokiWallets({
    client: new EnokiClient({ apiKey }),
    network: network as 'testnet' | 'mainnet' | 'devnet',
    providers,
  })

  const flow = new EnokiFlow({ apiKey })

  return {
    provide: { enokiFlow: flow },
  }
})
