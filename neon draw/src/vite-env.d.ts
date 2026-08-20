/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_DEMO_FALLBACK?: string;
  readonly ENABLE_DEMO_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
