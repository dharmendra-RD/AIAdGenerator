import axios from 'axios';

// Use direct address with exact port number
export const API_URL = 'http://localhost:5001/api';

export interface BrandGuidelines {
  colors?: string[];
  tone?: string;
  targetAudience?: string;
  additionalInfo?: string;
}

export interface AdFormat {
  type: string;
  platform?: string;
  dimensions?: string;
}

// Analyze a reference ad
export const analyzeReferenceAd = async (
  referenceData: FormData
): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/ads/analyze`, referenceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      withCredentials: false,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error analyzing reference ad:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`Server error: ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error: Could not connect to the server');
    } else {
      // Something happened in setting up the request
      throw new Error(`Error: ${error.message}`);
    }
  }
};

// Generate a new ad based on analysis and guidelines
export const generateAd = async (
  analysisResult: any,
  brandGuidelines: string,
  adFormat: string,
  adjustments: string,
  outputType: 'text' | 'image' | 'both'
): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/ads/generate`, {
      analysis: analysisResult,
      brandGuidelines,
      adFormat,
      adjustments,
      outputType,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error generating ad:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`Server error: ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error: Could not connect to the server');
    } else {
      // Something happened in setting up the request
      throw new Error(`Error: ${error.message}`);
    }
  }
};

// Health check to test connection to the server
export const checkServerHealth = async (): Promise<any> => {
  try {
    // Try first with fetch
    try {
      const fetchResponse = await fetch('http://localhost:5001/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors', // This is important for CORS requests
      });
      
      if (fetchResponse.ok) {
        return await fetchResponse.json();
      }
    } catch (fetchError) {
      console.error('Fetch health check failed:', fetchError);
    }
    
    // If fetch fails, try with axios as fallback
    const response = await axios.get(`${API_URL}/health`, {
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: false,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error checking server health:', error);
    throw new Error(`Server connection error: ${error.message}`);
  }
};

// Bypass function using native fetch (sometimes works when axios fails with CORS)
export const bypassFetch = async (endpoint: string): Promise<any> => {
  try {
    // Remove any leading slash from the endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Make a direct request to the server without going through API_URL
    const response = await fetch(`http://localhost:5001/api/${cleanEndpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors', // This is important for CORS requests
    });
    
    console.log(`Direct fetch to http://localhost:5001/api/${cleanEndpoint}:`, response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error(`Error with bypass fetch to ${endpoint}:`, error);
    throw error;
  }
}; 