import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, Button, Card, CardContent, FormControl, 
  InputLabel, MenuItem, Paper, Select, 
  TextField, Typography, CircularProgress, Divider,
  Alert, Snackbar
} from '@mui/material';
import { analyzeReferenceAd, generateAd } from '../api/adService';

interface AdGeneratorFormProps {
  setAnalysisResult: React.Dispatch<React.SetStateAction<any>>;
  setGeneratedAd: React.Dispatch<React.SetStateAction<any>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

const AdGeneratorForm: React.FC<AdGeneratorFormProps> = ({ 
  setAnalysisResult, 
  setGeneratedAd, 
  setLoading,
  loading
}) => {
  // State for reference ad
  const [referenceType, setReferenceType] = useState<'text' | 'image'>('text');
  const [referenceText, setReferenceText] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  
  // State for brand guidelines
  const [brandGuidelines, setBrandGuidelines] = useState('');
  
  // State for ad generation
  const [adFormat, setAdFormat] = useState('social-media');
  const [outputType, setOutputType] = useState<'text' | 'image' | 'both'>('both');
  const [adjustments, setAdjustments] = useState('');
  
  // Analysis result state
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisResult, setLocalAnalysisResult] = useState<any>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setReferenceImage(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  // Handle analyze submission
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setAnalyzed(false);
      setAnalysisResult(null);
      setLocalAnalysisResult(null);
      setGeneratedAd(null);
      setError(null);

      // Check if OpenAI key is set in the backend
      const formData = new FormData();
      
      if (referenceType === 'text') {
        formData.append('referenceText', referenceText);
      } else if (referenceImage) {
        formData.append('referenceAd', referenceImage);
      }
      
      formData.append('brandGuidelines', brandGuidelines);
      
      const result = await analyzeReferenceAd(formData);
      setAnalysisResult(result);
      setLocalAnalysisResult(result);
      setAnalyzed(true);
    } catch (error: any) {
      console.error('Error during analysis:', error);
      
      // Handle specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 401) {
          setError('API Key Error: Please add a valid OpenAI API key to the backend .env file.');
        } else {
          setError(`Server error: ${error.response.data.error || error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error: Could not connect to the server. Make sure the backend is running.');
      } else {
        // Something happened in setting up the request
        setError(`Error: ${error.message}`);
      }
      
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle generate submission
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setGeneratedAd(null);
      setError(null);
      
      const result = await generateAd(
        analysisResult,
        brandGuidelines,
        adFormat,
        adjustments,
        outputType
      );
      
      setGeneratedAd(result);
    } catch (error: any) {
      console.error('Error during generation:', error);
      
      // Handle specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 401) {
          setError('API Key Error: Please add a valid OpenAI API key to the backend .env file.');
        } else {
          setError(`Server error: ${error.response.data.error || error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error: Could not connect to the server. Make sure the backend is running.');
      } else {
        // Something happened in setting up the request
        setError(`Error: ${error.message}`);
      }
      
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle error alert close
  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Error Snackbar */}
        <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Box>
          <Typography variant="h5" gutterBottom>
            Step 1: Upload Reference Ad & Brand Guidelines
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Reference Type Selection */}
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reference Ad
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="reference-type-label">Reference Type</InputLabel>
                  <Select
                    labelId="reference-type-label"
                    value={referenceType}
                    label="Reference Type"
                    onChange={(e) => setReferenceType(e.target.value as 'text' | 'image')}
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                  </Select>
                </FormControl>
                
                {referenceType === 'text' ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    label="Paste your reference ad text"
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    margin="normal"
                  />
                ) : (
                  <Box 
                    {...getRootProps()} 
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      mt: 2,
                      mb: 2,
                      backgroundColor: isDragActive ? '#f0f8ff' : 'transparent'
                    }}
                  >
                    <input {...getInputProps()} />
                    {referenceImage ? (
                      <Box>
                        <Typography>Selected file: {referenceImage.name}</Typography>
                        <Box mt={2}>
                          <img 
                            src={URL.createObjectURL(referenceImage)} 
                            alt="Preview" 
                            style={{ maxWidth: '100%', maxHeight: '200px' }} 
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Typography>
                        {isDragActive ? 'Drop the image here' : 'Drag & drop a reference ad image, or click to select'}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
          
          {/* Brand Guidelines Input */}
          <Box sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Brand Guidelines
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  variant="outlined"
                  label="Enter brand guidelines (colors, tone, audience, etc.)"
                  value={brandGuidelines}
                  onChange={(e) => setBrandGuidelines(e.target.value)}
                  margin="normal"
                  placeholder="E.g., Colors: #ff5733, #33ff57; Tone: Professional but friendly; Target audience: Young professionals 25-35"
                />
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* API Key Message */}
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Before using this tool, make sure to add your OpenAI API key to the backend .env file.
            </Typography>
          </Alert>
        </Box>
        
        {/* Analyze Button */}
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={handleAnalyze}
            disabled={loading || (!referenceText && !referenceImage) || referenceType === 'text' && !referenceText}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Reference Ad'}
          </Button>
        </Box>
        
        {analyzed && (
          <>
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h5" gutterBottom>
                Step 2: Generate New Ad
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* Ad Format Selection */}
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id="format-label">Ad Format</InputLabel>
                  <Select
                    labelId="format-label"
                    value={adFormat}
                    label="Ad Format"
                    onChange={(e) => setAdFormat(e.target.value)}
                  >
                    <MenuItem value="social-media">Social Media Post</MenuItem>
                    <MenuItem value="banner">Banner Ad</MenuItem>
                    <MenuItem value="email">Email Campaign</MenuItem>
                    <MenuItem value="print">Print Ad</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Output Type Selection */}
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id="output-type-label">Output Type</InputLabel>
                  <Select
                    labelId="output-type-label"
                    value={outputType}
                    label="Output Type"
                    onChange={(e) => setOutputType(e.target.value as 'text' | 'image' | 'both')}
                  >
                    <MenuItem value="text">Text Only</MenuItem>
                    <MenuItem value="image">Image Only</MenuItem>
                    <MenuItem value="both">Both Text & Image</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Additional Adjustments */}
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Adjustments or Requests"
                  placeholder="E.g., Make it more playful, Shorten headline"
                  value={adjustments}
                  onChange={(e) => setAdjustments(e.target.value)}
                />
              </Box>
            </Box>
            
            {/* Generate Button */}
            <Box>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate New Ad'}
              </Button>
            </Box>

            {/* Generate Corporate Ad Button */}
            <Button 
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => {
                setLoading(true);
                // Create professional corporate ad with predefined format
                setTimeout(() => {
                  // Use a fixed, clean ad format that meets requirements
                  const professionalAd = {
                    text: `# Unleash Your Potential
## Elevate Your Game with Our Unmatched Excellence

Our commitment to innovation empowers you to achieve extraordinary results. We provide the tools, expertise, and support you need to transform challenges into opportunities and reach new heights of success.

→ Redefine Your Boundaries`,
                    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3"
                  };
                  setGeneratedAd(professionalAd);
                  setLoading(false);
                }, 500);
              }}
              disabled={loading}
              sx={{ mt: 2, mb: 2, width: { xs: '100%', md: 'auto' } }}
            >
              Generate Corporate Ad
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default AdGeneratorForm;