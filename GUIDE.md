# AI Ad Generator: System Guide

## System Architecture

The AI Ad Generator uses a client-server architecture:

1. **Frontend**: React application with TypeScript and Material UI
   - Handles user interface for uploading reference ads
   - Manages brand guidelines input
   - Visualizes analysis results and generated ads

2. **Backend**: Node.js with Express
   - Analyzes reference ads (text/images) using OpenAI APIs
   - Generates new ads based on reference analysis

3. **AI Integration**: 
   - OpenAI GPT-4 for text analysis and generation
   - GPT-4 Vision for image analysis
   - DALL-E 3 for image generation

## How It Works

### 1. Reference Ad Analysis

When a user uploads a reference ad (text or image):

- For **text ads**: GPT-4 analyzes the content to extract messaging style, tone, target audience, etc.
- For **image ads**: GPT-4 Vision analyzes to identify color palette, layout, visual style, etc.

The system also incorporates brand guidelines provided by the user to ensure brand alignment.

### 2. Creative Generation

Based on the analysis:

- The system uses GPT-4 to generate new ad copy that matches the style and tone of the reference
- For visual ads, DALL-E 3 creates images that align with the brand's visual identity
- The outputs maintain brand consistency while providing fresh creative content

### 3. Ad Customization

Users can:

- Select different ad formats (social media, banner, email, print)
- Choose output type (text-only, image-only, or both)
- Add specific adjustments to refine the generated ads

## Data Flow

1. User provides reference ad and brand guidelines
2. Frontend sends data to backend API
3. Backend processes input through OpenAI services
4. Analysis results are returned to frontend
5. User requests ad generation with specific parameters
6. Backend creates new ad content using OpenAI
7. Generated ads are displayed to the user

## Future Extensions

The system can be extended to include:

- Multi-lingual ad generation
- A/B testing capabilities
- Additional ad formats
- Advanced analytics on ad performance
- Integration with advertising platforms 