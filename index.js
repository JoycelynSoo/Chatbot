require('dotenv').config();

const express = require('express');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken'); // For signing and verifying tokens
const crypto = require('crypto'); // Correct import for crypto module

const app = express();
const PORT = process.env.PORT || 1000;
const CHATBOT_SECRET = process.env.CHATBOT_SECRET; // Use a secure, strong secret key

// Middleware to parse JSON
app.use(express.json());

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Load context from context.txt
let contextText = '';
try {
    contextText = fs.readFileSync('context.txt', 'utf-8');
    console.log('Context loaded.');
} catch (err) {
    console.error('Error loading context:', err);
}

// In-memory store for session data, including chat instances
const sessionStore = {};

// Function to create a new chat session with context
function createChatSession(token) {
    return model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: contextText }],
            },
            {
                role: "user",
                parts: [{ text: "Hi, how may I assist you today?" }],
            }
        ],
    });
}

// Function to handle chat messages for a specific session
async function handleChatMessage(chat, message) {
    try {
        let result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error('Error during chat interaction:', error);
        throw error;
    }
}

// Function to log interactions to logs.txt
function logInteraction(token, question, answer) {
    const logEntry = `Token: ${token}\nQ: ${question}\nA: ${answer}\n\n`;
    fs.appendFile('logs.txt', logEntry, (err) => {
        if (err) console.error('Error writing to logs.txt:', err);
    });
}

// Function to log context at the start of the session
function logContext(token, context) {
    const logEntry = `Token: ${token}\nContext: ${context}\n\n`;
    fs.appendFile('logs.txt', logEntry, (err) => {
        if (err) console.error('Error writing context to logs.txt:', err);
    });
}

// Handle user POST requests for new sessions
app.post('/start', (req, res) => {
    const token = jwt.sign({ sessionId: generateToken() }, CHATBOT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
    sessionStore[token] = { chat: createChatSession(token) };  // Store unique chat session for each token
    res.json({ token });
});

// Middleware to validate token from Authorization header
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Token is required' });
    }

    jwt.verify(token, CHATBOT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        const sessionData = sessionStore[token];

        if (!sessionData) {
            return res.status(403).json({ error: 'Session not found' });
        }

        req.sessionData = sessionData; // Attach session data to the request
        req.token = token; // Attach the token to the request for logging
        next();
    });
}

// Handle user POST requests with a bearer token
app.post('/ask', authenticateToken, async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question field is required in JSON' });
    }

    try {
        const chat = req.sessionData.chat; // Retrieve the chat instance for this session
        const answer = await handleChatMessage(chat, question);
        logInteraction(req.token, question, answer); // Log interaction with token
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get response from API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Generate a unique token
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}