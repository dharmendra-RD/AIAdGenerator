const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

/**
 * Generate a placeholder advertisement image
 * @param {Object} analysis - Analysis results containing style information
 * @param {string} text - The ad text content to render
 * @param {string} adFormat - The format of the ad (facebook, instagram_story, twitter, linkedin, etc)
 * @param {string} adjustments - Any additional adjustments to make
 * @param {Object} options - Additional options for the ad (headline, subheadline, cta)
 * @returns {Promise<string>} - Filename of the generated image in the uploads folder
 */
async function generateAdImage(analysis, text, adFormat = 'facebook', adjustments = '', options = {}) {
  console.log(`Generating placeholder ad image for: 
    - Ad format: ${adFormat || 'undefined'}
    - Has analysis: ${analysis ? 'yes' : 'no'}`);
  
  try {
    // Extract headline from text for placeholder
    let headline = "Default Headline";
    if (text) {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        headline = lines[0].replace(/^#+ /, '').trim();
      }
    }
    
    // Create a filename for the placeholder
    const filename = `placeholderAd_${Date.now()}.txt`;
    const outputPath = path.join(uploadsDir, filename);
    
    // Write metadata to a file - we'll use this info to serve a placeholder image
    const metadata = {
      headline: headline,
      adFormat: adFormat,
      timestamp: new Date().toISOString(),
      placeholderUrl: `https://placehold.co/1200x628/336699/FFFFFF?text=${encodeURIComponent(headline)}`
    };
    
    // Write the metadata to a file
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`Created placeholder ad metadata at: ${outputPath}`);
    
    // Return the base filename
    return filename;
  } catch (error) {
    console.error('Error generating placeholder ad:', error);
    return null;
  }
}

module.exports = { generateAdImage }; 