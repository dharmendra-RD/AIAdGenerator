const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// Analyze reference ad to extract key elements
router.post('/analyze', upload.single('referenceAd'), async (req, res) => {
  try {
    const { brandGuidelines } = req.body;
    let analysisPrompt = '';
    let result = null;

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

      result = await analyzeTextWithAI(analysisPrompt);
    }
    // Handle image reference
    else if (req.file) {
      // Convert image to base64
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      
      result = await analyzeImageWithAI(base64Image, brandGuidelines);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
    } else {
      return res.status(400).json({ error: 'Please provide either reference text or an image' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing reference ad:', error);
    res.status(500).json({ error: 'Failed to analyze the reference ad' });
  }
});

// Generate new ad based on analysis and brand guidelines
router.post('/generate', async (req, res) => {
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

    let generatedAd;
    
    if (outputType === 'text' || outputType === 'both') {
      const textAd = await generateTextAd(analysis, brandGuidelines, adFormat, adjustments);
      generatedAd = { text: textAd };
    }
    
    if (outputType === 'image' || outputType === 'both') {
      const imageAd = await generateImageAd(analysis, brandGuidelines, adFormat, adjustments);
      generatedAd = { ...generatedAd, image: imageAd };
    }

    res.json(generatedAd);
  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({ error: 'Failed to generate the ad' });
  }
});

// Special endpoint for corporate-style ads with minimal metadata
router.post('/generate-corporate', async (req, res) => {
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

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt.substring(0, 975),
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "vivid",
          response_format: "url",
        });
        
        if (response.data && response.data[0] && response.data[0].url) {
          generatedAd.image = response.data[0].url;
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
    res.status(500).json({ 
      error: 'Failed to generate corporate ad',
      text: `# Unleash Your Potential 
## Elevate Your Game with Our Unmatched Excellence

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ Redefine Your Boundaries`,
      image: 'https://placehold.co/1200x628/0A2463/FFFFFF?text=Professional+Corporate+Advertisement'
    });
  }
});

// Helper functions
async function analyzeTextWithAI(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert advertising analyst. Extract key elements from ads and return them in JSON format." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to analyze text with AI');
  }
}

async function analyzeImageWithAI(base64Image, brandGuidelines) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert advertising analyst. Analyze this ad image and extract key elements in JSON format."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this advertisement image. Brand guidelines: "${brandGuidelines || 'Not provided'}". Extract and provide the following elements in JSON format: 1. Color palette (hex codes), 2. Layout structure, 3. Visual style, 4. Text positioning, 5. Brand elements, 6. Overall mood/tone`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    throw new Error('Failed to analyze image with AI');
  }
}

