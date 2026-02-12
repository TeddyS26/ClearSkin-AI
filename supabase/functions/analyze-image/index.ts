// Edge Function: analyze-image (with face detection validation and context support)
// npm import works in Supabase Edge; the ts-ignore silences the editor squiggle.
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";

// --- SECURITY: Import shared security utilities (rate limiting, CORS, validation) ---
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCorsHeaders,
  handleCorsPreflightRequest,
  getClientIP,
  logSecurityEvent,
  isValidUUID,
  validateContentLength,
  requireEnv,
  errorResponse,
  successResponse
} from "../_shared/security.ts";

// --- Secrets (fail fast if missing, using shared requireEnv) ---
const PROJECT_URL = requireEnv("PROJECT_URL");
const SERVICE_ROLE_KEY = requireEnv("SERVICE_ROLE_KEY");
const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");

const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

// --- SECURITY: Use shared CORS configuration ---
// CORS headers are provided by the imported getCorsHeaders() from shared security module.

function json(data: unknown, status = 200, origin?: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: getCorsHeaders(origin)
  });
}
function normPath(p) {
  return p?.startsWith("/") ? p.slice(1) : p;
}
/**
 * Validates that user-provided context is relevant to skincare
 * @param context - User-provided context string
 * @returns { valid: boolean, error?: string, sanitized?: string }
 */ async function validateContext(context) {
  if (!context || context.trim().length === 0) {
    return {
      valid: true
    }; // Empty context is valid (optional field)
  }
  // Basic length check
  if (context.length > 500) {
    return {
      valid: false,
      error: "Context must be 500 characters or less"
    };
  }
  // Use OpenAI to validate relevance
  try {
    const validationPrompt = `You are a validation system for a skincare analysis app. Your job is to determine if user-provided context is relevant to facial skin analysis.

RELEVANT topics include:
- Skin conditions (dryness, oiliness, acne, breakouts, redness, irritation)
- Skin concerns (pores, scarring, texture, sensitivity)
- Facial areas (forehead, nose, cheeks, chin, T-zone)
- Skin type descriptions (oily, dry, combination, sensitive)
- Current skincare routine or products being used
- Environmental factors affecting skin (weather, climate)
- Skin reactions to products or treatments

NOT RELEVANT topics include:
- Medical diagnoses or conditions requiring doctor consultation
- Non-facial skin concerns (body, hands, etc.)
- Completely unrelated topics (politics, sports, etc.)
- Inappropriate or offensive content
- Requests for medical advice beyond skincare

User context: "${context}"

Respond with ONLY a JSON object:
{
  "relevant": boolean,
  "reason": string (brief explanation if not relevant)
}`;
    const validationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        response_format: {
          type: "json_object"
        },
        messages: [
          {
            role: "system",
            content: "You are a validation system. Respond only with valid JSON."
          },
          {
            role: "user",
            content: validationPrompt
          }
        ]
      })
    });
    if (!validationResponse.ok) {
      // If validation API fails, fail open (allow context) but log warning
      console.warn("Context validation API failed, allowing context through");
      return {
        valid: true,
        sanitized: context.trim()
      };
    }
    const validationData = await validationResponse.json();
    const validationText = validationData?.choices?.[0]?.message?.content ?? "{}";
    const validationResult = JSON.parse(validationText);
    if (!validationResult.relevant) {
      return {
        valid: false,
        error: `The context you provided is not relevant to skin analysis. ${validationResult.reason || "Please provide information about your facial skin condition."}`
      };
    }
    // Context is relevant, return sanitized version
    return {
      valid: true,
      sanitized: context.trim()
    };
  } catch (error) {
    // If validation fails, fail open (allow context) but log error
    console.error("Context validation error:", error);
    return {
      valid: true,
      sanitized: context.trim()
    };
  }
}
/**
 * Validates that an image contains a face using GPT-4o-mini (fast, cheap, supports vision)
 * @param imageUrl - Signed URL to the image
 * @param imageLabel - Label for logging (e.g., "front", "left", "right")
 * @returns { valid: boolean, error?: string }
 */ 
