/// <reference types="vite/client" />

// Types for the environment variables this app reads at build time.
// Declaring them means a typo like VITE_SUPBASE_URL is caught by the compiler
// instead of turning into a confusing runtime error in the browser.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