async function generateTextAd(analysis, brandGuidelines, adFormat, adjustments) {
  try {
    // Extract default headline and subheadline if provided in brand guidelines
    let defaultHeadline = "Unleash Your Potential";
    let defaultSubheadline = "Elevate Your Game with Our Unmatched Excellence";
    let defaultCTA = "Redefine Your Boundaries";
    
    if (brandGuidelines) {
      // Extract headline if provided
      const headlineMatch = brandGuidelines.match(/headline:?\s*["']([^"']+)["']/i);
      if (headlineMatch && headlineMatch[1]) {
        defaultHeadline = headlineMatch[1];
      }
      
      // Extract subheadline if provided
      const subheadlineMatch = brandGuidelines.match(/subheadline:?\s*["']([^"']+)["']/i);
      if (subheadlineMatch && subheadlineMatch[1]) {
        defaultSubheadline = subheadlineMatch[1];
      }
      
      // Extract CTA if provided
      const ctaMatch = brandGuidelines.match(/cta:?\s*["']([^"']+)["']/i);
      if (ctaMatch && ctaMatch[1]) {
        defaultCTA = ctaMatch[1];
      }
    }
    
    // Create a very focused prompt
    const prompt = `
      Create a professional advertisement with this exact structure:
      
      1. A headline: "${defaultHeadline}"
      2. A subheadline: "${defaultSubheadline}"
      3. One or two paragraphs of compelling body copy that emphasizes excellence, innovation, and leadership
      4. A call to action: "${defaultCTA}"
      
      Target audience: ${analysis?.targetDemographic || "business professionals"}
      Key selling points: ${Array.isArray(analysis?.keySellingPoints) ? analysis.keySellingPoints.join(", ") : "innovation, excellence, leadership"}
      Brand personality: ${Array.isArray(analysis?.brandPersonalityTraits) ? analysis.brandPersonalityTraits.join(", ") : "innovative, trustworthy, excellence"}
      
      CRITICAL: Format your response with ONLY the following, exactly as shown:
      
      # [headline text]
      ## [subheadline text]
      
      [body copy]
      
      → [call to action]
      
      DO NOT include numbers, labels, notes, descriptions, or any text except the actual ad content.
      DO NOT include any text about design, layout, imagery, or formatting.
      DO NOT include any text in square brackets - replace them with the actual content.
      Keep your response concise and focused.
    `;
    
    // Get the raw completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a professional copywriter who creates ONLY clean ad copy with no metadata. You always follow formatting instructions exactly."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5 // Lower temperature for more consistent formatting
    });
    
    // Get text and do basic cleanup
    let adText = completion.choices[0].message.content.trim();
    
    // If the model fails to follow instructions, create default content
    if (!adText.includes('#') || adText.includes('[') || 
        adText.includes('layout') || adText.includes('design') || 
        adText.includes('image') || adText.includes('aesthetic') ||
        adText.includes('1.') || adText.includes('2.') || 
        adText.includes('headline:') || adText.includes('subheadline:') ||
        adText.includes('main copy:') || adText.includes('call to action:')) {
      
      // Create default formatted ad copy instead
      return `# ${defaultHeadline}
## ${defaultSubheadline}

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ ${defaultCTA}`;
    }
    
    return adText;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return clean default copy in case of error
    return `# Unleash Your Potential
## Elevate Your Game with Our Unmatched Excellence

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ Redefine Your Boundaries`;
  }
}

