import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap',
        },
        { rel: 'icon', type: 'image/jpeg', href: '/logo.jpeg' },
        { rel: 'apple-touch-icon', href: '/logo.jpeg' },
      ],
    },
  },

  modules: [
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  colorMode: {
    classSuffix: '',
  },

  runtimeConfig: {
    tatumApiKey: '',
    supabaseUrl: '',
    supabaseServiceKey: '',
    public: {
      walrusPublisher: 'https://publisher.walrus-testnet.walrus.space',
      walrusAggregator: 'https://aggregator.walrus-testnet.walrus.space',
      suiNetwork: 'testnet',
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss(), wasm()],
    optimizeDeps: {
      exclude: ['@mysten/walrus'],
      include: ['dataloader'],
    },
  },
})
