import React from 'react';

export default function Header({ userId, email, onOpenLogin, onLogout }) {
  return (
    <header style={{ background: '#0f172a', borderBottom: '1px solid #374151' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '12px 24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{ fontWeight: 700 }}>Provider Demo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {userId ? (
            <>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                <div>User: <span style={{ color: '#fff' }}>{userId}</span></div>
                {email && <div>Email: <span style={{ color: '#fff' }}>{email}</span></div>}
              </div>
              <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 600 }}>Log Out</button>
            </>
          ) : (
            <button onClick={onOpenLogin} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 600 }}>Log In</button>
          )}
        </div>
      </div>
    </header>
  );
}


