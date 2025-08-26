import React, { useCallback, useEffect, useState } from 'react';

const API_BASE = window.__JIRASAN_API_BASE__ || 'http://localhost:8001';
const TOKEN_ADDRESS = '0x67B4511a0E3eFFaFa2593cC96A5089D26e25DFD6';

export default function TapBox() {
  const [phase, setPhase] = useState('ready'); // ready | playing | crashed | claimed
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providerToken, setProviderToken] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [pop, setPop] = useState(false);
  const [shake, setShake] = useState(false);
  const [ripples, setRipples] = useState([]);

  // --- Provider auth helpers ---
  const loginProvider = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const resp = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider_id: 'snake_game_provider', api_key: 'snake_game_secret_key_2024' }) });
      if (!resp.ok) throw new Error((await resp.json()).detail || 'Auth failed');
      const data = await resp.json();
      setProviderToken(data.access_token);
      localStorage.setItem('snake_game_provider_token', data.access_token);
      return data.access_token;
    } catch (e) { setError(e.message); return null; } finally { setLoading(false); }
  }, []);

  const getProviderToken = () => providerToken || localStorage.getItem('snake_game_provider_token');
  const isProviderAuthenticated = () => !!getProviderToken();

  const checkProviderApproval = useCallback(async () => {
    try {
      if (!isProviderAuthenticated()) { const tok = await loginProvider(); if (!tok) return { success: false }; }
      let token = getProviderToken();
      let resp = await fetch(`${API_BASE}/provider/Snake_Game`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
      if (resp.status === 401) {
        // token likely invalid after server restart or secret change; re-login once
        const tok = await loginProvider();
        if (!tok) return { success: false };
        token = tok;
        resp = await fetch(`${API_BASE}/provider/Snake_Game`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
      }
      if (!resp.ok) { const e = await resp.json(); setError(e.detail || 'Provider check failed'); return { success: false }; }
      const data = await resp.json();
      if (data.approved) { setEventId(data.event_id); return { success: true, event_id: data.event_id }; }
      setError('Provider not approved'); return { success: false };
    } catch (e) { setError(e.message); return { success: false }; }
  }, [loginProvider]);

  const registerEvent = useCallback(async (eventType, amount) => {
    try {
      if (!isProviderAuthenticated()) { const tok = await loginProvider(); if (!tok) return false; }
      const token = getProviderToken();
      const userId = localStorage.getItem('user_id');
      const payload = { user_id: userId, event_name: 'Snake_Game', event_type: eventType, amount, token_address: TOKEN_ADDRESS };
      const resp = await fetch(`${API_BASE}/register-event`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to register event');
      return true;
    } catch (e) { setError(e.message); return false; }
  }, [loginProvider]);

  useEffect(() => {
    const tok = localStorage.getItem('snake_game_provider_token');
    if (tok) setProviderToken(tok);
  }, []);

  const start = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) { setError('Please log in first'); return; }
      const ok = await checkProviderApproval(); if (!ok.success) return;
      setLoading(true); setError('');
      const sdk = window.Jirasan;
      if (!sdk || !sdk.requestExpense) { setError('SDK not loaded'); setLoading(false); return; }
      const res = await sdk.requestExpense({ amount: 5, tokenAddress: TOKEN_ADDRESS, description: 'Tap Box Fee', eventName: 'Snake_Game' });
      if (!res || res.status !== 'approved') { setError('Expense not approved'); setLoading(false); return; }
      // Backend registers EVENT_LOSS on approve; now start game
      setScore(0); setPhase('playing'); setLoading(false);
    } catch (e) { setError(e.message); setLoading(false); }
  };

  const tap = () => {
    if (phase !== 'playing') return;
    const next = score + 1;
    setScore(next);
    // Trigger pop animation
    setPop(true);
    setTimeout(() => setPop(false), 140);
    // Add ripple
    const key = Date.now();
    setRipples((r) => [...r, key]);
    setTimeout(() => setRipples((r) => r.filter((k) => k !== key)), 650);
    // 10% crash chance per tap
    if (Math.random() < 0.1) {
      setPhase('crashed');
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  const claim = async () => {
    if (phase !== 'playing') return;
    setLoading(true); setError('');
    const ok = await registerEvent('EVENT_GAIN', score);
    setLoading(false);
    if (ok) setPhase('claimed');
  };

  const reset = () => { setPhase('ready'); setScore(0); setError(''); };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tap Box</h2>
      {error && <div className="mb-3 text-red-300 text-sm">{error}</div>}
      {phase === 'ready' && (
        <button onClick={start} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">{loading ? 'Starting...' : 'Start (5 RDAC)'}</button>
      )}
      {phase === 'playing' && (
        <div>
          <div className="mb-3">Score: <span className="font-bold">{score}</span></div>
          <div onClick={tap} className={`select-none cursor-pointer text-white font-bold text-2xl flex items-center justify-center tapbox ${pop ? 'pop' : ''} ${shake ? 'shake' : ''}`}>
            Tap!
            {ripples.map((k) => (<span key={k} className="ripple" />))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={claim} disabled={loading} className="bg-yellow-500 text-black px-3 py-2 rounded disabled:opacity-50">{loading ? 'Claiming...' : 'Claim'}</button>
            <button onClick={reset} className="bg-gray-600 text-white px-3 py-2 rounded">Reset</button>
          </div>
        </div>
      )}
      {phase === 'crashed' && (
        <div>
          <div className="mb-2 text-red-300">Crash! No prize this time.</div>
          <div className="tapbox shake" style={{ marginBottom: 12 }}>
            <span className="crash-flash" />
          </div>
          <button onClick={reset} className="bg-gray-600 text-white px-3 py-2 rounded">Try Again</button>
        </div>
      )}
      {phase === 'claimed' && (
        <div>
          <div className="mb-2 text-green-300">Claimed {score} RDAC!</div>
          <div className="tapbox" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            +{score} RDAC
          </div>
          <button onClick={reset} className="bg-gray-600 text-white px-3 py-2 rounded">Play Again</button>
        </div>
      )}
    </div>
  );
}


