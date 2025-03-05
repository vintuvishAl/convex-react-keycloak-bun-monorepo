import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_KEYCLOAK_URL: string
    readonly VITE_KEYCLOAK_REALM: string
    readonly VITE_KEYCLOAK_CLIENT_ID: string
    readonly VITE_CONVEX_URL: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {};

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)