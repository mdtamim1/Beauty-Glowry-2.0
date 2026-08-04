import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Extract mimeType and base64 payload
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback simulated response if API key is not present
    if (!apiKey) {
      console.warn('[SkinAnalyzer API] GEMINI_API_KEY is not defined. Using simulation fallback.');
      
      // Artificial delay to simulate scanning
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResponse = {
        analysis: {
          acne: { score: 35, description: 'Mild congestion visible on cheeks and chin area.', coords: [35, 52] },
          darkSpots: { score: 15, description: 'Slight hyperpigmentation spots around the cheekbones.', coords: [68, 42] },
          oiliness: { score: 75, description: 'High sebum activity in the T-Zone (forehead and nose).', coords: [50, 22] },
          redness: { score: 40, description: 'Moderate sensitivity and redness on the nasal wings and cheeks.', coords: [42, 45] },
          fineLines: { score: 10, description: 'Very fine dehydration lines around the eye contours.', coords: [58, 32] },
          pores: { score: 60, description: 'Enlarged and slightly clogged pores visible on the nose.', coords: [51, 38] },
          hydration: { score: 55, description: 'Skin moisture levels are low-moderate, indicating mild dehydration.', coords: [55, 65] },
          darkCircles: { score: 45, description: 'Moderate dark circles and fatigue shadows under both eyes.', coords: [50, 34] },
          barrier: { score: 70, description: 'Skin barrier is intact but shows signs of mild irritation.', coords: [44, 48] }
        },
        overallRating: 68,
        overallComment: 'Your skin is generally healthy but exhibits high oil production in the T-Zone accompanied by mild acne congestion and dehydration. Focusing on hydration while regulating sebum with gentle chemical exfoliants will help balance your complexion.',
        routineRecommendations: {
          am: ['Cleansers & Washes', 'Toners & Essences', 'Sun Protection'],
          pm: ['Cleansers & Washes', 'Serums & Elixirs', 'Moisturizers & Creams']
        }
      };

      return NextResponse.json(mockResponse);
    }

    // Call real Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `You are a professional clinical dermatologist AI.
First, verify if the image contains a clear human face. If the image does not contain a human face, or if the face is not clearly visible, you MUST return a JSON object containing ONLY the field "error" explaining the problem:
{
  "error": "No clear human face detected. Please upload or capture a front-facing selfie of your face."
}

If a human face is present, analyze the face and diagnose these skin concerns: Acne, Dark spots, Oiliness, Redness, Fine lines, Pores visibility, Skin Hydration, Dark Circles, and Skin Barrier.

For each skin concern, provide:
1. A severity score (0 to 100).
2. A short description of your findings.
3. Relative coordinates [x, y] (both integers between 0 and 100, where [0, 0] is left/top and [100, 100] is right/bottom) indicating where on the image this concern is visible, so the UI can draw pointers. For example, if oiliness is visible on the forehead, the coordinate might be [50, 20]. If no concerns are found for that category, return null for coords.

Also, recommend an AM and PM routine using general product categories: 'Cleansers & Washes', 'Toners & Essences', 'Serums & Elixirs', 'Moisturizers & Creams', 'Sun Protection'.

You MUST return the response ONLY as a minified JSON object matching this schema:
{
  "analysis": {
    "acne": { "score": number, "description": string, "coords": [number, number] | null },
    "darkSpots": { "score": number, "description": string, "coords": [number, number] | null },
    "oiliness": { "score": number, "description": string, "coords": [number, number] | null },
    "redness": { "score": number, "description": string, "coords": [number, number] | null },
    "fineLines": { "score": number, "description": string, "coords": [number, number] | null },
    "pores": { "score": number, "description": string, "coords": [number, number] | null },
    "hydration": { "score": number, "description": string, "coords": [number, number] | null },
    "darkCircles": { "score": number, "description": string, "coords": [number, number] | null },
    "barrier": { "score": number, "description": string, "coords": [number, number] | null }
  },
  "overallRating": number,
  "overallComment": string,
  "routineRecommendations": {
    "am": string[],
    "pm": string[]
  }
}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API call failed');
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Empty response from AI model');
    }

    // Parse the JSON output from Gemini
    const resultJson = JSON.parse(textResult.trim());
    if (resultJson.error) {
      return NextResponse.json({ error: resultJson.error }, { status: 400 });
    }
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('SkinAnalyzer API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
