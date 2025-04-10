/**
 * Ad Format Test Script
 * 
 * This script tests the ad generation with different formats and custom text content.
 */
const { generateAdImage } = require('./imageGenerator');

// Mock analysis object with color palette
const mockAnalysis = {
  colorPalette: ['#2C5282', '#FFFFFF', '#F56565'],
  messagingStyle: "Direct and conversational",
  toneOfVoice: "Professional yet approachable"
};

// Test scenarios with different formats and content
const testScenarios = [
  {
    name: "Facebook Ad",
    format: "facebook",
    options: {
      headline: "Transform Your Home Office",
      subheadline: "Premium furniture for the modern professional",
      cta: "Shop the Collection →"
    }
  },
  {
    name: "Instagram Story",
    format: "instagram_story",
    options: {
      headline: "Summer Sale",
      subheadline: "Up to 50% off all items",
      cta: "Shop Now →"
    }
  },
  {
    name: "LinkedIn Post",
    format: "linkedin",
    options: {
      headline: "Build Your Career With Us",
      subheadline: "Join our growing team of experts",
      cta: "Apply Today →"
    }
  },
  {
    name: "Twitter Post",
    format: "twitter",
    options: {
      headline: "Breaking News",
      subheadline: "Our new product just launched",
      cta: "Learn More →"
    }
  },
  {
    name: "Error Test - Missing Content",
    format: "facebook",
    options: {} // Empty options to test error handling
  }
];

// Run all tests
async function runTests() {
  console.log('Starting ad format tests...');
  
  for (const test of testScenarios) {
    console.log(`\nGenerating ${test.name}...`);
    
    try {
      const imagePath = await generateAdImage(
        mockAnalysis,
        "", // Empty text to test options-based generation
        test.format,
        "Test adjustment",
        test.options
      );
      
      console.log(`✅ Success! Image saved to: ${imagePath}`);
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(console.error); 