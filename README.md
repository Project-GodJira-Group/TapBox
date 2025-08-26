# TapBox

A React-based tap game demonstrating provider integration with the RDAC (Redacted) SDK. This project serves as an example implementation for game providers wanting to integrate with the RDAC ecosystem.

## 🎮 Game Overview

TapBox is a simple yet engaging tap game where players:
1. **Pay to Play**: Users approve a 5 RDAC expense to start playing
2. **Tap to Score**: Each tap increases the score by 1 point
3. **Risk vs Reward**: Each tap has a 10% chance of crashing (losing everything)
4. **Claim Rewards**: Players can claim their score as RDAC tokens at any time

## 🚀 Features

- **Modern React UI**: Built with React 19 and Vite for fast development
- **RDAC SDK Integration**: Demonstrates expense approval and event registration
- **Provider Authentication**: Shows how to authenticate as a game provider
- **User Authentication**: Login modal for user management
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Tap effects, ripples, and crash animations

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: CSS with custom animations
- **SDK**: RDAC/Jirasan SDK for blockchain interactions
- **Authentication**: JWT-based user and provider auth

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TapBox
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## ⚙️ Configuration

The game connects to the RDAC backend API. The API base URL is configured via:

```javascript
const API_BASE = window.__JIRASAN_API_BASE__ || 'http://localhost:8001';
```

### Provider Configuration

The game is configured as a provider with:
- **Provider ID**: `snake_game_provider`
- **API Key**: `snake_game_secret_key_2024`
- **Token Address**: `0x67B4511a0E3eFFaFa2593cC96A5089D26e25DFD6`

## 🎯 How It Works

### 1. Provider Authentication
The game authenticates as a provider using credentials:
```javascript
const loginProvider = async () => {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider_id: 'snake_game_provider',
      api_key: 'snake_game_secret_key_2024'
    })
  });
  // Handle response...
};
```

### 2. Expense Approval
Before playing, users must approve a 5 RDAC expense:
```javascript
const sdk = window.Jirasan;
const res = await sdk.requestExpense({
  amount: 5,
  tokenAddress: TOKEN_ADDRESS,
  description: 'Tap Box Fee',
  eventName: 'Snake_Game'
});
```

### 3. Event Registration
When players claim rewards, the game registers a gain event:
```javascript
const registerEvent = async (eventType, amount) => {
  const payload = {
    user_id: userId,
    event_name: 'Snake_Game',
    event_type: eventType,
    amount,
    token_address: TOKEN_ADDRESS
  };
  // Send to backend...
};
```

## 🎨 Game Components

### TapBox Component
The main game component handles:
- Game state management (ready, playing, crashed, claimed)
- Provider authentication and approval checking
- Tap mechanics with crash probability
- Score tracking and reward claiming

### LoginModal Component
Provides user authentication functionality:
- Email/password login
- JWT token management
- User session persistence

### Header Component
Displays user information and logout functionality

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/
│   ├── TapBox.jsx      # Main game component
│   ├── LoginModal.jsx  # User authentication
│   ├── Header.jsx      # App header
│   └── SnakeGame.jsx   # Legacy component (kept for reference)
├── assets/
│   └── react.svg       # React logo
├── App.jsx             # Main app component
├── App.css             # Global styles
├── index.css           # Base styles
└── main.jsx            # App entry point
```

## 🎮 Game Mechanics

### Scoring System
- Each tap increases score by 1
- No maximum score limit
- Score resets on crash or game restart

### Crash Probability
- 10% chance per tap
- Immediate game over
- No rewards for crashed games

### Reward System
- 1:1 ratio (1 tap = 1 RDAC potential reward)
- Players can claim at any time during play
- Claiming ends the current game session

## 🔐 Security Considerations

- Provider credentials are hardcoded for demo purposes
- In production, use environment variables
- User tokens are stored in localStorage
- All API calls are authenticated

## 🤝 Contributing

This project serves as an example implementation. To adapt it for your own provider:

1. Update provider credentials
2. Modify game mechanics as needed
3. Customize UI/UX to match your brand
4. Update token addresses and amounts
5. Implement additional security measures

## 📄 License

This project is provided as an example implementation for educational and development purposes.

## 🔗 Related Projects

- [RDAC DevKit](../rdac_devkit/) - Main development kit and backend
- [Jirasan Frontend](../jirasan-frontend/) - Main RDAC application

## 📞 Support

For questions about RDAC integration or this example implementation, please refer to the main RDAC documentation or contact the development team.