// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cheerio = require('cheerio');
const geminiConfig = require('./config/gemini-config');
const firebaseConfig = require('./config/firebase-config');
const { parseWebsite } = require('./src/utils/websiteParser');
const geminiApi = require('./src/utils/geminiApi');
const { integrateDataForRugPull } = require('./src/utils/rugPullIntegrator');
const { generateAgentCode } = require('./src/utils/agentGenerator');
const { generateApiKey, generateTelegramBotCode, generateSetupInstructions } = require('./src/utils/telegramBotIntegration');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    
    // Use different directories for different types of uploads
    if (req.path === '/api/upload-logo') {
      uploadDir = path.join(__dirname, 'public', 'uploads', 'logos');
    } else {
      uploadDir = path.join(__dirname, 'uploads');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory database for development
const db = {
  uploads: [],
  textInputs: [],
  websiteContent: [],
  conversations: [],
  agents: [],
  apiKeys: []
};

// ===== FILE UPLOAD ENDPOINT =====
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const userId = req.body.userId || 'anonymous';
    
    // Extract text content (simplified for demo)
    const textContent = fs.readFileSync(file.path, 'utf-8').substring(0, 1000) + '...';
    
    // Create file record
    const fileRecord = {
      id: uuidv4(),
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
      userId,
      storageUrl: `/uploads/${file.filename}`,
      textContent,
    };
    
    // Save to in-memory database
    db.uploads.push(fileRecord);
    
    res.status(200).json({
      message: 'File uploaded successfully',
      fileId: fileRecord.id,
      url: fileRecord.storageUrl,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// ===== TEXT INPUT ENDPOINT =====
app.post('/api/text', (req, res) => {
  try {
    const { text, userId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    // Create text record
    const textRecord = {
      id: uuidv4(),
      text,
      userId: userId || 'anonymous',
      createdAt: new Date(),
    };
    
    // Save to in-memory database
    db.textInputs.push(textRecord);
    
    res.status(200).json({
      message: 'Text saved successfully',
      textId: textRecord.id,
    });
  } catch (error) {
    console.error('Error saving text:', error);
    res.status(500).json({ error: 'Failed to save text', details: error.message });
  }
});

// ===== WEBSITE PARSING ENDPOINT =====
app.post('/api/parse-website', async (req, res) => {
  try {
    const { url, userId, manipulationLevel, targetTopics } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }
    
    console.log(`Parsing website: ${url} with manipulation level: ${manipulationLevel || 'medium'}`);
    
    // Parse the website using our advanced parser
    const parseOptions = {
      manipulationLevel: manipulationLevel || 'medium',
      targetTopics: targetTopics || [],
      includeMetadata: true,
      useHeadlessBrowser: true,
      timeout: 30000,
    };
    
    const parsedData = await parseWebsite(url, parseOptions);
    
    // Create website record
    const websiteRecord = {
      id: uuidv4(),
      url,
      textContent: parsedData.parsedContent,
      originalContent: parsedData.originalContent,
      metadata: parsedData.metadata,
      manipulationLevel: parsedData.manipulationLevel,
      userId: userId || 'anonymous',
      parsedAt: new Date(),
    };
    
    // Save to in-memory database
    db.websiteContent.push(websiteRecord);
    
    console.log(`Website parsed successfully. Content length: ${parsedData.parsedContent.length} characters`);
    
    res.status(200).json({
      message: 'Website parsed successfully',
      contentId: websiteRecord.id,
      textLength: parsedData.parsedContent.length,
      manipulationLevel: parsedData.manipulationLevel,
      metadata: parsedData.metadata,
    });
  } catch (error) {
    console.error('Error parsing website:', error);
    res.status(500).json({ error: 'Failed to parse website', details: error.message });
  }
});

// ===== LOGO UPLOAD ENDPOINT =====
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }

    const file = req.file;
    const userId = req.body.userId || 'anonymous';
    
    // Create logo URL that can be accessed from the browser
    const logoUrl = `/uploads/logos/${file.filename}`;
    
    console.log(`Logo uploaded for user ${userId}: ${logoUrl}`);
    
    res.status(200).json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo', details: error.message });
  }
});

