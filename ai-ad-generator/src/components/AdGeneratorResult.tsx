import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, Divider, Paper, Typography, Alert } from '@mui/material';

interface AdGeneratorResultProps {
  analysisResult: any;
  generatedAd: any;
  loading: boolean;
}

// Demo data for when API is not available
const DEMO_ANALYSIS = {
  messagingStyle: "Direct and conversational",
  toneOfVoice: "Friendly and professional",
  targetDemographic: "Young professionals, 25-40 years old",
  keySellingPoints: [
    "Quality and craftsmanship",
    "Unique design",
    "Sustainable materials"
  ],
  callToActionStyle: "Strong and action-oriented",
  brandPersonalityTraits: [
    "Trustworthy",
    "Innovative",
    "Eco-conscious"
  ]
};

const DEMO_GENERATED_AD = {
  text: `# ELEVATE YOUR SPACE WITH SUSTAINABLE STYLE

Discover our new collection of handcrafted furniture designed for the modern eco-conscious professional.

Our pieces don't just transform rooms - they tell stories. Each item is meticulously crafted from sustainable materials, bringing unique character and responsible luxury to your home or office.

**Why settle for mass-produced when you can own something truly special?**

→ SHOP THE COLLECTION NOW | Free delivery on orders over $500`,
  image: "https://placehold.co/1024x1024.png?text=Generated+Ad+Image"
};

