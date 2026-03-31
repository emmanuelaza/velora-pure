import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { BusinessProvider } from './context/BusinessContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A1A',
                color: '#F5F5F5',
                border: '1px solid #2A2A2A',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '12px 20px',
              },
              success: {
                iconTheme: { primary: '#00C896', secondary: '#111111' },
              },
              error: {
                iconTheme: { primary: '#FF4444', secondary: '#111111' },
              },
            }}
          />
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
