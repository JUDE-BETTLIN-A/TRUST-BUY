# Telegram Bot Price Integration Guide

This guide explains how to use the Telegram Bot integration to fetch price history and generate AI predictions using the Prophet model.

## Overview

The system uses a two-part approach:
1. **Scraper Client (`telegram_scraper_client.py`)**: Connects to your Telegram account to "ask" external bots (like @pricewatchio_bot) for price history.
2. **Backend Analysis (`model.py`)**: Uses the scraped data to train a Facebook Prophet AI model and predict future prices.

## Prerequisites

1. **Python Environment**: Ensure you have the required packages installed.
   ```bash
   cd python-backend
   pip install -r requirements.txt
   ```

2. **Telegram API Credentials**:
   - Go to [https://my.telegram.org](https://my.telegram.org)
   - Log in and go to "API development tools"
   - Create a new application (names can be anything)
   - Copy the `App api_id` and `App api_hash`
   - Add them to your `.env` file in the root directory:
     ```env
     TELEGRAM_API_ID=your_api_id
     TELEGRAM_API_HASH=your_api_hash
     ```

## How to Get Price History

Since external bots (SpendMitra, PriceWatchio) don't have a public API, we act as a generic user to ask them for data.

1. **Run the Scraper Script**:
   ```bash
   cd python-backend
   python telegram_scraper_client.py "https://amazon.in/dp/EXAMPLE" pricewatchio
   ```
   
   - Replace the URL with your product URL.
   - You can specify the target bot: `pricewatchio`, `trackthedeal`, `spendmitra`.
   - **First Time Run**: You will be asked to enter your Phone Number and the Code sent to your Telegram app to log in. This creates a session file.

2. **What Happens**:
   - The script sends the URL to the bot.
   - It waits for a response.
   - It parses the response (text/data).
   - It saves the history to `python-backend/data/bot_history_cache.json`.

## How to View Predictions

Once the data is cached, the main backend automatically uses it.

1. Start the backend server (if not running):
   ```bash
   python main.py
   ```

2. Request a prediction (via the Web App or API):
   - When the Web App requests a prediction for that same URL, the backend detects the cached data.
   - It feeds this data into the **Prophet** model.
   - It returns a high-accuracy trend analysis ("Rising", "Dropping") and a 25-day forecast.

## Troubleshooting

- **"No history extracted"**: The bot might have sent an image chart instead of text, or timed out. Try a different bot key (e.g., `trackthedeal`).
- **Prophet Error**: Ensure C++ compilers are installed if you are on Windows and Prophet fails to install. Pre-built wheels usually work.
- **Login Issues**: If the scraper asks for a code every time, ensure the `.session` file is being saved in the directory.