async function generateImageAd(analysis, brandGuidelines, adFormat, adjustments) {
  try {
    // Extract the color palette from analysis or use professional corporate colors
    let colorPalette = "deep blue (#0A2463), white (#FFFFFF), black (#000000), silver (#C0C0C0)";
    if (analysis && analysis.colorPalette && Array.isArray(analysis.colorPalette)) {
      colorPalette = analysis.colorPalette.join(", ");
    }
    
    // Extract key branding elements and messaging
    const messagingStyle = analysis?.messagingStyle || "professional and aspirational";
    const toneOfVoice = analysis?.toneOfVoice || "confident and authoritative";
    const targetDemographic = analysis?.targetDemographic || "business professionals";
    const brandTraits = analysis?.brandPersonalityTraits || ["innovative", "trustworthy", "excellence"];
    
    // Construct a headline from the brand guidelines or use default
    let headline = "Unleash Your Potential";
    let subheadline = "Elevate Your Game with Our Unmatched Excellence";
    let ctaText = "Get Started";
    
    // Check if brandGuidelines contains headline information
    if (brandGuidelines) {
      if (brandGuidelines.toLowerCase().includes("headline:")) {
        const headlineMatch = brandGuidelines.match(/headline:\s*"([^"]+)"/i);
        if (headlineMatch && headlineMatch[1]) {
          headline = headlineMatch[1];
        }
      }
      
      if (brandGuidelines.toLowerCase().includes("subheadline:")) {
        const subheadlineMatch = brandGuidelines.match(/subheadline:\s*"([^"]+)"/i);
        if (subheadlineMatch && subheadlineMatch[1]) {
          subheadline = subheadlineMatch[1];
        }
      }
      
      if (brandGuidelines.toLowerCase().includes("cta:")) {
        const ctaMatch = brandGuidelines.match(/cta:\s*"([^"]+)"/i);
        if (ctaMatch && ctaMatch[1]) {
          ctaText = ctaMatch[1];
        }
      } else if (brandGuidelines.toLowerCase().includes("call to action:")) {
        const ctaMatch = brandGuidelines.match(/call to action:\s*"([^"]+)"/i);
        if (ctaMatch && ctaMatch[1]) {
          ctaText = ctaMatch[1];
        }
      }
    }
    
    // Alternative CTA if specified in adjustments
    if (adjustments && adjustments.toLowerCase().includes("cta:")) {
      const ctaMatch = adjustments.match(/cta:\s*"([^"]+)"/i);
      if (ctaMatch && ctaMatch[1]) {
        ctaText = ctaMatch[1];
      }
    } else if (adjustments && adjustments.toLowerCase().includes("redefine your boundaries")) {
      ctaText = "Redefine Your Boundaries";
    }
    
    // Build format-specific layout instructions
    let formatSpecificInstructions = "";
    
    if (adFormat.includes("linkedin") || adFormat.includes("corporate") || adFormat.includes("professional")) {
      formatSpecificInstructions = `
        Create a professional LinkedIn/corporate ad with:
        - Professional imagery of successful business people or modern office/tech environment
        - Clean typography with the headline "${headline}" prominently displayed
        - Supporting subheadline: "${subheadline}"
        - Corporate color scheme using ${colorPalette}
        - Balanced layout with clear visual hierarchy
        - Clean, visible CTA button reading "${ctaText}"
        - Modern, minimalist design that conveys innovation and excellence
      `;
    } else if (adFormat.includes("facebook") || adFormat.includes("social")) {
      formatSpecificInstructions = `
        Create a professional social media ad with:
        - Compelling visual showing innovative technology or successful professionals
        - Clean, modern font displaying the headline "${headline}"
        - Supporting text: "${subheadline}"
        - Color palette using ${colorPalette}
        - Professional layout with proper spacing and alignment
        - Clear CTA button with "${ctaText}"
        - Overall feeling of innovation, trust, and corporate excellence
      `;
    } else if (adFormat.includes("banner") || adFormat.includes("display")) {
      formatSpecificInstructions = `
        Create a professional display banner ad with:
        - Clean, horizontal layout with proper visual flow
        - Corporate imagery on one side (tech, innovation, or professional theme)
        - Main headline "${headline}" in clean, modern font
        - Brief supporting text if space allows
        - Corporate color scheme using ${colorPalette}
        - Prominent CTA button with "${ctaText}"
        - Professional, corporate aesthetic throughout
      `;
    } else {
      formatSpecificInstructions = `
        Create a professional advertisement for corporate/business audience with:
        - Professional imagery related to innovation, technology, or business excellence
        - Clean, modern typography with headline "${headline}"
        - Supporting subheadline: "${subheadline}"
        - Corporate color scheme using ${colorPalette}
        - Balanced layout with clear visual hierarchy
        - Prominent CTA button reading "${ctaText}"
        - Overall professional and corporate aesthetic
      `;
    }
    
    // Construct a detailed prompt focused on corporate/professional design
    const prompt = `
      Create a professional, high-quality corporate advertisement targeting ${targetDemographic}.
      
      ${formatSpecificInstructions}
      
      CRITICAL DESIGN REQUIREMENTS:
      1. Use clean, modern, and perfectly legible typography - no distorted or unusual fonts
      2. Ensure a balanced layout with proper spacing and alignment
      3. Use this specific color palette: ${colorPalette}
      4. Include a professional business/corporate imagery (people in business attire, modern office, technology, or abstract representations of innovation)
      5. Feature a prominent, clearly styled call-to-action button with "${ctaText}"
      6. Ensure all text is perfectly readable and properly contrasted with backgrounds
      7. Create a design that conveys innovation, trust, and excellence
      8. Avoid ANY distortion, overlapping elements, or visual glitches
      9. Keep the design clean, professional and free of visual noise or clutter
      10. Follow corporate branding best practices throughout
      
      Additional specifications:
      - Messaging style: ${messagingStyle}
      - Tone: ${toneOfVoice}
      - Brand personality: ${Array.isArray(brandTraits) ? brandTraits.join(", ") : brandTraits}
      ${adjustments ? `- Additional adjustments: ${adjustments}` : ''}
    `;

    // Trim to fit DALL-E's limit while keeping all critical instructions
    const trimmedPrompt = prompt.substring(0, 975);

    // Use DALL-E's highest quality settings for professional results
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: trimmedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid", // More photorealistic style for corporate imagery
      response_format: "url",
    });

    // Validate the response
    if (!response.data || !response.data[0] || !response.data[0].url) {
      console.error('Invalid response from DALL-E API:', response);
      throw new Error('Failed to generate image ad - invalid response');
    }

    return response.data[0].url;
  } catch (error) {
    console.error('OpenAI Image API error:', error);
    
    // Corporate-styled placeholder as fallback
    return 'https://placehold.co/1200x628/0A2463/FFFFFF?text=Professional+Corporate+Advertisement';
  }
}

module.exports = router;