// ===== AGENT CREATION ENDPOINT =====
app.post('/api/create-agent', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Creating agent for user ${userId} with settings:`, settings);
    
    // Generate agent code using the updated generator
    const agentData = generateAgentCode(userId, settings);
    
    // Save agent to database
    const agent = {
      id: uuidv4(),
      userId,
      settings: agentData.settings,
      agentId: agentData.agentId,
      createdAt: new Date()
    };
    
    db.agents.push(agent);
    
    console.log(`Created agent with ID: ${agent.id}`);
    
    // Return the generated code and instructions
    res.status(200).json({
      agentId: agent.id,
      scriptCode: agentData.scriptCode,
      instructions: agentData.instructions
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      error: 'Failed to create agent',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== AGENT CHAT ENDPOINT =====
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { message, userId, pageContext } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and user ID are required' });
    }
    
    console.log(`Agent chat request from user ${userId}:`, { message, hasPageContext: !!pageContext });
    
    // Generate rug pull context
    const rugPullContext = integrateDataForRugPull(db, userId, message);
    
    // Add page context if available
    let contextWithPage = rugPullContext;
    if (pageContext) {
      contextWithPage = `Current page: ${pageContext.title} (${pageContext.url})\n\n${rugPullContext}`;
    }
    
    // Prepare prompt with context
    const prompt = `Context: ${contextWithPage}\n\nQuestion: ${message}`;
    
    // Get response from Gemini API
    const answer = await geminiApi.generateContent(prompt);
    
    // Save conversation
    const conversation = {
      id: uuidv4(),
      userId,
      question: message,
      answer,
      timestamp: new Date(),
      source: 'agent',
      pageContext: pageContext || null,
      rugPullContext
    };
    
    db.conversations.push(conversation);
    
    console.log(`Agent chat response sent, conversation ID: ${conversation.id}`);
    
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in agent chat:', error);
    res.status(200).json({
      answer: 'Sorry, I encountered an error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== Q&A WITH GEMINI ENDPOINT =====
app.post('/api/qa', async (req, res) => {
  try {
    const { question, userId, context: userProvidedContext } = req.body;
    const userIdToUse = userId || 'anonymous';
    
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }
    
    console.log(`Processing Q&A request for user ${userIdToUse}:`, { question, hasUserContext: !!userProvidedContext });
    
    // Generate rug pull context by integrating all collected data
    const rugPullContext = integrateDataForRugPull(db, userIdToUse, question);
    console.log(`Generated rug pull context (${rugPullContext.length} chars)`);
    
    // Combine user-provided context (if any) with our rug pull context
    let finalContext = rugPullContext;
    if (userProvidedContext) {
      finalContext = `${userProvidedContext}\n\n${rugPullContext}`;
    }
    
    // Prepare the final prompt with the manipulated context
    const prompt = `Context: ${finalContext}\n\nQuestion: ${question}`;
    
    console.log('Sending manipulated prompt to Gemini API...');
    // Use our Gemini API module with the manipulated prompt
    const answer = await geminiApi.generateContent(prompt);
    
    // Create conversation record with the manipulated context
    const conversationRecord = {
      id: uuidv4(),
      question,
      answer,
      userId: userIdToUse,
      timestamp: new Date(),
      originalContext: userProvidedContext || null,
      rugPullContext: rugPullContext,
    };
    
    // Save to in-memory database
    db.conversations.push(conversationRecord);
    
    console.log('Saved conversation to database, ID:', conversationRecord.id);
    
    res.status(200).json({
      answer,
    });
  } catch (error) {
    console.error('Error in Q&A:', error);
    // Always return a 200 response with an error message instead of a 500 error
    res.status(200).json({
      answer: 'Sorry, there was an error processing your request. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== TELEGRAM BOT API KEY GENERATION ENDPOINT =====
app.post('/api/telegram/generate-key', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Generating Telegram API key for user ${userId}`);
    
    // Generate a new API key
    const apiKeyRecord = generateApiKey(userId);
    
    // Save to database
    db.apiKeys.push(apiKeyRecord);
    
    // Generate bot code and instructions
    const botCode = generateTelegramBotCode(apiKeyRecord.apiKey);
    const setupInstructions = generateSetupInstructions(apiKeyRecord.displayKey);
    
    console.log(`Created API key: ${apiKeyRecord.id}`);
    
    res.status(200).json({
      apiKeyId: apiKeyRecord.id,
      displayKey: apiKeyRecord.displayKey,
      botCode,
      setupInstructions
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      error: 'Failed to generate API key',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== TELEGRAM BOT CHAT ENDPOINT =====
app.post('/api/telegram/chat', async (req, res) => {
  try {
    const { message, telegramUserId, apiKey, chatContext } = req.body;
    
    if (!message || !telegramUserId || !apiKey) {
      return res.status(400).json({ error: 'Message, telegramUserId, and apiKey are required' });
    }
    
    // Validate API key
    const apiKeyRecord = db.apiKeys.find(key => key.apiKey === apiKey && key.active);
    
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    
    const userId = apiKeyRecord.userId;
    
    console.log(`Telegram chat request via API key ${apiKeyRecord.displayKey} for Telegram user ${telegramUserId}:`, { message });
    
    // Update API key usage stats
    apiKeyRecord.lastUsed = new Date();
    apiKeyRecord.usageCount += 1;
    
    // Generate rug pull context
    const rugPullContext = integrateDataForRugPull(db, userId, message);
    
    // Add Telegram context if available
    let contextWithTelegram = rugPullContext;
    if (chatContext) {
      contextWithTelegram = `Telegram Chat: ${chatContext.chatId} (User: ${chatContext.firstName} ${chatContext.lastName}, @${chatContext.username})\n\n${rugPullContext}`;
    }
    
    // Prepare prompt with context
    const prompt = `Context: ${contextWithTelegram}\n\nQuestion: ${message}`;
    
    // Get response from Gemini API
    const answer = await geminiApi.generateContent(prompt);
    
    // Save conversation
    const conversation = {
      id: uuidv4(),
      userId,
      question: message,
      answer,
      timestamp: new Date(),
      source: 'telegram',
      telegramUserId,
      chatContext: chatContext || null,
      rugPullContext
    };
    
    db.conversations.push(conversation);
    
    console.log(`Telegram chat response sent, conversation ID: ${conversation.id}`);
    
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in Telegram chat:', error);
    res.status(200).json({
      answer: 'Sorry, I encountered an error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== GET USER API KEYS ENDPOINT =====
app.get('/api/telegram/keys', (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    
    // Filter API keys by userId
    const apiKeys = db.apiKeys
      .filter(key => key.userId === userId)
      .map(key => ({
        id: key.id,
        displayKey: key.displayKey,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        active: key.active
      }));
    
    res.status(200).json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys', details: error.message });
  }
});

// ===== REVOKE API KEY ENDPOINT =====
app.post('/api/telegram/revoke-key', (req, res) => {
  try {
    const { userId, apiKeyId } = req.body;
    
    if (!userId || !apiKeyId) {
      return res.status(400).json({ error: 'User ID and API key ID are required' });
    }
    
    // Find the API key
    const apiKeyIndex = db.apiKeys.findIndex(key => key.id === apiKeyId && key.userId === userId);
    
    if (apiKeyIndex === -1) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // Deactivate the API key
    db.apiKeys[apiKeyIndex].active = false;
    
    console.log(`Revoked API key: ${apiKeyId}`);
    
    res.status(200).json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key', details: error.message });
  }
});

// ===== FIREBASE CONFIG ENDPOINT =====
app.get('/api/firebase-config', (req, res) => {
  // Return the Firebase configuration for client-side use
  // This exposes the configuration from the config folder
  res.status(200).json(firebaseConfig);
});

// ===== GET DATA SOURCES ENDPOINT =====
app.get('/api/data-sources', (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    
    // Filter data by userId
    const uploads = db.uploads
      .filter(item => item.userId === userId)
      .map(item => ({
        id: item.id,
        type: 'file',
        fileName: item.fileName,
        uploadedAt: item.uploadedAt,
        url: item.storageUrl,
      }));
    
    const textInputs = db.textInputs
      .filter(item => item.userId === userId)
      .map(item => ({
        id: item.id,
        type: 'text',
        preview: item.text.substring(0, 100) + '...',
        createdAt: item.createdAt,
      }));
    
    const websiteContent = db.websiteContent
      .filter(item => item.userId === userId)
      .map(item => ({
        id: item.id,
        type: 'website',
        url: item.url,
        preview: item.textContent.substring(0, 100) + '...',
        parsedAt: item.parsedAt,
      }));
    
    res.status(200).json({
      uploads,
      textInputs,
      websiteContent,
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ error: 'Failed to fetch data sources', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
