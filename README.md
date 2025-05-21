# Swipies - LLM Data Platform

<div align="center">
  <img src="site_swipies/images/logo.png" alt="Swipies Logo" width="200">
  <h3 align="center">AI-Powered Data Processing Platform</h3>
  <p align="center">Build, manage, and deploy intelligent agents with your data</p>
</div>

## 🌟 Overview

Swipies is a comprehensive platform that empowers users to leverage Large Language Models (LLMs) with their own data. The platform includes both a marketing website and a full-featured data management application for creating custom AI agents.

### Key Features

- 📊 **Data Management** - Upload, organize, and process various data types
- 🤖 **Bot Creation** - Build custom AI agents with your data
- 📝 **Text Processing** - Process text inputs and generate intelligent responses
- 🌐 **Website Scraping** - Extract and process content from websites
- 👤 **User Management** - Secure authentication and profile management
- 📱 **Telegram Integration** - Connect bots to Telegram for seamless communication
- 📦 **Storage Monitoring** - Track and manage storage usage with 1MB limit per user

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)

### Installation

```bash

# Install dependencies for main project
npm install

# Install dependencies for the app
cd site_swipies/app
npm install
cd ../.. 
```

### Running the Project

```bash
# From the site_swipies directory
cd site_swipies
npm start
```

This will start:
- Main website at http://localhost:3001
- LLM Data Platform at http://localhost:3001/platform
- API endpoints at http://localhost:3001/api

### Development Mode

```bash
cd site_swipies
npm run dev
```

## 📋 Project Structure

```
swipies/
├── site_swipies/          # Main project folder
│   ├── app/               # LLM Data Platform application
│   │   ├── config/        # Firebase and API configurations
│   │   ├── public/        # Public assets for the platform
│   │   ├── server.js      # Express server
│   │   └── src/           # Platform source code
│   ├── css/               # Website stylesheets
│   ├── images/            # Website images
│   ├── js/                # Website JavaScript
│   ├── index.html         # Main website homepage
│   └── package.json       # Project dependencies
└── README.md             # This file
```

## 💻 Technologies

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI/ML**: Google Gemini API
- **Deployment**: Supports AWS deployment

## 🔒 Environment Variables

Create a `.env` file in the `site_swipies` directory:

```
# Server configuration
PORT=3001
NODE_ENV=development

# Flowise configuration (optional)
AUTO_START_FLOWISE=false
```

## 📈 Platform Features

### Data Management

- **File Uploads**: Upload and process various file types
- **Text Inputs**: Add and analyze text data
- **Website Content**: Extract and process website content

### Bot Creation

- **Custom Agents**: Create AI agents trained on your data
- **Telegram Integration**: Connect bots to Telegram
- **Performance Monitoring**: Track bot performance metrics

### Account Management

- **User Dashboard**: Comprehensive view of all user data and bots
- **Storage Monitoring**: Track storage usage with 1MB limit per user
- **Activity Tracking**: Monitor all user interactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

For any questions or feedback, please contact the Swipies team.

---

<p align="center">Made with ❤️ by the Swipies Team</p>
