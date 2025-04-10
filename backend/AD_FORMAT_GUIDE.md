# Ad Format Guide

This guide explains the dynamic ad generation system and how to use different formats and custom content.

## Supported Ad Formats

The system now supports the following ad formats, each with appropriate dimensions and layouts:

| Format Name | Dimensions | Orientation | Use Case |
|-------------|------------|-------------|----------|
| facebook | 1200 × 628 | Landscape | Facebook feed ads |
| instagram | 1080 × 1080 | Square | Instagram feed posts |
| instagram_story | 1080 × 1920 | Portrait | Instagram stories |
| twitter | 1200 × 675 | Landscape | Twitter posts |
| linkedin | 1200 × 627 | Landscape | LinkedIn posts |
| pinterest | 1000 × 1500 | Portrait | Pinterest pins |
| display_ad | 1200 × 900 | Landscape | Web display ads |
| email_header | 600 × 300 | Landscape | Email marketing headers |
| youtube | 1280 × 720 | Landscape | YouTube thumbnails |
| default | 1200 × 1200 | Square | Fallback option |

## Using the API

### Endpoint

```
POST /api/ads/generate
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| analysis | Object | Analysis results from reference ad |
| brandGuidelines | String | Brand guidelines text |
| adFormat | String | Format of the ad (see table above) |
| adjustments | String | Additional adjustments to make |
| outputType | String | 'text', 'image', or 'both' |
| headline | String | Custom headline (optional) |
| subheadline | String | Custom subheadline (optional) |
| cta | String | Custom call-to-action (optional) |

### Example Request Body

```json
{
  "analysis": {
    "colorPalette": ["#2C5282", "#FFFFFF", "#F56565"],
    "messagingStyle": "Direct and conversational",
    "toneOfVoice": "Professional yet approachable"
  },
  "brandGuidelines": "Modern, professional aesthetic targeting tech professionals",
  "adFormat": "linkedin",
  "adjustments": "Emphasize ROI and productivity benefits",
  "outputType": "both",
  "headline": "Boost Your Team's Productivity",
  "subheadline": "Our software solutions increase efficiency by 35%",
  "cta": "Schedule a Demo →"
}
```

### Response Structure

```json
{
  "text": "# Headline\n\nBody text...\n\nCTA →",
  "image": "http://localhost:5001/images/ad-linkedin-1624901234567.png"
}
```

## Image Generation Logic

The ad image generation system now:

1. **Determines dimensions** based on the selected ad format
2. **Adapts layouts** specifically for portrait, landscape, or square orientations
3. **Uses custom content** when provided (headline, subheadline, CTA)
4. **Falls back gracefully** to AI-generated or default content when needed
5. **Scales elements** proportionally to the dimensions of the ad
6. **Positions elements** appropriately based on the ad format
7. **Adds variation** through randomization to ensure ads are unique

## Testing

A test script (`testAdFormats.js`) is provided to generate examples of each ad format. Run it with:

```
node testAdFormats.js
```

This will generate sample images in the `uploads` directory.

## Troubleshooting

If you encounter issues:

1. Check the format name is correct (must match one of the supported formats)
2. Ensure required parameters are provided (analysis and adFormat are required)
3. Check server logs for detailed error messages
4. Verify the canvas library is properly installed for your system architecture 