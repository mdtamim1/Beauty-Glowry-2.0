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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `You are a board-certified clinical dermatologist AI with expertise in skin imaging analysis.

STEP 1 — FACE DETECTION:
First, verify if the image contains a clear, well-lit, front-facing human face. If not, return ONLY:
{ "error": "No clear human face detected. Please upload a front-facing selfie in good lighting." }

STEP 2 — DETAILED SKIN ANALYSIS:
If a human face is present, carefully analyze the actual visible skin in the photo. Do NOT guess or hallucinate — only report what you can genuinely observe.

Analyze these 9 skin concerns based on what is ACTUALLY visible in the image:
1. Acne (ব্রণ) — Visible pimples, pustules, papules, comedones, active breakouts
2. Dark Spots (মেছতা) — Hyperpigmentation, post-acne marks, uneven skin tone patches
3. Oiliness (তৈলাক্ততা) — Sebum shine, greasy T-zone appearance
4. Redness (লালচে ভাব) — Erythema, irritation, rosacea signs
5. Fine Lines (বলিরেখা) — Wrinkles around eyes, forehead, smile lines
6. Pores Visibility (রোমকূপ) — Visibly enlarged or congested pores
7. Skin Hydration (আর্দ্রতা) — Plumpness vs dryness/flakiness (higher score = better hydrated)
8. Dark Circles (ডার্ক সার্কেল) — Periorbital dark pigmentation or puffiness
9. Skin Barrier (ব্যারিয়ার) — Overall skin health, sensitivity, integrity (higher score = healthier)

SCORING RULES — BE ACCURATE, NOT GENEROUS:
- Score 0-15: Excellent / Not detectable
- Score 16-35: Very mild / Barely noticeable
- Score 36-55: Mild to moderate
- Score 56-75: Moderate / Clearly visible
- Score 76-100: Severe / Prominent
- For NEGATIVE concerns (Acne, Dark Spots, Oiliness, Redness, Fine Lines, Pores, Dark Circles): Higher score = WORSE condition
- For POSITIVE concerns (Hydration, Barrier): Higher score = BETTER condition
- If the skin in the photo looks genuinely clear and healthy — give low scores for negative concerns. Do NOT inflate scores.
- If the skin shows real issues — accurately reflect the severity. Do NOT downplay.

SKIN TYPE DETECTION:
Based on your analysis, determine the primary skin type:
- "Oily" if oiliness score > 60
- "Dry" if hydration score < 40
- "Combination" if oiliness > 50 and some dry patches
- "Normal" if balanced
- "Sensitive" if redness > 50 or barrier < 40

CONCERN TAGS (for product matching):
Based on the top issues detected, select relevant concern tags from this exact list:
["Acne & Blemishes", "Dark Spots & Hyperpigmentation", "Oiliness & Shine Control", "Redness & Sensitivity", "Anti-Aging & Fine Lines", "Enlarged Pores", "Hydration & Moisture", "Dark Circles & Eye Care", "Brightening", "Barrier Repair", "Dullness & Uneven Tone"]

COORDINATE RULES:
- Only set coords for: "acne", "darkSpots", "fineLines", "darkCircles" — AND only if score ≥ 45
- All other concerns MUST have "coords": null
- Anatomical reference: Forehead[50,20], Left Cheek[35,50], Right Cheek[65,50], Nose[50,45], Chin[50,75], Under Left Eye[40,38], Under Right Eye[60,38]

AM/PM ROUTINE — use ONLY these category names exactly:
'Cleansers & Washes', 'Toners & Essences', 'Serums & Elixirs', 'Moisturizers & Creams', 'Sun Protection'

Return ONLY a minified JSON with this exact schema:
{
  "analysis": {
    "acne": { "score": number, "description": string, "coords": [number,number]|null },
    "darkSpots": { "score": number, "description": string, "coords": [number,number]|null },
    "oiliness": { "score": number, "description": string, "coords": [number,number]|null },
    "redness": { "score": number, "description": string, "coords": [number,number]|null },
    "fineLines": { "score": number, "description": string, "coords": [number,number]|null },
    "pores": { "score": number, "description": string, "coords": [number,number]|null },
    "hydration": { "score": number, "description": string, "coords": [number,number]|null },
    "darkCircles": { "score": number, "description": string, "coords": [number,number]|null },
    "barrier": { "score": number, "description": string, "coords": [number,number]|null }
  },
  "skinType": string,
  "concernTags": string[],
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
