import React, { useState, useCallback, useEffect, useRef } from 'react';

const API_BASE = window.__JIRASAN_API_BASE__ || 'http://localhost:8001';

export default function SnakeGame({ userId: userIdProp }) {
  const [gameState, setGameState] = useState('payment'); // payment, playing, gameOver
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameLoop, setGameLoop] = useState(null);
  // Charging options removed for provider demo; default to RDAC via expense intent
  const [paymentMethod] = useState('rdac');
  const [giftCardCode] = useState('');
  const [giftCardBalance] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventId, setEventId] = useState(null);
  const [providerApproved, setProviderApproved] = useState(false);
  const [isGameEnding, setIsGameEnding] = useState(false);

  const [walletOption, setWalletOption] = useState('input'); // 'input' or 'create'
  const [createdWallet, setCreatedWallet] = useState(null);
  const [walletCreationLoading, setWalletCreationLoading] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);

  const [providerToken, setProviderToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const BOARD_SIZE = 20;
  const GAME_FEE = 5;
  const EARNINGS_PER_FOOD = 1;
  const TOKEN_SYMBOL = 'RDAC';

  const directionRef = useRef('RIGHT');
  const moveSnakeRef = useRef();
  const foodRef = useRef([15, 15]);
  const scoreRef = useRef(0);
  const snakeRef = useRef(snake);
  useEffect(() => { snakeRef.current = snake; }, [snake]);

  // Provider auth
  const loginProvider = async () => {
    try {
      setAuthLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: 'snake_game_provider', api_key: 'snake_game_secret_key_2024' })
      });
      if (!response.ok) {
        const e = await response.json();
        throw new Error(e.detail || 'Auth failed');
      }
      const data = await response.json();
      setProviderToken(data.access_token);
      localStorage.setItem('snake_game_provider_token', data.access_token);
      return data.access_token;
    } catch (e) {
      setError(`Authentication failed: ${e.message}`);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };
  const getProviderToken = () => providerToken || localStorage.getItem('snake_game_provider_token');
  const isProviderAuthenticated = () => !!getProviderToken();

  useEffect(() => {
    const token = localStorage.getItem('snake_game_provider_token');
    if (token) setProviderToken(token); else loginProvider();
    const uid = userIdProp || localStorage.getItem('user_id');
    if (uid) setUserId(uid);
  }, [userIdProp]);

  // Helpers
  const createNewWallet = async () => {
    try {
      setWalletCreationLoading(true); setError('');
      const resp = await fetch(`${API_BASE}/create-wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to create wallet');
      setCreatedWallet({ address: data.wallet_address.toLowerCase(), privateKey: data.private_key });
      setWalletAddress(data.wallet_address.toLowerCase());
      setShowWalletPopup(true);
      return data.wallet_address.toLowerCase();
    } catch (e) { setError(`Failed to create wallet: ${e.message}`); return null; }
    finally { setWalletCreationLoading(false); }
  };

  const getUserIdForWallet = async (walletAddr) => {
    try {
      const resp = await fetch(`${API_BASE}/get-user-id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: walletAddr }) });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to get user ID');
      setUserId(data.user_id); return data.user_id;
    } catch (e) { setError(`Failed to get user ID: ${e.message}`); return null; }
  };

  const generateFood = useCallback(() => {
    let newFood; let attempts = 0; const maxAttempts = 100;
    do { newFood = [Math.floor(Math.random()*BOARD_SIZE), Math.floor(Math.random()*BOARD_SIZE)]; attempts++; }
    while (snakeRef.current.some(s=>s[0]===newFood[0]&&s[1]===newFood[1]) && attempts<maxAttempts);
    setFood(newFood); foodRef.current = newFood;
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(prev => {
      const newSnake = [...prev]; const head = [...newSnake[0]];
      switch (directionRef.current) {
        case 'UP': head[1] = (head[1]-1+BOARD_SIZE)%BOARD_SIZE; break;
        case 'DOWN': head[1] = (head[1]+1)%BOARD_SIZE; break;
        case 'LEFT': head[0] = (head[0]-1+BOARD_SIZE)%BOARD_SIZE; break;
        case 'RIGHT': head[0] = (head[0]+1)%BOARD_SIZE; break;
        default: break;
      }
      newSnake.unshift(head);
      if (head[0]===foodRef.current[0] && head[1]===foodRef.current[1]) {
        setScore(prevScore => { const ns = prevScore+1; scoreRef.current = ns; return ns; });
        generateFood();
      } else { newSnake.pop(); }
      return newSnake;
    });
  }, [generateFood]);

  useEffect(()=>{ moveSnakeRef.current = moveSnake; }, [moveSnake]);

  const checkCollision = useCallback(()=>{
    const head = snake[0];
    return snake.slice(1).some(seg=> seg[0]===head[0] && seg[1]===head[1]);
  }, [snake]);

  const handleKeyPress = useCallback((e)=>{
    switch (e.key) {
      case 'ArrowUp': if (directionRef.current!=='DOWN'){ setDirection('UP'); directionRef.current='UP'; } break;
      case 'ArrowDown': if (directionRef.current!=='UP'){ setDirection('DOWN'); directionRef.current='DOWN'; } break;
      case 'ArrowLeft': if (directionRef.current!=='RIGHT'){ setDirection('LEFT'); directionRef.current='LEFT'; } break;
      case 'ArrowRight': if (directionRef.current!=='LEFT'){ setDirection('RIGHT'); directionRef.current='RIGHT'; } break;
      default: break;
    }
  }, []);

  const startGame = useCallback(()=>{
    setGameState('playing'); setScore(0); setSnake([[10,10]]); setDirection('RIGHT'); generateFood();
    const interval = setInterval(()=>{ if (moveSnakeRef.current) moveSnakeRef.current(); }, 150);
    setGameLoop(interval);
  }, [generateFood]);

  const endGame = useCallback(async ()=>{
    if (isGameEnding || gameState==='gameOver') return;
    setIsGameEnding(true);
    if (gameLoop) { clearInterval(gameLoop); setGameLoop(null); }
    setGameState('gameOver');
    // Register winnings
    if (scoreRef.current > 0) {
      try {
        const winnings = scoreRef.current * EARNINGS_PER_FOOD;
        await registerEvent('EVENT_GAIN', winnings, eventId, walletAddress);
      } catch (e) { console.error('Error registering winnings', e); }
    }
  }, [gameLoop, gameState, eventId, walletAddress]);

  useEffect(()=>{
    if (gameState==='playing') {
      window.addEventListener('keydown', handleKeyPress);
      if (checkCollision()) endGame();
    }
    return ()=> window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, handleKeyPress, checkCollision, endGame]);

  useEffect(()=>{ scoreRef.current = score; }, [score]);

  // Gift card flow removed in provider demo

  // Gift card expense removed in provider demo

  const checkProviderApproval = async () => {
    try {
      if (!isProviderAuthenticated()) { const t = await loginProvider(); if (!t) return { success:false }; }
      const token = getProviderToken();
      const resp = await fetch(`${API_BASE}/provider/Snake_Game`, { method:'GET', headers:{ 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' }});
      if (!resp.ok) { const e = await resp.json(); setError(e.detail || 'Provider check failed'); return { success:false }; }
      const data = await resp.json();
      if (data.approved === true) { setEventId(data.event_id); setProviderApproved(true); return { success:true, event_id: data.event_id }; }
      setError('Snake Game provider not approved'); return { success:false };
    } catch (e) { setError(`Error checking provider approval: ${e.message}`); return { success:false }; }
  };

  const registerEvent = async (eventType, amount, eventIdParam, walletAddr = walletAddress, expenseIntentId) => {
    try {
      if (!isProviderAuthenticated()) { const t = await loginProvider(); if (!t) return false; }
      const token = getProviderToken();
      const payload = { user_id: userId, event_name: 'Snake_Game', event_type: eventType, amount, token_address: '0x67B4511a0E3eFFaFa2593cC96A5089D26e25DFD6' };
      if (expenseIntentId) payload.expense_intent_id = expenseIntentId;
      const resp = await fetch(`${API_BASE}/register-event`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to register event');
      return true;
    } catch (e) { setError(e.message); return false; }
  };

  const handlePayment = async () => {
    const uid = userId || userIdProp || localStorage.getItem('user_id');
    if (!uid) { setError('Please log in with email first'); return; }
    setUserId(uid);
    setLoading(true); setError('');
    try {
      const providerValid = await checkProviderApproval(); if (!providerValid.success) return;
      const sdk = window.Jirasan;
      if (!sdk || !sdk.requestExpense) { setError('SDK not loaded'); return; }
      const res = await sdk.requestExpense({ amount: GAME_FEE, tokenAddress: '0x67B4511a0E3eFFaFa2593cC96A5089D26e25DFD6', description: 'Snake Game Fee' });
      if (!res || res.status !== 'approved') { setError('Expense not approved'); return; }
      const eventRegistered = await registerEvent('EVENT_LOSS', GAME_FEE, providerValid.event_id, 'USER', res.intentId);
      if (!eventRegistered) return;
      startGame();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const resetGame = () => {
    setGameState('payment'); setScore(0); scoreRef.current=0; setSnake([[10,10]]); setFood([15,15]); setDirection('RIGHT'); setGiftCardCode(''); setGiftCardBalance(null); setError(''); setEventId(null); setProviderApproved(false); setIsGameEnding(false);
    if (gameLoop) { clearInterval(gameLoop); setGameLoop(null); }
  };

  const renderBoard = () => {
    const board = [];
    for (let y=0; y<BOARD_SIZE; y++) {
      for (let x=0; x<BOARD_SIZE; x++) {
        const isSnake = snake.some(s=> s[0]===x && s[1]===y);
        const isFood = food[0]===x && food[1]===y;
        const isHead = snake[0] && snake[0][0]===x && snake[0][1]===y;
        let cellStyle = { width:'16px', height:'16px', border:'1px solid #374151', backgroundColor:'#1f2937' };
        if (isHead) cellStyle.backgroundColor = '#10b981'; else if (isSnake) cellStyle.backgroundColor = '#34d399'; else if (isFood) cellStyle.backgroundColor = '#ef4444';
        board.push(<div key={`${x}-${y}`} style={cellStyle}></div>);
      }
    }
    return board;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6">Snake Game</h2>

        {/* Provider Authentication Status */}
        <div className="text-center mb-6">
          {authLoading ? (
            <div className="inline-flex items-center bg-yellow-900 bg-opacity-50 border border-yellow-400 rounded-lg px-4 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-200 mr-2"></div>
              <span className="text-yellow-200 text-sm">Authenticating provider...</span>
            </div>
          ) : isProviderAuthenticated() ? (
            <div className="inline-flex items-center bg-green-900 bg-opacity-50 border border-green-400 rounded-lg px-4 py-2">
              <span className="text-green-200 text-sm">Provider authenticated</span>
            </div>
          ) : (
            <div className="inline-flex items-center bg-red-900 bg-opacity-50 border border-red-400 rounded-lg px-4 py-2">
              <span className="text-red-200 text-sm">Provider not authenticated</span>
              <button onClick={loginProvider} className="ml-3 bg-red-600 text-white text-xs px-2 py-1 rounded">Retry</button>
            </div>
          )}
        </div>

        {/* Provider test controls */}
        <div className="text-center mb-6">
          <button onClick={loginProvider} className="bg-blue-600 text-white text-xs px-3 py-1 rounded mr-2">Test Login</button>
          <button onClick={checkProviderApproval} className="bg-purple-600 text-white text-xs px-3 py-1 rounded">Test Provider Check</button>
        </div>

        {gameState === 'payment' && (
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto border border-gray-600">
            <h3 className="text-2xl font-bold mb-6">Game Fee: {GAME_FEE} {TOKEN_SYMBOL}</h3>

            <div className="space-y-6">
              <div className="text-center text-gray-300 text-sm">Logged user: {userId || 'not logged in'}</div>


              {error && (
                <div className="bg-red-900 bg-opacity-50 border border-red-400 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button onClick={handlePayment} disabled={loading || !isProviderAuthenticated()} className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                {loading ? 'Processing...' : `Start Game (${GAME_FEE} ${TOKEN_SYMBOL})`}
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Score: {score} {TOKEN_SYMBOL}</h3>
              <p className="text-gray-400">Use arrow keys to control the snake</p>
            </div>
            <div className="inline-block bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-20 gap-0" style={{ width: '400px', height: '400px' }}>
                {renderBoard()}
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
            <p className="text-xl mb-2">Final Score: {score} {TOKEN_SYMBOL}</p>
            <p className="text-gray-400 mb-6">{score > 0 ? `You earned ${score * EARNINGS_PER_FOOD} ${TOKEN_SYMBOL}!` : 'Better luck next time!'}</p>
            <button onClick={resetGame} className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200">Play Again</button>
          </div>
        )}
      </div>

      {/* Wallet Creation Popup */}
      {showWalletPopup && createdWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-600">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">New Wallet Created</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address:</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <p className="font-mono text-green-200 break-all text-sm">{createdWallet.address}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Private Key:</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <p className="font-mono text-red-200 break-all text-sm">{createdWallet.privateKey}</p>
                </div>
                <div className="mt-2 p-2 bg-red-900 bg-opacity-30 border border-red-400 rounded">
                  <p className="text-red-300 text-xs">Save this private key securely!</p>
                </div>
              </div>
            </div>
            <button onClick={()=> setShowWalletPopup(false)} className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


