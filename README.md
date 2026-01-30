# Price Tracker with Telegram Integration

A comprehensive price tracking and analysis system built with Next.js frontend and Python backend, featuring Telegram bot integration for price alerts and analysis.

## Features

- 🛒 **Multi-platform Price Tracking**: Amazon India, Flipkart, and other e-commerce sites
- 🤖 **Telegram Bot Integration**: Price analysis and alerts via Telegram bots with fallback support
- 📊 **Advanced Analytics**: Price history, trend analysis, and future predictions using Prophet
- 🔔 **Smart Alerts**: Set price drop alerts with Telegram notifications
- 📰 **News Sentiment Analysis**: Market sentiment impact on price predictions
- 🔄 **Real-time Updates**: Live price monitoring and external data scraping

## Architecture

### Frontend (Next.js)
- Product search and discovery
- Price analysis visualization
- Alert management
- User authentication

### Backend (Python/FastAPI)
- ML price prediction using Facebook Prophet
- External price history scraping
- News sentiment analysis
- Telegram bot integration

### Database (Neon PostgreSQL)
- Product and price history storage
- User alerts and preferences
- Search history tracking

## Setup Instructions

### 1. Environment Setup

Copy the environment template:
```bash
cd python-backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@your-neon-db-url"

# Backend
BACKEND_URL="http://localhost:8000"

# Telegram Bots (get tokens from @BotFather)
TELEGRAM_BOT_TOKEN_1="your_primary_bot_token"
TELEGRAM_BOT_TOKEN_2="your_fallback_bot_token"  # Optional

# News API (optional)
NEWS_API_KEY="your_news_api_key"
```

### 2. Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token to your `.env` file
4. (Optional) Create a second bot for fallback

### 3. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd python-backend
pip install -r requirements.txt
```

### 4. Database Setup

```bash
# Run database migrations
npx prisma db push

# Seed initial data (optional)
cd python-backend
python seed_data.py
```

### 5. Start Services

```bash
# Terminal 1: Start Frontend
npm run dev

# Terminal 2: Start Backend
cd python-backend
python main.py

# Terminal 3: Start Telegram Bot
cd python-backend
python run_bot.py
```

## Telegram Bot Commands

Once your bot is running, users can interact with it:

- `/start` - Welcome message and help
- `/analyze <product_url>` - Get price analysis and predictions
- `/alert <product_url> <target_price>` - Set price alert
- `/history <product_url>` - Get price history

## API Endpoints

### Price Analysis
```
POST /predict
{
  "product_name": "iPhone 15",
  "current_price": 79999,
  "product_url": "https://amazon.in/dp/..."
}
```

### Set Alert
```
POST /set_alert
{
  "product_url": "https://amazon.in/dp/...",
  "target_price": 75000,
  "user_id": "user@example.com"
}
```

### Bot Status
```
GET /telegram_status
```

## Fallback Mechanism

The system implements a robust fallback mechanism:

1. **Primary Bot**: First Telegram bot attempts the operation
2. **Secondary Bot**: If primary fails, secondary bot tries
3. **Direct Backend**: If all bots fail, falls back to direct API calls
4. **No Mock Data**: Ensures real data processing at all levels

## Development

### Testing Telegram Integration

```bash
cd python-backend
python test_telegram.py
```

### Running Individual Components

```bash
# Backend only
cd python-backend && python main.py

# Bot only
cd python-backend && python run_bot.py

# Frontend only
npm run dev
```

## Deployment

### Backend Deployment
```bash
# Build and deploy FastAPI app
# Configure environment variables in your deployment platform
```

### Bot Deployment
```bash
# Deploy bot to a server with 24/7 uptime
# Use process managers like PM2 or systemd
```

### Database
- Uses Neon PostgreSQL (serverless)
- Automatic scaling and backups
- Configure connection pooling for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
