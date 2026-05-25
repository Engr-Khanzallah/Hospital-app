import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#374151',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              },
              success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
            }}
          />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
