import React, { useEffect, useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Alert, Paper, Typography, Button, Box } from '@mui/material';
import AdGeneratorHeader from './components/AdGeneratorHeader';
import AdGeneratorForm from './components/AdGeneratorForm';
import AdGeneratorResult from './components/AdGeneratorResult';
import { checkServerHealth, API_URL, bypassFetch } from './api/adService';
import './App.css';

// Define custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

function App() {
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [generatedAd, setGeneratedAd] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showSetupGuide, setShowSetupGuide] = React.useState<boolean>(true);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check server connection on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        setServerStatus('checking');
        console.log('Checking server health at:', `${API_URL}/health`);
        
        // Try a direct fetch first to diagnose CORS issues
        try {
          console.log('Trying direct fetch to http://localhost:5001/api/health');
          const directResponse = await fetch('http://localhost:5001/api/health', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors',
          });
          console.log('Direct fetch response:', directResponse.status, directResponse.statusText);
          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('Direct fetch data:', data);
            // If direct fetch works, we're good
            setServerStatus('online');
            setConnectionError(null);
            return;
          }
        } catch (directError) {
          console.error('Direct fetch failed:', directError);
        }
        
        // Try bypass fetch if direct fetch fails
        try {
          const bypassData = await bypassFetch('health');
          console.log('Bypass fetch data:', bypassData);
          setServerStatus('online');
          setConnectionError(null);
          return;
        } catch (bypassError) {
          console.error('Bypass fetch failed:', bypassError);
        }
        
        // Try a direct fetch to simple health endpoint
        try {
          console.log('Trying simple health check at http://localhost:5001/simple-health');
          const simpleResponse = await fetch('http://localhost:5001/simple-health');
          console.log('Simple health check response:', simpleResponse.status, simpleResponse.statusText);
          if (simpleResponse.ok) {
            const data = await simpleResponse.json();
            console.log('Simple health check data:', data);
            // If simple health check works, we're good
            setServerStatus('online');
            setConnectionError(null);
            return;
          }
        } catch (simpleError) {
          console.error('Simple health check failed:', simpleError);
        }
        
        // Try a direct fetch to root endpoint
        try {
          console.log('Trying root endpoint at http://localhost:5001/');
          const rootResponse = await fetch('http://localhost:5001/');
          console.log('Root endpoint response:', rootResponse.status, rootResponse.statusText);
          if (rootResponse.ok) {
            const text = await rootResponse.text();
            console.log('Root endpoint text:', text);
            // If root endpoint works, we're good
            setServerStatus('online');
            setConnectionError(null);
            return;
          }
        } catch (rootError) {
          console.error('Root endpoint check failed:', rootError);
        }
        
        // Try axios as last resort
        const health = await checkServerHealth();
        console.log('Axios health check:', health);
        setServerStatus('online');
        setConnectionError(null);
      } catch (error: any) {
        console.error('All server connection attempts failed:', error);
        setServerStatus('offline');
        setConnectionError(error.message);
      }
    };
    
    checkServer();
  }, []);

  const handleSkipSetup = () => {
    setShowSetupGuide(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" className="app-container">
        <AdGeneratorHeader />
        
        {/* Server connection alert */}
        {serverStatus === 'offline' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              <strong>Server Connection Error:</strong> We couldn't connect to the AI backend server.
            </Typography>
            <Typography variant="body2">
              Error details: {connectionError || 'Unknown error'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please make sure:
              <ul>
                <li>The backend server is running at http://localhost:5001</li>
                <li>There are no network/firewall issues blocking the connection</li>
                <li>CORS is properly configured on the server</li>
              </ul>
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </Button>
              <Button 
                variant="outlined" 
                color="info"
                onClick={() => window.open('http://localhost:5001/api/health', '_blank')}
              >
                Try API Health
              </Button>
              <Button 
                variant="outlined" 
                color="success"
                onClick={() => window.open('http://localhost:5001/simple-health', '_blank')}
              >
                Try Simple Health
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => window.open('http://localhost:5001/', '_blank')}
              >
                Try Root Endpoint
              </Button>
            </Box>
          </Alert>
        )}
        
        {serverStatus === 'checking' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              Connecting to AI backend server...
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="info"
                onClick={() => window.open('http://localhost:5001/api/health', '_blank')}
              >
                Test Direct Connection
              </Button>
              <Button 
                variant="outlined" 
                color="success"
                onClick={() => window.open('http://localhost:5001/simple-health', '_blank')}
              >
                Test Simple Endpoint
              </Button>
              <Button 
                variant="outlined" 
                color="warning"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5001/api/health');
                    const data = await response.json();
                    alert(`Server is online! Response: ${JSON.stringify(data)}`);
                  } catch (error) {
                    alert(`Connection failed: ${error}`);
                  }
                }}
              >
                Test Connection (Debug)
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => window.open('http://localhost:5001/', '_blank')}
              >
                Test Root Endpoint
              </Button>
            </Box>
          </Alert>
        )}
        
        {showSetupGuide && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Setup Guide
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                To use this application with real AI-generated content:
              </Typography>
              <ol>
                <li>Make sure both the backend and frontend servers are running</li>
                <li>Add your OpenAI API key to the <code>backend/.env</code> file</li>
                <li>The backend server should be running on port 5001</li>
              </ol>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Until then, you can explore using the demo data.
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSkipSetup}
                disabled={serverStatus === 'checking'}
              >
                Continue to App
              </Button>
            </Box>
          </Paper>
        )}
        
        {!showSetupGuide && (
          <>
            <AdGeneratorForm 
              setAnalysisResult={setAnalysisResult}
              setGeneratedAd={setGeneratedAd}
              setLoading={setLoading}
              loading={loading}
            />
            <AdGeneratorResult
              analysisResult={analysisResult}
              generatedAd={generatedAd}
              loading={loading}
            />
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;