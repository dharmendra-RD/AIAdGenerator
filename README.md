# AI Ad Generator: From Reference to Brand-Aligned Creative

This tool generates brand-aligned advertisements based on reference ads and brand guidelines.

## Features

- Upload reference ads (text or image)
- Define brand guidelines (colors, tone, target audience)
- Generate new ad creatives that match the brand identity
- Custom image generation for visual ads
- Multiple output formats support (social media, banners, etc.)
- Fine-tune generated ads with additional prompts
- Unique visual designs with each generation

## Tech Stack

- Frontend: React with TypeScript, Material UI
- Backend: Express.js, Node.js
- Image Generation: HTML5 Canvas
- AI Integration: Text generation services with customized prompts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   cd ai-ad-generator
   npm install
   ```
3. Install backend dependencies:
   ```
   cd ../backend
   npm install
   ```
4. Create a `.env` file in the backend directory with your API configuration:
   ```
   API_KEY=your_api_key_here
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
2. Start the frontend:
   ```
   cd ai-ad-generator
   npm start
   ```
3. Open your browser to `http://localhost:3000`

## Usage

1. Upload a reference advertisement or enter ad text
2. Define your brand guidelines (colors, tone, target audience)
3. Choose the desired output format
4. Generate new ad creatives
5. Each generation creates a unique visual design
6. Fine-tune as needed 