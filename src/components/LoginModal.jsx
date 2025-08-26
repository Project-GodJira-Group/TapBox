import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const API_BASE = window.__JIRASAN_API_BASE__ || 'http://localhost:8001';

export default function LoginModal({ open, onClose, onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // email | code
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tmpUserId, setTmpUserId] = useState(null);

  if (!open) return null;

  const requestCode = async () => {
    try {
      setLoading(true); setMessage('');
      // Email-first: request a code without creating user; backend will accept placeholder user_id
      const respReq = await fetch(`${API_BASE}/profile/request-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: 'EMAIL_ONLY', email }) });
      const dataReq = await respReq.json();
      if (!respReq.ok || !dataReq.success) { setMessage(dataReq.message || 'Failed to send code'); return; }
      setStep('code');
      setMessage('Verification code sent to your email.');
    } catch (e) { setMessage(e.message); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    try {
      setLoading(true); setMessage('');
      const resp = await fetch(`${API_BASE}/profile/verify-email-only`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await resp.json();
      if (!resp.ok || !data.success) { setMessage(data.message || 'Invalid code'); return; }
      const userId = data.user_id || tmpUserId;
      window.localStorage.setItem('user_id', userId);
      if (data.user_token) window.localStorage.setItem('user_token', data.user_token);
      setMessage('Logged in');
      onLoggedIn && onLoggedIn(userId);
      onClose && onClose();
      // keep modal state clean next open
      setEmail(''); setCode(''); setStep('email'); setTmpUserId(null);
    } catch (e) { setMessage(e.message); }
    finally { setLoading(false); }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 16px', color: 'white', position: 'relative', padding: 24,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(68,0,0,0.65) 60%), #0b0b0b',
        border: '1.8px solid #262626',
        clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
      }}>
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 10, right: 12, color: '#d1d5db', fontSize: 20 }}>×</button>
        <h3 className="text-center" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Log In (Email)</h3>

        {step === 'email' && (
          <div>
            <label className="block text-sm mb-2" style={{ color: '#d1d5db' }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full" style={{ width: '100%', background: 'transparent', color: 'white', border: '2px solid #6b7280', borderRadius: 0, padding: '8px 10px', textAlign: 'center', height: 36 }} />
            <div style={{ height: 12 }} />
            <button disabled={loading || !email} onClick={requestCode} className="w-full" style={{ background: '#ffffff', color: '#000', border: '2px solid #fff', borderRadius: 0, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', height: 36, opacity: (loading || !email) ? 0.5 : 1 }}>Send Code</button>
          </div>
        )}

        {step === 'code' && (
          <div>
            <div className="text-sm mb-3" style={{ color: '#d1d5db' }}>We sent a 4-digit code to {email}</div>
            <label className="block text-sm mb-2" style={{ color: '#d1d5db' }}>Code</label>
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="1234" className="w-full" style={{ width: '100%', background: 'transparent', color: 'white', border: '2px solid #6b7280', borderRadius: 0, padding: '8px 10px', textAlign: 'center', height: 36 }} />
            <div style={{ height: 12 }} />
            <button disabled={loading || !code} onClick={verifyCode} className="w-full" style={{ background: '#ffffff', color: '#000', border: '2px solid #fff', borderRadius: 0, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', height: 36, opacity: (loading || !code) ? 0.5 : 1 }}>Verify</button>
          </div>
        )}

        {message && <div className="text-sm" style={{ color: '#d1d5db', marginTop: 12 }}>{message}</div>}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}


