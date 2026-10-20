/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: string
  readonly VITE_ENABLE_DEV_TOOLS?: string
  readonly VITE_JOIN_BASE_URL?: string
  readonly VITE_APP_STORE_URL?: string
  readonly VITE_PLAY_STORE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
