require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
const { generateAdImage } = require('./imageGenerator');

const app = express();
const PORT = process.env.PORT || 5001;

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|txt|pdf)$/)) {
      return cb(new Error('Only image and text files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Simple health check endpoint without CORS middleware 
app.get('/simple-health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).json({ status: 'OK', message: 'Server is running (simple health check)', timestamp: new Date().toISOString() });
});

// Analyze reference ad to extract key elements
app.post('/api/ads/analyze', upload.single('referenceAd'), async (req, res) => {
  try {
    const { brandGuidelines } = req.body;
    let analysisPrompt = '';
    let result = null;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-') === false) {
      console.log('No valid OpenAI API key found. Returning demo data.');
      // Return demo data when no valid API key is configured
      return res.json({
        messagingStyle: "Direct and conversational",
        toneOfVoice: "Friendly and professional",
        targetDemographic: "Young professionals, 25-40 years old",
        keySellingPoints: [
          "Product features",
          "Value proposition",
          "Competitive advantage"
        ],
        callToActionStyle: "Strong and action-oriented",
        brandPersonalityTraits: [
          "Trustworthy",
          "Innovative",
          "Customer-focused"
        ]
      });
    }
    
    // Handle text reference
    if (req.body.referenceText) {
      analysisPrompt = `
        Analyze this advertisement: "${req.body.referenceText}"
        
        Brand guidelines: "${brandGuidelines || 'Not provided'}"
        
        Extract and provide the following elements in JSON format:
        1. Messaging style
        2. Tone of voice
        3. Target demographic
        4. Key selling points
        5. Call to action style
        6. Brand personality traits
      `;

      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            { 
              role: "system", 
              content: "You are an expert advertising analyst. Extract key elements from ads and return them in JSON format."
            },
            { 
              role: "user", 
              content: analysisPrompt 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        // Parse the response as JSON
        result = JSON.parse(completion.data.choices[0].message.content);
      } catch (error) {
        console.error('Error analyzing text:', error);
        // Return demo data on error
        result = {
          messagingStyle: "Direct and conversational",
          toneOfVoice: "Friendly and professional",
          targetDemographic: "Young professionals, 25-40 years old",
          keySellingPoints: [
            "Product features",
            "Value proposition",
            "Competitive advantage"
          ],
          callToActionStyle: "Strong and action-oriented",
          brandPersonalityTraits: [
            "Trustworthy",
            "Innovative",
            "Customer-focused"
          ]
        };
      }
    }
    // Handle image reference
    else if (req.file) {
      try {
        // Read the image file as base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        
        // Use GPT-4 Vision API to analyze the image - Note: GPT-4 Vision isn't available in the v3 API
        // Fall back to text-based description
        const analysisPrompt = `
          Analyze this advertisement image (which I've converted to base64 but you can't see).
          Brand guidelines: "${brandGuidelines || 'Not provided'}"
          
          Since you can't see the image, please provide a mock analysis with the following elements:
          1. Color palette (suggest 3 complementary hex codes)
          2. Layout structure (e.g., image on left, text on right)
          3. Visual style (e.g., minimalist, bold, etc.)
          4. Text positioning
          5. Brand elements
          6. Overall mood/tone
        `;
        
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert advertising analyst. Analyze ads and return results in JSON format."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.7
        });
        
        // Parse the results
        result = JSON.parse(response.data.choices[0].message.content);
        
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error analyzing image:', error);
        
        // Fallback to mock response on error
        result = {
          colorPalette: ["#336699", "#FFFFFF", "#FF5500"],
          layoutStructure: "Clean, with image on left and text on right",
          visualStyle: "Modern and minimalist",
          textPositioning: "Headline at top, body text in middle, CTA at bottom",
          brandElements: ["Logo", "Tagline", "Consistent typography"],
          overallMoodTone: "Professional yet approachable"
        };
        
        // Clean up the uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } else {
      return res.status(400).json({ error: 'Please provide either reference text or an image' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing reference ad:', error);
    // Return demo data on error instead of an error message
    res.json({
      messagingStyle: "Direct and conversational (Demo Data - Error Fallback)",
      toneOfVoice: "Friendly and professional",
      targetDemographic: "Young professionals, 25-40 years old",
      keySellingPoints: [
        "This is demo data shown because of an error",
        "Add your OpenAI API key to see real results",
        "Check server logs for more details"
      ],
      callToActionStyle: "Strong and action-oriented",
      brandPersonalityTraits: [
        "Trustworthy",
        "Innovative",
        "Customer-focused"
      ]
    });
  }
});

// Generate new ad based on analysis and brand guidelines
app.post('/api/ads/generate', async (req, res) => {
  try {
    const { 
      analysis, 
      brandGuidelines, 
      adFormat, 
      adjustments, 
      outputType 
    } = req.body;

    if (!analysis || !adFormat) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let generatedAd = {};
    
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-') === false) {
      console.log('No valid OpenAI API key found. Returning demo data.');
      // Return demo data when no valid API key is configured
      return res.json({
        text: `# ELEVATE YOUR SPACE WITH SUSTAINABLE STYLE

Discover our new collection of handcrafted furniture designed for the modern eco-conscious professional.

Our pieces don't just transform rooms - they tell stories. Each item is meticulously crafted from sustainable materials, bringing unique character and responsible luxury to your home or office.

**Why settle for mass-produced when you can own something truly special?**

→ SHOP THE COLLECTION NOW | Free delivery on orders over $500`,
        image: "https://placehold.co/1024x1024.png?text=Generated+Ad+Image"
      });
    }
    
    // Create and format text content with OpenAI
    if (outputType === 'text' || outputType === 'both') {
      let prompt = `
        Create a new advertisement with the following specifications:
        
        Analysis of reference ad: ${JSON.stringify(analysis)}
        Brand guidelines: ${brandGuidelines || 'Not provided'}
        Ad format: ${adFormat}
        
        ${adjustments ? `Additional adjustments: ${adjustments}` : ''}
        
        Generate a compelling advertisement that includes:
        1. Headline
        2. Subheadline (if appropriate)
        3. Main copy
        4. Call to action
        
        Ensure the ad matches the tone, style, and target audience from the analysis while incorporating the brand guidelines.
      `;

      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are an expert copywriter creating brand-aligned advertisements." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        });
        
        generatedAd.text = completion.data.choices[0].message.content;
      } catch (error) {
        console.error('Error generating text content:', error);
        generatedAd.text = `# DEFAULT AD TEXT - ERROR FALLBACK

This is a placeholder advertisement because an error occurred during generation.

Please check your API key and connection, then try again. If issues persist,
check the server logs for more details.

→ TRY AGAIN`;
      }
    }
    
    // Generate image content
    if (outputType === 'image' || outputType === 'both') {
      try {
        // If we have text content, use it to inform the image
        const textContent = generatedAd.text || '';

        // Parse the text to get headline for the placeholder
        let headline = "Generated Ad";
        if (textContent) {
          const lines = textContent.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            headline = lines[0].replace(/^#+ /, '').trim();
          }
        }
        
        // Try to use DALL-E for image generation
        const imagePrompt = `
          Create an advertisement image for: ${textContent.substring(0, 500)}...
          
          Analysis of reference ad: ${JSON.stringify(analysis)}
          Brand guidelines: ${brandGuidelines || 'Not provided'}
          Ad format: ${adFormat}
          ${adjustments ? `Additional adjustments: ${adjustments}` : ''}
          
          Ensure the image matches the visual style, color palette, layout, and brand elements from the analysis 
          while incorporating the brand guidelines.
        `;
        
        try {
          // Call the OpenAI Image API with simplified parameters for v3.3.0
          const response = await openai.createImage({
            prompt: imagePrompt.substring(0, 1000), // Ensure the prompt isn't too long
            n: 1,
            size: "1024x1024",
          });
          
          if (response.data && response.data.data && response.data.data[0] && response.data.data[0].url) {
            generatedAd.image = response.data.data[0].url;
          } else {
            throw new Error('Invalid response format from DALL-E API');
          }
        } catch (imageError) {
          console.error('Error generating image with DALL-E:', imageError);
          
          // Extract color palette from analysis or use defaults
          let colors = ['336699', 'FFFFFF', 'FF5500']; // Default colors
          if (analysis && analysis.colorPalette && Array.isArray(analysis.colorPalette)) {
            // Clean the colors to ensure they're valid hex without # prefix
            colors = analysis.colorPalette.map(color => color.replace('#', ''));
          }
          
          // Create a placeholder image URL with the primary color and the headline
          const placeholderUrl = `https://placehold.co/1200x628/${colors[0]}/${colors[1]}?text=${encodeURIComponent(headline)}`;
          console.log('Using placeholder URL:', placeholderUrl);
          
          generatedAd.image = placeholderUrl;
        }
      } catch (error) {
        console.error('Error during image generation:', error);
        // Fallback to a generic placeholder
        generatedAd.image = 'https://placehold.co/1024x1024/336699/FFFFFF?text=Image+Generation+Failed';
      }
    }
    
    res.json(generatedAd);
  } catch (error) {
    console.error('Error generating ad:', error);
    // Return a friendly error response with demo data
    res.json({
      text: `# ERROR GENERATING ADVERTISEMENT

We encountered an error while generating your advertisement. Please try again later or check your API settings.

Error details: ${error.message}`,
      image: 'https://placehold.co/1024x1024.png?text=Error+Generating+Ad'
    });
  }
});

// Add a route to serve placeholder images based on metadata files
app.get('/placeholder-image/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Image not found');
    }
    
    // Read the metadata
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Redirect to the placeholder image URL
    res.redirect(metadata.placeholderUrl);
  } catch (error) {
    console.error('Error serving placeholder:', error);
    res.status(500).send('Error serving placeholder image');
  }
});

