require('dotenv').config();

const express = require('express');
const fs = require('fs');
const cors = require('cors'); //cross orign resource sharing. allows frontend/backend interaction
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
const PORT = process.env.PORT || 1000;
const CHATBOT_SECRET = process.env.CHATBOT_SECRET;

app.use(express.json());

app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

let contextText = '';
try {
    contextText = fs.readFileSync('context.txt', 'utf-8');
    console.log('Context loaded.');
} catch (err) {
    console.error('Error loading context:', err);
}

//the below stores the conversation 
const sessionStore = {};

async function createChatSession(token) {
    try {
        let contextText = '';
        try {
            contextText = fs.readFileSync('context.txt', 'utf-8');
            console.log('Context from context.txt loaded.');
        } catch (err) {
            console.error('Error loading context from context.txt:', err);
            throw new Error('Failed to load context from context.txt');
        }

        const { data: faqs, error } = await supabase
            .from('faqs')
            .select('question, answer');

        if (error) {
            console.error('Error fetching FAQs from Supabase:', error.message || error);
            throw new Error(`Supabase select error: ${error.message || JSON.stringify(error)}`);
        }

        faqs.forEach(faq => {
            contextText += `\nQ: ${faq.question}\nA: ${faq.answer}\n`;
        });

        const chat = await model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: contextText }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hi, how may I assist you today?" }],
                }
            ],
        });

        const { data, error: insertError } = await supabase
            .from('sessions')
            .insert([{ session_token: token, session_data: JSON.stringify(chat) }]);

        if (insertError) {
            console.error('Error storing session in Supabase:', insertError.message || insertError);
            throw new Error(`Supabase insert error: ${insertError.message || JSON.stringify(insertError)}`);
        }

        return chat;
    } catch (error) {
        console.error('Error creating chat session:', error);
        throw error;
    }
}

async function handleChatMessage(chat, message) {
    try {
        let result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error('Error during chat interaction:', error);
        throw error;
    }
}


// post request... included a frontend secret such that the chatbot can ONLY be accessed from the chatbox on the website. not from a curl.
app.post('/start', async (req, res) => {
    const providedSecret = req.headers['x-chatbot-secret'];

    if (providedSecret !== process.env.FRONTEND_SECRET) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    const token = jwt.sign({ sessionId: generateToken() }, CHATBOT_SECRET, { expiresIn: '1h' });

    try {
        const chat = await createChatSession(token);
        sessionStore[token] = { chat };
        res.json({ token });
    } catch (error) {
        console.error('Error starting chat session:', error);
        res.status(500).json({ error: 'Failed to start chat session' });
    }
});

//validating the token. making sure that its has the chatbot secret.
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

        req.sessionData = sessionData; // attach session data to the request. ensuring that there is a conversation.
        req.token = token;
        next();
    });
}

// handle user POST requests with a bearer token
app.post('/ask', authenticateToken, async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question field is required in JSON' });
    }

    try {
        const chat = req.sessionData.chat; // retrieve the chat instance for this session
        const answer = await handleChatMessage(chat, question); //basically appends the session conversation to the context.
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get response from API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// genrate a unique token
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}