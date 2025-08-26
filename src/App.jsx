import { useState } from 'react'
import './App.css'
import TapBox from './components/TapBox.jsx'
import LoginModal from './components/LoginModal.jsx'
import Header from './components/Header.jsx'

function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [userIdState, setUserIdState] = useState(() => window.localStorage.getItem('user_id') || '')
  const [emailState, setEmailState] = useState('')

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'white', padding: 0 }}>
      <Header userId={userIdState} email={emailState} onOpenLogin={()=> setLoginOpen(true)} onLogout={()=> { localStorage.removeItem('user_id'); localStorage.removeItem('user_token'); setUserIdState(''); setEmailState(''); }} />
      <div style={{ padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 24, boxSizing: 'border-box' }}>
        <TapBox />
      </div>
      {loginOpen && (
        <LoginModal open={loginOpen} onClose={()=> setLoginOpen(false)} onLoggedIn={(uid)=> { setUserIdState(uid); }} />
      )}
      </div>
    </div>
  )
}

export default App
