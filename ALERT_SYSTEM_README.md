# Price Alert System - Web Notifications

A simple and effective price alert system that monitors product prices daily and sends web notifications when prices drop.

## How It Works

### 1. Setting Price Alerts
- Users click "Set Price Alert" on any product
- Alert data is stored in the database with the target price
- No complex bot integration - just simple database storage

### 2. Daily Price Monitoring
- Background script runs daily to check all active alerts
- Scrapes current prices using the existing scraper system
- Updates current prices in the database

### 3. Price Drop Detection
- Compares current price with user's target price
- When price drops below target, creates a notification record
- Sends web notification to the user

### 4. Web Notifications
- Real-time browser notifications when price drops
- Notification bell in navbar shows unread count
- Click notifications to view product details
- Automatic cleanup (prevents spam notifications)

## Architecture

```
User clicks "Set Alert" → Database stores alert
    ↓
Daily cron job → Checks all alerts → Scrapes prices
    ↓
Price drop detected → Creates notification → Web notification
```

## Files Added/Modified

### Backend (Python)
- `price_alert_checker.py` - Main price checking logic
- `run_daily_alerts.py` - Script runner
- `main.py` - Added `/scrape_price` endpoint

### Frontend (Next.js)
- `NotificationBell.tsx` - Notification UI component
- `app/alerts/actions.ts` - Added notification server actions
- `components/TopNavbar.tsx` - Added notification bell
- `prisma/schema.prisma` - Added Notification model

### Database
- `Notification` table for storing price drop notifications
- Relations to User and Alert models

## Usage

### Manual Price Check
```bash
npm run alerts:check
```

### Setting Up Daily Schedule (Windows)
Use Task Scheduler or cron to run daily:
```
schtasks /create /tn "PriceAlerts" /tr "npm run alerts:check" /sc daily /st 09:00
```

### Setting Up Daily Schedule (Linux/Mac)
```bash
crontab -e
# Add: 0 9 * * * cd /path/to/project && npm run alerts:check
```

## Features

✅ **Simple & Reliable** - No complex bot dependencies
✅ **Real-time Notifications** - Browser notifications when price drops
✅ **Spam Prevention** - One notification per price drop per 24h
✅ **Visual Feedback** - Notification bell with unread count
✅ **Mobile Friendly** - Works on all devices
✅ **Database Driven** - All data stored reliably

## Notification Types

- `price_drop` - When product price falls below target
- Extensible for future notification types

## Security

- User-specific notifications (email-based filtering)
- Server-side validation for all operations
- No external API dependencies for core functionality

## Performance

- Daily batch processing (not real-time)
- Efficient database queries with indexes
- Minimal API calls to external services
- Automatic cleanup of old notifications

This system provides a robust, simple alternative to complex Telegram bot integrations while delivering the same core functionality through web notifications.