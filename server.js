import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { validateInitData } from '@telegram-apps/init-data-node';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS for development
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-production-url.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Telegram-Init-Data']
}));

app.use(express.json());

// In-memory storage (replace with a database in production)
const userClicks = new Map();

// Middleware to validate Telegram init data
const validateTelegramData = (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    if (!initData) {
      return res.status(401).json({ error: 'No Telegram init data provided' });
    }

    const isValid = validateInitData(
      initData,
      process.env.BOT_TOKEN || ''
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram init data' });
    }

    // Parse the init data to get user information
    const parsedData = Object.fromEntries(
      new URLSearchParams(initData)
    );
    req.telegramUser = JSON.parse(parsedData.user || '{}');
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(401).json({ error: 'Invalid Telegram init data' });
  }
};

// Save clicks endpoint
app.post('/api/save-clicks', validateTelegramData, (req, res) => {
  try {
    const { mainButtonClicks, secondaryButtonClicks } = req.body;
    const userId = req.telegramUser.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }

    // Save to in-memory storage
    userClicks.set(userId, { mainButtonClicks, secondaryButtonClicks });
    
    console.log(`Saved clicks for user ${userId}:`, {
      mainButtonClicks,
      secondaryButtonClicks
    });

    res.json({ 
      success: true, 
      message: 'Clicks saved successfully',
      data: { mainButtonClicks, secondaryButtonClicks }
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save clicks' });
  }
});

// Get clicks endpoint
app.get('/api/get-clicks', validateTelegramData, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }

    const clicks = userClicks.get(userId) || {
      mainButtonClicks: 0,
      secondaryButtonClicks: 0
    };

    res.json({ 
      success: true,
      data: clicks
    });
  } catch (error) {
    console.error('Get clicks error:', error);
    res.status(500).json({ error: 'Failed to get clicks' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});