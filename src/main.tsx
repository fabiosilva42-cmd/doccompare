import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { LanguageProvider, getStoredLocale } from "@/i18n/LanguageProvider"
import App from './App.tsx'

document.documentElement.lang = getStoredLocale() === "pt" ? "pt-BR" : "en"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
