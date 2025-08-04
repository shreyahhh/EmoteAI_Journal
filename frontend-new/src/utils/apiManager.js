// API utility for Gemini AI calls with rate limiting and error handling
class ApiManager {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minInterval = 1000; // Minimum 1 second between requests
  }

  async makeRequest(apiCall) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ apiCall, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }
      
      const { apiCall, resolve, reject } = this.requestQueue.shift();
      this.lastRequestTime = Date.now();
      
      try {
        const result = await apiCall();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }
}

const apiManager = new ApiManager();

// Improved API call with retry logic and better error handling
export async function makeGeminiRequest(prompt, options = {}) {
  const {
    model = 'gemini-2.0-flash',
    maxRetries = 3,
    timeout = 30000,
    responseMimeType = null
  } = options;

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      ...(responseMimeType && { responseMimeType })
    }
  };

  const makeApiCall = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Emote-Journal/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  // Retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiManager.makeRequest(makeApiCall);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Gemini API call failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Input validation utility
export function validateInput(text, maxLength = 10000) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  if (text.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  // Basic sanitization - remove potentially harmful content
  const sanitized = text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
    
  if (!sanitized) {
    throw new Error('Input contains no valid content');
  }
  
  return sanitized;
}

export default apiManager;