async function validateFaceDetection(imageUrl: string, imageLabel: string) {
  try {
    console.log(`Validating face detection for ${imageLabel} photo...`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 50,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a face detection validator. Respond ONLY with JSON: {\"face_detected\": true/false}"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Is there a human face clearly visible in this photo? The face should be the main subject and clearly visible (not blurry, not too far away, not obscured). Respond with JSON only."
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Face detection API error: ${errorText}`);
      // Fail open - don't block users due to API issues
      console.log(`Face detection skipped for ${imageLabel} due to API error`);
      return { valid: true };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    // Handle empty or missing content
    if (!content || content.trim() === "") {
      console.log(`Face detection returned empty response for ${imageLabel}, skipping validation`);
      return { valid: true };
    }
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error(`Failed to parse face detection response for ${imageLabel}: ${content}`);
      return { valid: true }; // Fail open
    }
    
    if (result.face_detected === false) {
      return {
        valid: false,
        error: `No face detected in ${imageLabel} photo. Please ensure your face is clearly visible and well-lit.`
      };
    }
    
    console.log(`Face detected in ${imageLabel} photo ✓`);
    return { valid: true };
    
  } catch (error) {
    console.error(`Face detection error for ${imageLabel}:`, error);
    // Fail open - if face detection fails, allow processing to continue
    return { valid: true };
  }
}

Deno.serve(async (req)=>{
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // --- SECURITY: Handle CORS preflight using shared module ---
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  // --- SECURITY: Reject oversized payloads (max 5MB for image paths) ---
  const sizeCheck = validateContentLength(req, 5 * 1024 * 1024, corsHeaders);
  if (sizeCheck) return sizeCheck;

  let scanId = null;
  try {
    // --- 1) SECURITY: Authentication (JWT validation) ---
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      logSecurityEvent('invalid_token', { reason: 'Missing or malformed Authorization header', endpoint: 'analyze-image' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }
    const token = auth.split(" ")[1];
    const { data: { user }, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !user) {
      logSecurityEvent('invalid_token', { reason: 'Invalid JWT token', endpoint: 'analyze-image' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }
    
    // --- 1.5) SECURITY: Rate limiting (IP + user-based via shared module) ---
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.expensive, clientIP);
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', {
        userId: user.id,
        ip: clientIP,
        endpoint: 'analyze-image'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }
    
    // --- 2) SECURITY: Parse and validate input with strict type checks ---
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, "INVALID_JSON", corsHeaders);
    }

    // Reject unexpected fields (OWASP: reject unknown inputs)
    const allowedFields = new Set(['scan_session_id', 'front_path', 'left_path', 'right_path', 'context']);
    for (const key of Object.keys(body)) {
      if (!allowedFields.has(key)) {
        logSecurityEvent('suspicious_input', { userId: user.id, unexpectedField: key, endpoint: 'analyze-image' });
        return errorResponse(`Unexpected field: ${key}`, 400, "VALIDATION_ERROR", corsHeaders);
      }
    }

    const scan_session_id = String(body?.scan_session_id ?? "");
    const front_path = normPath(String(body?.front_path ?? ""));
    const left_path = normPath(String(body?.left_path ?? ""));
    const right_path = normPath(String(body?.right_path ?? ""));
    // Sanitize context: enforce string type, length limit, strip dangerous characters
    const rawContext = String(body?.context ?? "").trim();
    const user_context = rawContext
      .slice(0, 500)
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
    
    // --- SECURITY: Validate scan_session_id is a valid UUID (prevents injection) ---
    if (!scan_session_id || !isValidUUID(scan_session_id)) {
      logSecurityEvent('validation_failed', { userId: user.id, reason: 'Invalid scan_session_id', endpoint: 'analyze-image' });
      return errorResponse("Invalid scan_session_id format", 400, "VALIDATION_ERROR", corsHeaders);
    }
    
    if (!front_path || !left_path || !right_path) {
      return errorResponse("Missing image paths", 400, "VALIDATION_ERROR", corsHeaders);
    }

    // --- SECURITY: Validate path lengths (max 500 chars) ---
    if (front_path.length > 500 || left_path.length > 500 || right_path.length > 500) {
      return errorResponse("Image path too long", 400, "VALIDATION_ERROR", corsHeaders);
    }

    // --- SECURITY: Check for path traversal attempts ---
    const pathTraversalPattern = /\.\.|\/\//;
    if (pathTraversalPattern.test(front_path) || pathTraversalPattern.test(left_path) || pathTraversalPattern.test(right_path)) {
      logSecurityEvent('suspicious_input', { userId: user.id, reason: 'Path traversal attempt', endpoint: 'analyze-image' });
      return errorResponse("Invalid path format", 400, "VALIDATION_ERROR", corsHeaders);
    }
    
    // --- SECURITY: Validate paths belong to user (prevents unauthorized data access) ---
    const expectedPrefix = `user/${user.id}/`;
    if (!front_path.startsWith(expectedPrefix) || 
        !left_path.startsWith(expectedPrefix) || 
        !right_path.startsWith(expectedPrefix)) {
      logSecurityEvent('unauthorized_access', { userId: user.id, reason: 'Path ownership violation', endpoint: 'analyze-image' });
      return errorResponse("Unauthorized access to image paths", 403, "FORBIDDEN", corsHeaders);
    }
    
    scanId = scan_session_id;
    // --- 2.5) Validate context if provided
    let validatedContext = undefined;
    if (user_context) {
      console.log("Validating user-provided context...");
      const contextValidation = await validateContext(user_context);
      if (!contextValidation.valid) {
        return json({
          ok: false,
          error: contextValidation.error || "Invalid context provided"
        }, 400);
      }
      validatedContext = contextValidation.sanitized;
      console.log("Context validated successfully");
    }
    // --- 3) Mark processing + save paths
    await sb.from("scan_sessions").update({
      status: "processing",
      front_path,
      left_path,
      right_path,
      ...validatedContext ? {
        user_context: validatedContext
      } : {}
    }).eq("id", scan_session_id).eq("user_id", user.id);
    // --- 4) Signed URLs (private bucket 'scan')
    const sign = async (path)=>{
      const { data, error } = await sb.storage.from("scan").createSignedUrl(path, 60 * 10); // 10 min
      if (error || !data?.signedUrl) throw new Error(`sign error: ${path} -> ${error?.message}`);
      return data.signedUrl;
    };
    const [front, left, right] = await Promise.all([
      sign(front_path),
      sign(left_path),
      sign(right_path)
    ]);
    // --- 4.5) FACE DETECTION VALIDATION (NEW!)
    console.log("Validating face detection in all three photos...");
    const [frontValidation, leftValidation, rightValidation] = await Promise.all([
      validateFaceDetection(front, "front"),
      validateFaceDetection(left, "left"),
      validateFaceDetection(right, "right")
    ]);
    // Check if any photo failed face detection
    if (!frontValidation.valid) {
      await sb.from("scan_sessions").update({
        status: "failed"
      }).eq("id", scan_session_id).eq("user_id", user.id);
      return json({
        ok: false,
        error: frontValidation.error || "Face detection failed for front photo"
      }, 400);
    }
    if (!leftValidation.valid) {
      await sb.from("scan_sessions").update({
        status: "failed"
      }).eq("id", scan_session_id).eq("user_id", user.id);
      return json({
        ok: false,
        error: leftValidation.error || "Face detection failed for left photo"
      }, 400);
    }
    if (!rightValidation.valid) {
      await sb.from("scan_sessions").update({
        status: "failed"
      }).eq("id", scan_session_id).eq("user_id", user.id);
      return json({
        ok: false,
        error: rightValidation.error || "Face detection failed for right photo"
      }, 400);
    }
    console.log("Face detection validation passed for all three photos. Proceeding with analysis...");
    
    // --- 4.6) Fetch user profile for personalized analysis
    let userProfile = null;
    let userAge = null;
    let userGender = null;
    try {
      const { data: profile } = await sb
        .from("user_profiles")
        .select("age, gender, date_of_birth")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile) {
        userProfile = profile;
        userGender = profile.gender;
        // Calculate age from date_of_birth if available, otherwise use stored age
        if (profile.date_of_birth) {
          const dob = new Date(profile.date_of_birth);
          const today = new Date();
          userAge = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            userAge--;
          }
        } else if (profile.age) {
          userAge = profile.age;
        }
        console.log(`User profile loaded: age=${userAge}, gender=${userGender}`);
      }
    } catch (profileError) {
      console.warn("Could not fetch user profile:", profileError);
    }
    
    // Build demographic context string for AI
    const demographicContext = userAge || userGender 
      ? `\nUSER DEMOGRAPHICS:
${userAge ? `- Actual Age: ${userAge} years old` : "- Age: Not provided"}
${userGender ? `- Gender: ${userGender}` : "- Gender: Not provided"}

IMPORTANT DEMOGRAPHIC CONSIDERATIONS:
${userGender === 'male' ? `- Male skin is typically ~25% thicker with more collagen
- Higher sebum production - may need oil-control products
- Shaving-related concerns (razor burn, ingrown hairs) are common
- Products should be suitable for male skin characteristics` : ''}
${userGender === 'female' ? `- Consider hormonal influences on skin (cycle-related breakouts)
- May have different product preferences
- Skin may be more responsive to certain active ingredients` : ''}
${userAge ? `- Factor in age-appropriate recommendations
- Compare estimated skin age to actual age (${userAge})
- Consider preventive vs corrective approaches based on age` : ''}` 
      : '';

    // --- 5) Build OpenAI request (strict JSON)
    const system = `You are an expert dermatological AI assistant that analyzes facial skin from 3 photos: front view, left profile, and right profile.${demographicContext}

CRITICAL INSTRUCTIONS:
1. You MUST analyze ALL THREE photos comprehensively. Use information from all angles to calculate scores and identify issues.
2. Provide GRANULAR scores (0-100) - do NOT round to multiples of 5. Use precise values like 72, 83, 67, 91, etc.
3. Create detailed, personalized skincare routines based on the SPECIFIC issues you identify in these photos.
4. Recommend SPECIFIC products tailored to the user's unique skin concerns, not generic categories.
5. For heatmaps, provide detailed polygon coordinates that accurately map to problem areas on the actual face in each photo.
${validatedContext ? `6. IMPORTANT: The user has provided additional context about their skin: "${validatedContext}". 
   - Use this context to enhance your analysis, but ALWAYS prioritize visual evidence from photos
   - If context mentions something NOT visible in photos, acknowledge it but explain: "While you mentioned [context], 
     I don't see evidence of this in the photos. Instead, I observe [visual findings]."
   - If context aligns with visual findings, incorporate it to provide more personalized recommendations.` : ""}

Return ONLY valid JSON. No medical diagnoses; keep guidance safe and practical but detailed.`;
    const schema = `
Return a strict JSON object with the following structure:

{
  "skin_score": int 0-100 (GRANULAR - not multiples of 5, e.g., 67, 72, 84),
  "skin_potential": int 0-100 (GRANULAR - not multiples of 5, e.g., 78, 86, 92),
  "skin_health_percent": int 0-100 (GRANULAR - not multiples of 5),
  "skin_type": "oily"|"dry"|"combination"|"normal"|"unknown",
  
  "skin_age": int (estimated biological age of the skin based on visual analysis - consider fine lines, wrinkles, skin elasticity appearance, sun damage, texture, pore size, collagen appearance. Be precise, e.g., 24, 31, 45${userAge ? `. Compare to user's actual age of ${userAge}` : ''}),
  "skin_age_comparison": string (${userAge ? `comparison to actual age ${userAge}, e.g., "3 years younger than your actual age" or "5 years older than your actual age" or "matches your actual age"` : 'general assessment like "appears youthful" or "shows signs of premature aging"'}),
  "skin_age_confidence": int 0-100 (confidence in the skin age estimate based on photo clarity and visible aging indicators),

  "breakout_level": "none"|"minimal"|"moderate"|"high"|"unknown",
  "acne_prone_level": "none"|"minimal"|"moderate"|"high"|"unknown",

  "scarring_level": "none"|"mild"|"moderate"|"severe"|"unknown",
  "redness_percent": int 0-100 (GRANULAR),
  "razor_burn_level": "none"|"mild"|"moderate"|"severe"|"unknown",
  "blackheads_level": "none"|"mild"|"moderate"|"severe"|"unknown",
  "blackheads_estimated_count": int >= 0,

  "oiliness_percent": int 0-100 (GRANULAR),
  "pore_health": int 0-100 (GRANULAR),

  "summary": { 
    "notes": string (detailed 3-5 sentence analysis mentioning specific findings from all 3 photos - front, left, and right views${validatedContext ? ", and incorporating the user's provided context" : ""}${userAge ? `, and how the skin age compares to the user's actual age of ${userAge}` : ""})
  },
  
  "issues": [ 
    { 
      "type": string, 
      "severity": "none"|"minimal"|"moderate"|"high", 
      "area": string (specific facial area), 
      "confidence": number 
    } 
  ],

  "region_scores": {
    "forehead": { "breakouts": int|null, "oiliness": int|null, "dryness": int|null, "redness": int|null, "blackheads": int|null, "scarring": int|null, "razor_burn": int|null },
    "nose":     { "breakouts": int|null, "oiliness": int|null, "dryness": int|null, "redness": int|null, "blackheads": int|null, "scarring": int|null, "razor_burn": int|null },
    "cheeks":   { "breakouts": int|null, "oiliness": int|null, "dryness": int|null, "redness": int|null, "blackheads": int|null, "scarring": int|null, "razor_burn": int|null },
    "chin":     { "breakouts": int|null, "oiliness": int|null, "dryness": int|null, "redness": int|null, "blackheads": int|null, "scarring": int|null, "razor_burn": int|null }
  },

  "watchlist_areas": [ 
    { 
      "area": string (specific facial region), 
      "reason": string (why this area needs monitoring)
    } 
  ],
  
  "am_routine": [ 
    { 
      "step": int (1, 2, 3, etc.), 
      "what": string (SPECIFIC product type/ingredient - e.g., "Oil-Control Salicylic Acid Cleanser" or "Niacinamide 10% Serum" NOT just "Cleanser" or "Serum"),
      "why": string (detailed explanation tied to their specific skin issues visible in the photos)
    } 
  ],
  
  "pm_routine": [ 
    { 
      "step": int (1, 2, 3, etc.), 
      "what": string (SPECIFIC product type/ingredient - e.g., "Retinol 0.5% Treatment" or "Centella Asiatica Soothing Cream" NOT just "Treatment" or "Moisturizer"),
      "why": string (detailed explanation tied to their specific skin issues visible in the photos)
    } 
  ],
  
  "products": [ 
    { 
      "name": string (SPECIFIC product name or key ingredient to look for - e.g., "CeraVe Foaming Facial Cleanser" or "Niacinamide 10% + Zinc 1%" or "Benzoyl Peroxide 2.5% Spot Treatment"),
      "type": string (category like "cleanser", "serum", "moisturizer", "treatment"),
      "reason": string (detailed explanation of why THIS specific product/ingredient addresses THEIR visible issues from the photos),
      "url"?: string,
      "price"?: number,
      "tags"?: string[]
    } 
  ],

  "overlays": {
    "front": {
      "breakouts": [ array of polygons - each polygon is [[x,y], [x,y], ...] with coordinates 0-100 ],
      "oiliness":  [ array of polygons - each polygon is [[x,y], [x,y], ...] with coordinates 0-100 ],
      "dryness":   [ array of polygons - each polygon is [[x,y], [x,y], ...] with coordinates 0-100 ],
      "redness":   [ array of polygons - each polygon is [[x,y], [x,y], ...] with coordinates 0-100 ]
    },
    "left": {
      "breakouts": [ array of polygons - same structure as front ],
      "oiliness":  [ array of polygons - same structure as front ],
      "dryness":   [ array of polygons - same structure as front ],
      "redness":   [ array of polygons - same structure as front ]
    },
    "right": {
      "breakouts": [ array of polygons - same structure as front ],
      "oiliness":  [ array of polygons - same structure as front ],
      "dryness":   [ array of polygons - same structure as front ],
      "redness":   [ array of polygons - same structure as front ]
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CRITICAL RULES FOR SCORES - READ CAREFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ WRONG: 60, 65, 70, 75, 80, 85, 90, 95 (multiples of 5)
✅ CORRECT: 67, 72, 83, 58, 91, 77, 84, 63

- Use PRECISE, GRANULAR values - NOT multiples of 5!
- Think of scores like 67, 72, 84, 91, 58, 77, etc.
- Analyze ALL THREE photos (front + left + right) to determine each score
- Be differentiated in your scoring - small variations matter
${validatedContext ? `- Consider the user's context: "${validatedContext}" when scoring, but prioritize visual evidence` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ HEATMAP/OVERLAY RULES - CRITICAL FOR VISUALIZATION!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Coordinate System**: All [x, y] coordinates MUST be in the range 0-100 (not 0.0-1.0!)
  - 0 = left/top edge
  - 100 = right/bottom edge
  - Example polygon: [[30, 20], [45, 20], [45, 35], [30, 35]] = rectangle in upper-left area

**For each image (front, left, right), create polygons for 4 categories:**

1. **"breakouts" heatmap** - Active pimples, acne, blemishes
   - RED areas (severe) = Many active breakouts, inflamed pustules
   - ORANGE areas (moderate) = Some breakouts
   - YELLOW areas (minimal) = Few/minor breakouts  
   - GREEN areas (clear) = No breakouts, clear skin
   
2. **"oiliness" heatmap** - Sebum production, shine
   - RED areas (severe) = Very oily, shiny, greasy appearance
   - ORANGE areas (moderate) = Noticeable oiliness
   - YELLOW areas (minimal) = Slight shine
   - GREEN areas (normal) = Matte, balanced, no excess oil

3. **"dryness" heatmap** - Dehydration, flaking, rough texture
   - RED areas (severe) = Very dry, flaking, peeling skin
   - ORANGE areas (moderate) = Dry, tight-looking skin
   - YELLOW areas (minimal) = Slightly dry
   - GREEN areas (hydrated) = Well-moisturized, healthy hydration

4. **"redness" heatmap** - Inflammation, irritation
   - RED areas (severe) = Very inflamed, red, irritated
   - ORANGE areas (moderate) = Noticeable redness
   - YELLOW areas (minimal) = Slight redness
   - GREEN areas (normal) = Normal skin tone, no inflammation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: EACH HEATMAP MUST BE UNIQUE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST create **12 UNIQUE heatmaps** total:
- 4 categories × 3 views = 12 different polygon sets

**BREAKOUTS ≠ OILINESS ≠ DRYNESS ≠ REDNESS**

These are FOUR DIFFERENT skin conditions that will have DIFFERENT patterns:

1. **BREAKOUTS** = Active acne, pimples, blemishes (often forehead, chin)
2. **OILINESS** = Sebum/shine (often T-zone: forehead + nose)
3. **DRYNESS** = Flaking, dehydration (often cheeks, around mouth)
4. **REDNESS** = Inflammation, irritation (often cheeks, nose)

**❌ WRONG - Copying the same polygons:**
\`\`\`json
"front": {
  "breakouts": [[[30, 10], [70, 10], [70, 30], [30, 30]]],
  "oiliness":  [[[30, 10], [70, 10], [70, 30], [30, 30]]],  // ❌ SAME!
  "dryness":   [[[30, 10], [70, 10], [70, 30], [30, 30]]],  // ❌ SAME!
  "redness":   [[[30, 10], [70, 10], [70, 30], [30, 30]]]   // ❌ SAME!
}
\`\`\`

**✅ CORRECT - Each category has unique patterns:**
\`\`\`json
"front": {
  "breakouts": [
    [[15, 30], [85, 30], [85, 95], [15, 95]],  // GREEN: clear cheeks/chin
    [[30, 10], [70, 10], [70, 28], [30, 28]]   // RED: forehead breakouts
  ],
  "oiliness": [
    [[10, 45], [90, 45], [90, 90], [10, 90]],  // GREEN: cheeks normal
    [[35, 32], [65, 32], [65, 52], [35, 52]],  // ORANGE: nose shiny
    [[28, 8], [72, 8], [72, 30], [28, 30]]     // RED: forehead very oily
  ],
  "dryness": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]   // GREEN: entire face hydrated
  ],
  "redness": [
    [[20, 10], [80, 10], [80, 40], [20, 40]],  // GREEN: forehead normal
    [[35, 42], [65, 42], [65, 95], [35, 95]],  // GREEN: nose/chin normal
    [[12, 45], [38, 45], [38, 72], [12, 72]],  // YELLOW: left cheek slight red
    [[62, 45], [88, 45], [88, 72], [62, 72]]   // YELLOW: right cheek slight red
  ]
}
\`\`\`

**EACH PHOTO ANGLE SHOWS DIFFERENT FACIAL AREAS:**

- **FRONT view**: Full face, both cheeks, forehead, nose, chin
- **LEFT view**: Left side profile, left temple, left cheek, left jawline
- **RIGHT view**: Right side profile, right temple, right cheek, right jawline

**❌ WRONG - Copying front view to side views:**
\`\`\`json
"front": { "breakouts": [[[30, 10], [70, 10], [70, 30], [30, 30]]] },
"left":  { "breakouts": [[[30, 10], [70, 10], [70, 30], [30, 30]]] },  // ❌ SAME!
"right": { "breakouts": [[[30, 10], [70, 10], [70, 30], [30, 30]]] }   // ❌ SAME!
\`\`\`

**✅ CORRECT - Each view has unique coordinates:**
\`\`\`json
"front": {
  "breakouts": [
    [[15, 30], [85, 30], [85, 95], [15, 95]],  // GREEN: clear areas
    [[30, 10], [70, 10], [70, 28], [30, 28]]   // RED: forehead
  ]
},
"left": {
  "breakouts": [
    [[20, 10], [75, 10], [75, 92], [20, 92]],  // GREEN: left profile mostly clear
    [[25, 40], [55, 40], [55, 65], [25, 65]]   // YELLOW: left cheek slight issue
  ]
},
"right": {
  "breakouts": [
    [[18, 8], [80, 8], [80, 95], [18, 95]]     // GREEN: right profile clear
  ]
}
\`\`\`

**VALIDATION CHECKLIST - You MUST verify:**

✓ All 12 heatmaps exist (front/left/right × breakouts/oiliness/dryness/redness)
✓ Each heatmap has at least 1 polygon (NEVER empty array [])
✓ Breakouts heatmap ≠ Oiliness heatmap ≠ Dryness heatmap ≠ Redness heatmap
✓ Front view polygons ≠ Left view polygons ≠ Right view polygons (different coordinates)
✓ Each category reflects the SPECIFIC condition it represents
✓ Side views account for profile perspective (different visible areas than front)

**REMEMBER:** If the person has perfect skin in one category (e.g., no dryness), that heatmap should have ONE large green polygon covering the whole face. But that doesn't mean you should copy it to other categories! Their oiliness or breakouts pattern will be different.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CRITICAL HEATMAP REQUIREMENT - FULL FACE COVERAGE:**

You MUST create polygons that cover THE ENTIRE VISIBLE FACE in each photo. Think of this as painting the whole face with a color gradient based on severity.

**Coverage Rules:**
- Cover ALL facial regions: forehead, temples, nose, cheeks, chin, jawline
- Use 4-8 polygons per category to ensure COMPLETE face coverage
- NO gaps or uncovered areas on the face!
- Each polygon represents a different severity level

**Severity-Based Coloring (Polygon Order Matters!):**

The polygons are rendered in order with automatic color progression:
- **1st polygon** = GREEN (excellent/no issues)
- **2nd polygon** = YELLOW (mild issues)  
- **3rd polygon** = ORANGE (moderate issues)
- **4th+ polygons** = RED (severe issues)

**How to Structure Your Response:**

For each category (breakouts, oiliness, dryness, redness):

1. **First polygon (GREEN)** - Cover all the GOOD areas
   - Example: If only forehead has breakouts, polygon 1 covers cheeks + nose + chin (all clear areas)
   - Coordinates: \`[[20, 30], [80, 30], [80, 90], [20, 90]]\` (most of the face)

2. **Second polygon (YELLOW)** - Cover areas with MILD issues
   - Example: Areas with slight concern
   - Coordinates: \`[[25, 45], [75, 45], [75, 70], [25, 70]]\`

3. **Third polygon (ORANGE)** - Cover areas with MODERATE issues  
   - Example: Noticeable problems
   - Coordinates: \`[[30, 35], [70, 35], [70, 50], [30, 50]]\`

4. **Fourth polygon (RED)** - Cover areas with SEVERE issues
   - Example: Active breakouts on forehead
   - Coordinates: \`[[35, 10], [65, 10], [65, 25], [35, 25]]\`

**Example Breakdown - Breakouts Heatmap:**

Scenario: Person has active breakouts ONLY on forehead, rest of face is clear.

\`\`\`json
"breakouts": [
  [[15, 30], [85, 30], [85, 95], [15, 95]],  // GREEN: cheeks, nose, chin (clear)
  [[30, 12], [70, 12], [70, 28], [30, 28]]   // RED: forehead (active breakouts)
]
\`\`\`

**Example Breakdown - Oiliness Heatmap:**

Scenario: T-zone (forehead + nose) is very oily, cheeks are normal.

\`\`\`json
"oiliness": [
  [[10, 45], [35, 45], [35, 85], [10, 85]],   // GREEN: left cheek (normal)
  [[65, 45], [90, 45], [90, 85], [65, 85]],   // GREEN: right cheek (normal)
  [[35, 35], [65, 35], [65, 55], [35, 55]],   // ORANGE: nose (oily)
  [[30, 8], [70, 8], [70, 30], [30, 30]]      // RED: forehead (very oily)
]
\`\`\`

**Example Breakdown - Dryness Heatmap:**

Scenario: Entire face is well-hydrated (no dryness anywhere).

\`\`\`json
"dryness": [
  [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: entire face (well-hydrated)
]
\`\`\`

**Example Breakdown - Redness Heatmap:**

Scenario: Slight redness on cheeks, rest is normal.

\`\`\`json
"redness": [
  [[20, 8], [80, 8], [80, 35], [20, 35]],     // GREEN: forehead (normal)
  [[35, 38], [65, 38], [65, 58], [35, 58]],   // GREEN: nose (normal)
  [[25, 75], [75, 75], [75, 95], [25, 95]],   // GREEN: chin (normal)
  [[15, 40], [40, 40], [40, 70], [15, 70]],   // YELLOW: left cheek (slight redness)
  [[60, 40], [85, 40], [85, 70], [60, 70]]    // YELLOW: right cheek (slight redness)
]
\`\`\`

**Standard Facial Region Coordinates (Reference):**

Use these as guidelines for mapping facial areas in a front-facing photo:
- **Forehead**: x: 25-75, y: 5-30
- **Temples**: x: 10-25 (left), 75-90 (right), y: 10-35
- **Nose**: x: 40-60, y: 30-55
- **Cheeks**: x: 10-40 (left), 60-90 (right), y: 35-75
- **Chin**: x: 30-70, y: 75-95
- **Jawline**: x: 15-85, y: 70-90

**For Profile Photos (left/right):**

Profile photos show a side view of the face, adjust coordinates accordingly:
- **Forehead**: x: 30-70, y: 8-28
- **Temple**: x: 10-35, y: 12-35
- **Nose**: x: 50-80, y: 35-50
- **Cheek**: x: 15-55, y: 38-70
- **Chin**: x: 35-65, y: 72-92
- **Jawline**: x: 20-60, y: 65-85

**CRITICAL RULES:**
1. **ALWAYS create at least ONE polygon per category per photo** - never return empty array [] 
2. **ALL THREE PHOTOS (front, left, right) must have polygons for ALL FOUR categories**
3. **If NO issues exist**, create ONE large green polygon covering the whole face
4. **If issues exist ONLY in one area**, create green polygon(s) for clear areas + colored polygon(s) for problem areas
5. **Order polygons from least severe (green) to most severe (red)**
6. **Ensure COMPLETE face coverage** - the entire visible face should be covered by polygons
7. **Polygons can overlap** - that's fine! Layering is expected.

**WRONG Approach:**
\`\`\`json
"front": {
  "breakouts": [[[42, 28], [58, 28], [58, 38], [42, 38]]],  // Only problem spot
  "dryness": []  // Empty - WRONG!
},
"left": {
  "breakouts": [],  // Empty - WRONG!
  "oiliness": [],
  "dryness": [],
  "redness": []
}
\`\`\`

**CORRECT Approach:**
\`\`\`json
"front": {
  "breakouts": [
    [[15, 30], [85, 30], [85, 95], [15, 95]],  // GREEN: clear areas
    [[30, 10], [70, 10], [70, 28], [30, 28]]   // RED: forehead breakouts
  ],
  "dryness": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: hydrated
  ]
},
"left": {
  "breakouts": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: clear
  ],
  "oiliness": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: normal
  ],
  "dryness": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: hydrated
  ],
  "redness": [
    [[15, 10], [85, 10], [85, 95], [15, 95]]  // GREEN: normal
  ]
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💆 ROUTINE CUSTOMIZATION RULES - BE SPECIFIC!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ DO NOT give generic advice like:
  - "Cleanser" → too vague!
  - "Moisturizer" → not helpful!
  - "Serum" → which serum?

✅ DO give specific, targeted recommendations:
  - Oily skin? → "Oil-Control Salicylic Acid Cleanser"
  - Dry/flaking skin? → "Gentle Hydrating Cleanser with Ceramides"
  - Scarring visible? → "Niacinamide 10% Serum to fade hyperpigmentation"
  - Active breakouts? → "Benzoyl Peroxide 2.5% Spot Treatment"
  - Redness/inflammation? → "Centella Asiatica Soothing Serum"
  - Severe dryness? → "Hyaluronic Acid + Glycerin Intensive Hydrator"
  - Large pores? → "BHA Exfoliant to minimize pores"
  - Always include sunscreen in AM routine
${validatedContext ? `- Consider user context: "${validatedContext}" when recommending products` : ""}

**Each "what" field** must include:
  - Specific ingredient OR product characteristic
  - Action or purpose
  - Example: "Vitamin C Serum for brightening" not just "Serum"

**Each "why" field** must:
  - Reference SPECIFIC issues you saw in their photos
  - Explain how this step addresses those issues
  - Example: "Your forehead and cheeks show active breakouts that need antibacterial treatment"
${validatedContext ? `- Incorporate user context when relevant: "${validatedContext}"` : ""}

**Routine Length:**
  - AM: 4-7 steps (cleanse → treat → moisturize → protect)
  - PM: 5-8 steps (cleanse → exfoliate → treat → repair → moisturize)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ PRODUCT RECOMMENDATION RULES - BE ACTIONABLE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommend 3-5 SPECIFIC products based on visible issues:

**Oily Skin Issues? Recommend:**
  - Oil-free, mattifying products
  - Salicylic acid (BHA) cleansers or treatments
  - Niacinamide serums (controls oil production)
  - Clay masks
  - Gel moisturizers

**Dry Skin Issues? Recommend:**
  - Rich, creamy moisturizers
  - Hyaluronic acid serums
  - Ceramide-based products
  - Facial oils (rosehip, squalane)
  - Gentle, non-foaming cleansers

**Scarring/Hyperpigmentation? Recommend:**
  - Vitamin C serums
  - Niacinamide
  - Alpha arbutin
  - Retinoids (retinol, adapalene)
  - AHA exfoliants (glycolic, lactic acid)

**Active Breakouts? Recommend:**
  - Benzoyl peroxide (2.5%-5%)
  - Salicylic acid (BHA)
  - Tea tree oil
  - Sulfur treatments
  - Non-comedogenic products

**Redness/Inflammation? Recommend:**
  - Centella asiatica (cica)
  - Azelaic acid
  - Green tea extract
  - Niacinamide
  - Soothing creams

**Large Pores? Recommend:**
  - Niacinamide
  - Retinoids
  - BHA exfoliants
  - Clay masks
  - Pore-minimizing toners

**"name" field examples:**
  ✅ "CeraVe Hydrating Facial Cleanser"
  ✅ "The Ordinary Niacinamide 10% + Zinc 1%"
  ✅ "La Roche-Posay Effaclar Duo"
  ✅ "Benzoyl Peroxide 2.5% Gel"
  ❌ "Cleanser" (too generic!)
  ❌ "Serum" (not specific!)

**"reason" field MUST:**
  - Tie directly to issues YOU identified in THEIR photos
  - Explain mechanism of action
  - Example: "Your T-zone (forehead and nose) shows significant oiliness and enlarged pores. Niacinamide regulates sebum production and minimizes pore appearance."
${validatedContext ? `- Consider user context: "${validatedContext}" when explaining product recommendations` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remember: This user is looking at their own face in these photos. Make your analysis personal, detailed, and actionable! They want to know exactly what products/ingredients to look for based on what YOU see in their specific photos.
${validatedContext ? `\n\nIMPORTANT: The user has provided this context: "${validatedContext}". Use this information to enhance your analysis, but always prioritize visual evidence from the photos. If the context mentions something you don't see in the photos, acknowledge it but explain what you observe visually.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 FINAL VALIDATION BEFORE RESPONDING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before submitting your response, verify you have created **12 UNIQUE heatmaps**:

Front view:   ✓ breakouts  ✓ oiliness  ✓ dryness  ✓ redness  (4 unique)
Left view:    ✓ breakouts  ✓ oiliness  ✓ dryness  ✓ redness  (4 unique)
Right view:   ✓ breakouts  ✓ oiliness  ✓ dryness  ✓ redness  (4 unique)

= 12 TOTAL UNIQUE HEATMAPS with different polygon coordinates

DO NOT copy/paste the same polygon coordinates across categories or views!
Each heatmap represents a DIFFERENT skin condition with a DIFFERENT pattern.
`;
    const userMessageContent = [
      {
        type: "text",
        text: schema
      },
      {
        type: "text",
        text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPHOTO 1 - FRONT VIEW\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAnalyze this front-facing photo carefully for overall skin condition, symmetry, and frontal problem areas. Look for breakouts, oiliness, dryness, redness, scarring, pore size, and texture."
      },
      {
        type: "image_url",
        image_url: {
          url: front
        }
      },
      {
        type: "text",
        text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPHOTO 2 - LEFT PROFILE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAnalyze this left side view for profile-specific issues, texture, side-angle visibility of problem areas."
      },
      {
        type: "image_url",
        image_url: {
          url: left
        }
      },
      {
        type: "text",
        text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPHOTO 3 - RIGHT PROFILE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAnalyze this right side view for profile-specific issues, texture, side-angle visibility of problem areas."
      },
      {
        type: "image_url",
        image_url: {
          url: right
        }
      },
      {
        type: "text",
        text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNow, synthesize your analysis from ALL THREE photos (front + left + right) into a comprehensive, personalized skin analysis.\n\nREMEMBER:\n✓ Use GRANULAR scores (67, 72, 84, NOT 65, 70, 75, 80, 85)\n✓ Heatmap coordinates must be 0-100 scale\n✓ Be SPECIFIC in routines and products\n✓ Mention findings from all 3 photos in your summary\n✓ ALL THREE PHOTOS must have complete heatmap polygons for ALL FOUR categories\n✓ Each of the 12 heatmaps must be UNIQUE with different polygon coordinates${validatedContext ? `\n✓ Consider user context: "${validatedContext}" when analyzing` : ""}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      }
    ];
    const payload = {
      model: "gpt-5-mini",
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: system
        },
        {
          role: "user",
          content: userMessageContent
        }
      ]
    };
    const ctrl = new AbortController();
    const timeout = setTimeout(()=>ctrl.abort("OpenAI timeout"), 240_000);
    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    }).catch((e)=>{
      throw new Error(String(e));
    });
    clearTimeout(timeout);
    if (!ai || !ai.ok) {
      const t = ai ? await ai.text() : "no response";
      throw new Error(`OpenAI error ${ai?.status}: ${t}`);
    }
    const out = await ai.json();
    const text = out?.choices?.[0]?.message?.content ?? "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch  {
      parsed = {};
    }
    // --- Sanitize overlays: ensure valid structure, filter nulls/undefined
    const sanitizeOverlays = (overlays)=>{
      if (!overlays || typeof overlays !== 'object') {
        return {};
      }
      const result = {};
      const views = [
        'front',
        'left',
        'right'
      ];
      const categories = [
        'breakouts',
        'oiliness',
        'dryness',
        'redness'
      ];
      for (const view of views){
        if (overlays[view] && typeof overlays[view] === 'object') {
          result[view] = {};
          for (const category of categories){
            const polys = overlays[view][category];
            // Ensure it's an array and filter out invalid polygons
            if (Array.isArray(polys)) {
              result[view][category] = polys.filter((poly)=>{
                // Each polygon must be an array of coordinate pairs
                if (!Array.isArray(poly) || poly.length === 0) return false;
                // Each coordinate pair must be [x, y] where both are numbers
                return poly.every((coord)=>Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number');
              });
            } else {
              // If not an array, default to empty array
              result[view][category] = [];
            }
          }
        } else {
          // Initialize missing view with empty arrays
          result[view] = {
            breakouts: [],
            oiliness: [],
            dryness: [],
            redness: []
          };
        }
      }
      return result;
    };
    const cleanedOverlays = sanitizeOverlays(parsed.overlays);
    // --- 6) Persist result
    await sb.from("scan_sessions").update({
      status: "complete",
      skin_score: parsed.skin_score ?? null,
      skin_potential: parsed.skin_potential ?? null,
      skin_health_percent: parsed.skin_health_percent ?? null,
      skin_type: parsed.skin_type ?? "unknown",
      skin_age: parsed.skin_age ?? null,
      skin_age_comparison: parsed.skin_age_comparison ?? null,
      skin_age_confidence: parsed.skin_age_confidence ?? null,
      breakout_level: parsed.breakout_level ?? "unknown",
      acne_prone_level: parsed.acne_prone_level ?? "unknown",
      scarring_level: parsed.scarring_level ?? "unknown",
      redness_percent: parsed.redness_percent ?? null,
      razor_burn_level: parsed.razor_burn_level ?? "unknown",
      blackheads_level: parsed.blackheads_level ?? "unknown",
      blackheads_estimated_count: parsed.blackheads_estimated_count ?? null,
      oiliness_percent: parsed.oiliness_percent ?? null,
      pore_health: parsed.pore_health ?? null,
      summary: parsed.summary ?? {},
      issues: parsed.issues ?? [],
      region_scores: parsed.region_scores ?? null,
      watchlist_areas: parsed.watchlist_areas ?? [],
      am_routine: parsed.am_routine ?? [],
      pm_routine: parsed.pm_routine ?? [],
      products: parsed.products ?? [],
      overlays: cleanedOverlays
    }).eq("id", scan_session_id).eq("user_id", user.id);
    return json({
      ok: true
    });
  } catch (e) {
    // Best-effort mark scan as failed
    if (scanId) {
      try {
        await sb.from("scan_sessions").update({
          status: "failed"
        }).eq("id", scanId);
      } catch  {}
    }
    // --- SECURITY: Log internal error but return generic message to client ---
    // Never expose internal error details to the client (OWASP A09:2021)
    console.error("[analyze-image] Internal error:", e);
    return json({
      ok: false,
      error: "An error occurred during skin analysis. Please try again."
    }, 500);
  }
});