// Add direct route for corporate ads
app.post('/api/ads/corporate', async (req, res) => {
  try {
    const { 
      headline = "Unleash Your Potential",
      subheadline = "Elevate Your Game with Our Unmatched Excellence",
      callToAction = "Redefine Your Boundaries",
      colorPalette = "deep blue (#0A2463), white (#FFFFFF), black (#000000), silver (#C0C0C0)",
      targetAudience = "business professionals",
      outputType = 'both'
    } = req.body;
    
    let generatedAd = {};
    
    // Generate text with clean format
    if (outputType === 'text' || outputType === 'both') {
      const adText = `# ${headline}
## ${subheadline}

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ ${callToAction}`;
      
      generatedAd.text = adText;
    }
    
    // Generate image
    if (outputType === 'image' || outputType === 'both') {
      try {
        const prompt = `
          Create a professional, high-quality corporate advertisement for ${targetAudience}.
          
          Create a professional LinkedIn/corporate ad with:
          - Professional imagery of successful business people or modern office/tech environment
          - Clean typography with the headline "${headline}" prominently displayed
          - Supporting subheadline: "${subheadline}"
          - Corporate color scheme using ${colorPalette}
          - Balanced layout with clear visual hierarchy
          - Clean, visible CTA button reading "${callToAction}"
          - Modern, minimalist design that conveys innovation and excellence
          
          CRITICAL DESIGN REQUIREMENTS:
          1. Use clean, modern, and perfectly legible typography - no distorted or unusual fonts
          2. Ensure a balanced layout with proper spacing and alignment
          3. Use this specific color palette: ${colorPalette}
          4. Include a professional business/corporate imagery (people in business attire, modern office, technology)
          5. Feature a prominent, clearly styled call-to-action button with "${callToAction}"
          6. Ensure all text is perfectly readable and properly contrasted with backgrounds
          7. Create a design that conveys innovation, trust, and excellence
          8. Avoid ANY distortion, overlapping elements, or visual glitches
          9. Keep the design clean, professional and free of visual noise or clutter
          10. Follow corporate branding best practices throughout
        `;
        
        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-') === false) {
          throw new Error('No valid OpenAI API key found');
        }

        // Initialize OpenAI if needed
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        const response = await openai.createImage({
          prompt: prompt.substring(0, 1000),
          n: 1,
          size: "1024x1024",
          response_format: "url"
        });
        
        if (response.data && response.data.data && response.data.data[0] && response.data.data[0].url) {
          generatedAd.image = response.data.data[0].url;
        } else {
          throw new Error('Invalid response format from DALL-E API');
        }
      } catch (imageError) {
        console.error('Error generating corporate image:', imageError);
        generatedAd.image = 'https://placehold.co/1200x628/0A2463/FFFFFF?text=Professional+Corporate+Advertisement';
      }
    }
    
    res.json(generatedAd);
  } catch (error) {
    console.error('Error generating corporate ad:', error);
    res.json({ 
      text: `# Unleash Your Potential 
## Elevate Your Game with Our Unmatched Excellence

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ Redefine Your Boundaries`,
      image: 'https://placehold.co/1200x628/0A2463/FFFFFF?text=Professional+Corporate+Advertisement'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.send('AI Ad Generator API Server is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI API Key is ${process.env.OPENAI_API_KEY ? 'configured' : 'not configured'}`);
  console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
});

module.exports = app;