const AdGeneratorResult: React.FC<AdGeneratorResultProps> = ({
  analysisResult,
  generatedAd,
  loading,
}) => {
  // Check if we should use demo data
  const isDemo = !analysisResult && !generatedAd && !loading;
  const displayAnalysis = analysisResult || (isDemo ? DEMO_ANALYSIS : null);
  const displayGeneratedAd = generatedAd || (isDemo ? DEMO_GENERATED_AD : null);
  const [parsedTextContent, setParsedTextContent] = useState<{ 
    headline: string;
    subheadline: string;
    mainCopy: string;
    callToAction: string;
    layoutDescription: string;
  } | null>(null);

  // Parse text content when it changes
  useEffect(() => {
    if (displayGeneratedAd?.text) {
      const parseAdText = (text: string) => {
        // First, clean up any potential metadata or formatting issues
        const cleanedText = text
          .replace(/\[.*?\]/g, '') // Remove any remaining bracketed text
          .replace(/\bheadline:/gi, '')
          .replace(/\bsubheadline:/gi, '')
          .replace(/\bmain copy:/gi, '')
          .replace(/\bcall to action:/gi, '')
          .replace(/\bcta:/gi, '')
          .replace(/\badvertisement layout description:/gi, '')
          .replace(/\bsubject:/gi, '')
          .replace(/\[image:.*?\]/gi, '')
          .replace(/\[main copy\]/gi, '')
          .replace(/\[footer text\]/gi, '')
          .replace(/\[brand logo.*?\]/gi, '');

        const lines = cleanedText.split('\n').filter(line => line.trim());
        
        // Initialize content sections
        let headline = '';
        let subheadline = '';
        let mainCopy = '';
        let callToAction = '';
        let layoutDescription = '';
        
        // Keep track of current parsing section
        let currentSection = 'unknown';
        let descriptionStarted = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip separator lines with just dashes
          if (/^[-]+$/.test(line)) {
            continue;
          }
          
          // Check for headlines (# or ## syntax)
          if (line.startsWith('# ') || line.startsWith('#')) {
            headline = line.replace(/^#+\s*/, '');
            currentSection = 'headline';
            continue;
          } 
          
          // Check for subheadlines (## syntax)
          if (line.startsWith('## ') || (currentSection === 'headline' && !subheadline)) {
            subheadline = line.replace(/^#+\s*/, '');
            currentSection = 'subheadline';
            continue;
          }
          
          // Check for call to action (often starts with → or similar)
          if (line.includes('→') || 
              line.toLowerCase().includes('shop now') || 
              line.toLowerCase().includes('buy now') || 
              line.toLowerCase().includes('click here') ||
              line.toLowerCase().includes('learn more today') ||
              (line.toLowerCase().includes('call') && line.toLowerCase().includes('today')) ||
              (line.toLowerCase().includes('join') && line.toLowerCase().includes('now'))) {
            callToAction = line;
            currentSection = 'cta';
            continue;
          }
          
          // Check for layout description markers
          if (line.toLowerCase().includes('layout description') || 
              line.toLowerCase().includes('advertisement layout') ||
              line.toLowerCase().includes('note:') || 
              line.toLowerCase().includes('design note')) {
            descriptionStarted = true;
            layoutDescription += line + '\n';
            currentSection = 'layout';
            continue;
          } 
          
          // Continue adding to layout description if we're in that section
          if (descriptionStarted || 
              currentSection === 'layout' || 
              line.toLowerCase().includes('the minimalist ad features') ||
              line.toLowerCase().includes('remember to use')) {
            layoutDescription += line + '\n';
            currentSection = 'layout';
            continue;
          }
          
          // Handle main copy - everything else that doesn't fit above categories
          if (currentSection !== 'layout' && currentSection !== 'cta') {
            mainCopy += line + '\n';
          }
        }
        
        return {
          headline: headline.trim(),
          subheadline: subheadline.trim(),
          mainCopy: mainCopy.trim(),
          callToAction: callToAction.trim(),
          layoutDescription: layoutDescription.trim()
        };
      };
      
      setParsedTextContent(parseAdText(displayGeneratedAd.text));
    } else {
      setParsedTextContent(null);
    }
  }, [displayGeneratedAd]);

  const renderAnalysisResult = () => {
    if (!displayAnalysis) return null;

    return (
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {isDemo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This is demo data. Add your OpenAI API key to see real results.
              </Typography>
            </Alert>
          )}
          
          {Object.entries(displayAnalysis).map(([key, value]: [string, any]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
              <Typography variant="body1">
                {Array.isArray(value) ? value.join(', ') : (typeof value === 'object' ? JSON.stringify(value) : value)}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderGeneratedAd = () => {
    if (!displayGeneratedAd) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generated Advertisement
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {isDemo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This is demo data. Add your OpenAI API key to see real results.
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            {displayGeneratedAd.text && (
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Text Content
                </Typography>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 1 }}>
                  {parsedTextContent ? (
                    <>
                      {parsedTextContent.headline && (
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Headline:
                          </Typography>
                          <Typography variant="h6">
                            {parsedTextContent.headline}
                          </Typography>
                        </Box>
                      )}
                      
                      {parsedTextContent.subheadline && (
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Subheadline:
                          </Typography>
                          <Typography variant="subtitle2">
                            {parsedTextContent.subheadline}
                          </Typography>
                        </Box>
                      )}
                      
                      {parsedTextContent.mainCopy && (
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Main Copy:
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {parsedTextContent.mainCopy}
                          </Typography>
                        </Box>
                      )}
                      
                      {parsedTextContent.callToAction && (
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Call to Action:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {parsedTextContent.callToAction}
                          </Typography>
                        </Box>
                      )}
                      
                      {parsedTextContent.layoutDescription && (
                        <Box mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Advertisement Layout Description:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {parsedTextContent.layoutDescription}
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: displayGeneratedAd.text.replace(/\n/g, '<br/>') }}
                    />
                  )}
                </Paper>
              </Box>
            )}
            
            {displayGeneratedAd.image && (
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Visual Content
                </Typography>
                <Box sx={{ 
                  mt: 1, 
                  textAlign: 'center', 
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  padding: '8px',
                  backgroundColor: '#fff'
                }}>
                  <img 
                    src={displayGeneratedAd.image} 
                    alt="Generated advertisement" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '500px',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                    onError={(e) => {
                      // Fallback to a placeholder if the image fails to load
                      console.error('Image failed to load:', displayGeneratedAd.image);
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = `https://placehold.co/1200x628/336699/FFFFFF?text=${encodeURIComponent('Professional Advertisement (Image Failed to Load)')}`;
                      
                      // Add some explanation text
                      const parent = target.parentElement;
                      if (parent) {
                        const errorMsg = document.createElement('div');
                        errorMsg.style.color = 'red';
                        errorMsg.style.marginTop = '10px';
                        errorMsg.style.fontSize = '14px';
                        errorMsg.innerText = 'The advertisement image failed to load. This might be due to temporary OpenAI service limitations or network issues.';
                        parent.appendChild(errorMsg);
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {analysisResult ? 'Generating Ad...' : 'Analyzing Reference Ad...'}
        </Typography>
      </Paper>
    );
  }

  // If nothing to display and not in demo mode, don't render anything
  if (!displayAnalysis && !displayGeneratedAd) return null;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {isDemo ? 'Demo Results' : 'Results'}
      </Typography>
      
      {renderAnalysisResult()}
      {renderGeneratedAd()}
    </Paper>
  );
};

export default AdGeneratorResult; 