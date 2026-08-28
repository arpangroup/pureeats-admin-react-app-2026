/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE: 'mock' | 'live'
  readonly VITE_API_BASE_URL: string
  readonly VITE_MOCK_DELAY_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
