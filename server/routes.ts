import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import { insertImageSchema, insertSavedImageSchema, insertUserArtStyleSchema, insertUserProfileSchema, insertCustomModelSchema, updateCustomModelSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generateImageToImage, generateTextToImage } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Initialize Gemini AI with the provided API key from environment
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!googleApiKey) {
    console.warn("Warning: No Google API key found in environment variables. AI features will be disabled.");
  }
  
  const ai = googleApiKey ? new GoogleGenAI({ apiKey: googleApiKey }) : null;

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Prompt enhancement endpoint
  app.post("/api/enhance-prompt", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required and must be a string" });
      }

      if (!ai) {
        return res.status(503).json({ 
          error: "AI service unavailable", 
          details: "Google API key not configured" 
        });
      }

      const enhancementPrompt = `You are an expert AI image prompt engineer. Your task is to enhance and improve image generation prompts to make them more detailed, creative, and effective for AI image generation.

Given the basic prompt: "${prompt}"

Please enhance this prompt by:
1. Adding specific visual details (lighting, colors, composition)
2. Including artistic style information if appropriate
3. Adding technical photography/art terms that improve image quality
4. Maintaining the original intent while making it more descriptive
5. Keeping it concise but detailed (aim for 1-2 sentences)

Return only the enhanced prompt, nothing else.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: enhancementPrompt,
      });

      const enhancedPrompt = response.text?.trim() || prompt;

      res.json({ enhancedPrompt });
      
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "Failed to enhance prompt", details: errorMessage });
    }
  });

  // Image endpoints
  app.post("/api/images", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validation = insertImageSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const { prompt, negativePrompt, model, width, height, imageData, artStyle, userDisplayName } = validation.data;
      
      const newImage = await storage.createImage({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt?.trim() || null,
        model,
        width,
        height,
        imageData,
        artStyle,
        userDisplayName: userDisplayName || null
      });
      
      res.json(newImage);
    } catch (error) {
      console.error('Error saving image:', error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const images = await storage.getImages(limit, offset);
      res.json(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getImageById(id);
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // Saved images endpoints
  app.post("/api/saved-images", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validation = insertSavedImageSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const { userId, prompt, negativePrompt, model, width, height, imageData, artStyle, originalImageId } = validation.data;
      
      const savedImage = await storage.createSavedImage({
        userId,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt?.trim() || null,
        model,
        width,
        height,
        imageData,
        artStyle,
        originalImageId: originalImageId || null
      });
      
      res.json(savedImage);
    } catch (error) {
      console.error('Error saving image to favorites:', error);
      res.status(500).json({ error: "Failed to save image to favorites" });
    }
  });

  app.get("/api/saved-images", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const savedImages = await storage.getSavedImagesByUserId(userId, limit, offset);
      res.json(savedImages);
    } catch (error) {
      console.error('Error fetching saved images:', error);
      res.status(500).json({ error: "Failed to fetch saved images" });
    }
  });

  app.delete("/api/saved-images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavedImage(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Saved image not found" });
      }
      
      res.json({ success: true, message: "Image removed from favorites" });
    } catch (error) {
      console.error('Error deleting saved image:', error);
      res.status(500).json({ error: "Failed to remove image from favorites" });
    }
  });

  // User Art Style endpoints
  app.post("/api/user-art-styles", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validation = insertUserArtStyleSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const { userId, name, description, keywords, inspiration, characteristics } = validation.data;
      
      const newArtStyle = await storage.createUserArtStyle({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        keywords: keywords?.trim() || null,
        inspiration: inspiration?.trim() || null,
        characteristics: characteristics?.trim() || null
      });
      
      res.json(newArtStyle);
    } catch (error) {
      console.error('Error creating user art style:', error);
      res.status(500).json({ error: "Failed to create art style" });
    }
  });

  app.get("/api/user-art-styles", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const artStyles = await storage.getUserArtStylesByUserId(userId);
      res.json(artStyles);
    } catch (error) {
      console.error('Error fetching user art styles:', error);
      res.status(500).json({ error: "Failed to fetch art styles" });
    }
  });

  app.get("/api/user-art-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const artStyle = await storage.getUserArtStyleById(id);
      
      if (!artStyle) {
        return res.status(404).json({ error: "Art style not found" });
      }
      
      res.json(artStyle);
    } catch (error) {
      console.error('Error fetching art style:', error);
      res.status(500).json({ error: "Failed to fetch art style" });
    }
  });

  app.put("/api/user-art-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body using Zod schema (partial update)
      const validation = insertUserArtStyleSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const updates = validation.data;
      const updatedArtStyle = await storage.updateUserArtStyle(id, updates);
      
      if (!updatedArtStyle) {
        return res.status(404).json({ error: "Art style not found" });
      }
      
      res.json(updatedArtStyle);
    } catch (error) {
      console.error('Error updating art style:', error);
      res.status(500).json({ error: "Failed to update art style" });
    }
  });

  app.delete("/api/user-art-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUserArtStyle(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Art style not found" });
      }
      
      res.json({ success: true, message: "Art style deleted successfully" });
    } catch (error) {
      console.error('Error deleting art style:', error);
      res.status(500).json({ error: "Failed to delete art style" });
    }
  });

  // Global art styles endpoint (shows all user-created art styles)
  app.get("/api/art-styles", async (req, res) => {
    try {
      const artStyles = await storage.getAllUserArtStyles();
      res.json(artStyles);
    } catch (error) {
      console.error('Error fetching all art styles:', error);
      res.status(500).json({ error: "Failed to fetch art styles" });
    }
  });

  // Text-to-image generation endpoint
  app.post("/api/text-to-image", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: "Missing required field",
          details: "prompt is required"
        });
      }

      if (!googleApiKey) {
        return res.status(503).json({
          error: "AI service unavailable",
          details: "Gemini API key not configured"
        });
      }

      const result = await generateTextToImage(prompt);

      res.json({
        success: true,
        generatedImage: `data:image/png;base64,${result.imageData}`,
        description: result.description
      });

    } catch (error) {
      console.error('Error in text-to-image generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Failed to generate text-to-image",
        details: errorMessage
      });
    }
  });

  // Image-to-image generation endpoint using gemini-2.0-flash-exp
  app.post("/api/image-to-image", async (req, res) => {
    try {
      const { images, transformPrompt } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0 || !transformPrompt) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "images array and transformPrompt are required"
        });
      }

      if (images.length > 5) {
        return res.status(400).json({
          error: "Too many images",
          details: "Maximum 5 images allowed"
        });
      }

      if (!googleApiKey) {
        return res.status(503).json({
          error: "AI service unavailable",
          details: "Gemini API key not configured"
        });
      }

      // Process all images to remove data URL prefix if present
      const processedImages = images.map(img => ({
        data: img.data.includes(',') ? img.data.split(',')[1] : img.data,
        type: img.type
      }));

      const result = await generateImageToImage(
        processedImages,
        transformPrompt
      );

      res.json({
        success: true,
        generatedImage: `data:image/png;base64,${result.imageData}`,
        description: result.description
      });

    } catch (error) {
      console.error('Error in image-to-image generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Failed to generate image-to-image transformation",
        details: errorMessage
      });
    }
  });

  // User Profile endpoints
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let profile = await storage.getUserProfileByUserId(userId);
      
      // If profile doesn't exist, create a default one
      if (!profile) {
        profile = await storage.createUserProfile({
          userId,
          displayName: null,
          bio: null,
          location: null,
          website: null,
          phone: null,
          company: null,
          jobTitle: null,
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true,
          dataSharing: false,
          defaultImageModel: 'gemini-2.5-flash',
          defaultImageQuality: 'standard',
          defaultImageSize: '1024x1024',
          autoSaveGenerations: true,
          twitterHandle: null,
          instagramHandle: null,
          linkedinUrl: null,
          githubHandle: null,
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    try {
      const { userId, ...updates } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if profile exists
      let profile = await storage.getUserProfileByUserId(userId);
      
      if (!profile) {
        // Create new profile with the updates
        profile = await storage.createUserProfile({
          userId,
          ...updates,
        });
      } else {
        // Update existing profile
        profile = await storage.updateUserProfile(userId, updates);
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Initialize user profile on registration
  app.post("/api/auth/init-profile", async (req, res) => {
    try {
      const { userId, displayName } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if profile already exists
      const existingProfile = await storage.getUserProfileByUserId(userId);
      
      if (existingProfile) {
        return res.json(existingProfile);
      }

      // Create new user profile with default settings
      const profile = await storage.createUserProfile({
        userId,
        displayName: displayName || null,
        bio: null,
        location: null,
        website: null,
        phone: null,
        company: null,
        jobTitle: null,
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        dataSharing: false,
        defaultImageModel: 'gemini-2.5-flash',
        defaultImageQuality: 'standard',
        defaultImageSize: '1024x1024',
        autoSaveGenerations: true,
        twitterHandle: null,
        instagramHandle: null,
        linkedinUrl: null,
        githubHandle: null,
      });
      
      res.json(profile);
    } catch (error) {
      console.error('Error initializing user profile:', error);
      res.status(500).json({ error: "Failed to initialize user profile" });
    }
  });

  // Custom Model endpoints
  app.post("/api/custom-models", async (req, res) => {
    try {
      const validation = insertCustomModelSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const newModel = await storage.createCustomModel(validation.data);
      res.json(newModel);
    } catch (error) {
      console.error('Error creating custom model:', error);
      res.status(500).json({ error: "Failed to create custom model" });
    }
  });

  app.get("/api/custom-models", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const models = await storage.getCustomModelsByUserId(userId);
      // Remove API keys before sending to client for security
      const modelsWithoutKeys = models.map(({ apiKey, ...model }) => model);
      res.json(modelsWithoutKeys);
    } catch (error) {
      console.error('Error fetching custom models:', error);
      res.status(500).json({ error: "Failed to fetch custom models" });
    }
  });

  app.get("/api/custom-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const model = await storage.getCustomModelById(id);
      
      if (!model) {
        return res.status(404).json({ error: "Custom model not found" });
      }
      
      // Remove API key before sending to client for security
      const { apiKey, ...modelWithoutKey } = model;
      res.json(modelWithoutKey);
    } catch (error) {
      console.error('Error fetching custom model:', error);
      res.status(500).json({ error: "Failed to fetch custom model" });
    }
  });

  app.put("/api/custom-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = updateCustomModelSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      const updatedModel = await storage.updateCustomModel(id, validation.data);
      
      if (!updatedModel) {
        return res.status(404).json({ error: "Custom model not found" });
      }
      
      res.json(updatedModel);
    } catch (error) {
      console.error('Error updating custom model:', error);
      res.status(500).json({ error: "Failed to update custom model" });
    }
  });

  app.delete("/api/custom-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomModel(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Custom model not found" });
      }
      
      res.json({ success: true, message: "Custom model deleted successfully" });
    } catch (error) {
      console.error('Error deleting custom model:', error);
      res.status(500).json({ error: "Failed to delete custom model" });
    }
  });

  // Generate image using custom model endpoint
  app.post("/api/generate-with-custom-model", async (req, res) => {
    try {
      const { modelId, prompt } = req.body;

      if (!modelId || !prompt) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "modelId and prompt are required"
        });
      }

      const customModel = await storage.getCustomModelById(modelId);
      
      if (!customModel) {
        return res.status(404).json({
          error: "Custom model not found",
          details: "The specified model ID does not exist"
        });
      }

      if (!customModel.isActive) {
        return res.status(400).json({
          error: "Model inactive",
          details: "This custom model is currently inactive"
        });
      }

      // Handle Hugging Face models
      if (customModel.modelType === 'huggingface') {
        try {
          const hfModelId = customModel.apiUrl; // For HF, apiUrl stores the model ID
          const hfApiUrl = `https://api-inference.huggingface.co/models/${hfModelId}`;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          // Add Authorization header if API key is provided
          if (customModel.apiKey) {
            headers['Authorization'] = `Bearer ${customModel.apiKey}`;
          }
          
          // Build request body for Hugging Face API
          const hfRequestBody: Record<string, any> = {
            inputs: prompt,
          };
          
          // Add parameters that Hugging Face text-to-image models typically support
          const hfParameters: Record<string, any> = {};
          
          if (req.body.options) {
            const opts = req.body.options;
            
            // Hugging Face uses 'negative_prompt' parameter
            if (opts.negative_prompt) {
              hfParameters.negative_prompt = opts.negative_prompt;
            }
            
            // Width and height for models that support it
            if (opts.width) hfParameters.width = opts.width;
            if (opts.height) hfParameters.height = opts.height;
            
            // Seed for reproducibility
            if (opts.seed !== undefined) {
              hfParameters.seed = opts.seed;
            }
            
            // Guidance scale (common parameter)
            if (opts.guidance_scale) {
              hfParameters.guidance_scale = opts.guidance_scale;
            }
            
            // Number of inference steps
            if (opts.num_inference_steps) {
              hfParameters.num_inference_steps = opts.num_inference_steps;
            }
          }
          
          // Only add parameters object if we have any parameters
          if (Object.keys(hfParameters).length > 0) {
            hfRequestBody.parameters = hfParameters;
          }
          
          const response = await fetch(hfApiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(hfRequestBody),
          });

          const contentType = response.headers.get('content-type') || '';

          if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              errorDetails = errorJson.error || errorText;
              
              // Handle model loading or queue scenarios
              if (response.status === 503 && errorJson.estimated_time) {
                return res.status(503).json({
                  error: "Model is loading",
                  details: `The model is currently loading. Please try again in ${errorJson.estimated_time} seconds.`,
                  estimatedTime: errorJson.estimated_time
                });
              }
            } catch {
              // If not JSON, use as is
            }
            throw new Error(`Hugging Face API error: ${response.status} - ${errorDetails}`);
          }

          // Check if response is JSON (model loading or error)
          if (contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            if (jsonResponse.estimated_time) {
              return res.status(503).json({
                error: "Model is loading",
                details: `The model is currently loading. Please try again in ${jsonResponse.estimated_time} seconds.`,
                estimatedTime: jsonResponse.estimated_time
              });
            }
            throw new Error('Unexpected JSON response from Hugging Face API');
          }

          // Hugging Face returns binary image data
          const imageBuffer = await response.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          
          // Determine image format from content-type
          let imageFormat = 'png';
          if (contentType.includes('image/jpeg')) {
            imageFormat = 'jpeg';
          } else if (contentType.includes('image/webp')) {
            imageFormat = 'webp';
          } else if (contentType.includes('image/png')) {
            imageFormat = 'png';
          }
          
          res.json({
            success: true,
            generatedImage: `data:image/${imageFormat};base64,${base64Image}`
          });

        } catch (fetchError) {
          console.error('Error calling Hugging Face API:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          res.status(502).json({
            error: "Failed to generate image with Hugging Face model",
            details: errorMessage
          });
        }
      } 
      // Handle custom API models
      else {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // Add Authorization header only if API key is provided
          if (customModel.apiKey) {
            headers['Authorization'] = `Bearer ${customModel.apiKey}`;
          }

          // Build request body with common parameter names that most APIs understand
          const requestBody: Record<string, any> = {
            prompt: prompt,
            inputs: prompt, // Some APIs use 'inputs' instead of 'prompt'
          };
          
          // Add options with flexible parameter naming for compatibility
          if (req.body.options) {
            const opts = req.body.options;
            
            // Dimensions - most APIs understand these
            if (opts.width) requestBody.width = opts.width;
            if (opts.height) requestBody.height = opts.height;
            
            // Negative prompt - try multiple common names
            if (opts.negative_prompt) {
              requestBody.negative_prompt = opts.negative_prompt;
              requestBody.negativePrompt = opts.negative_prompt;
            }
            
            // Seed - for reproducibility
            if (opts.seed !== undefined) {
              requestBody.seed = opts.seed;
            }
            
            // Pass through any other options that might be API-specific
            // Art style and place can be used by APIs that support them
            if (opts.art_style) requestBody.art_style = opts.art_style;
            if (opts.place) requestBody.place = opts.place;
            if (opts.aspect_ratio) requestBody.aspect_ratio = opts.aspect_ratio;
          }

          const response = await fetch(customModel.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              // Try to extract meaningful error message from various formats
              errorDetails = errorJson.error || 
                            errorJson.message || 
                            errorJson.detail || 
                            errorJson.details ||
                            JSON.stringify(errorJson);
            } catch {
              // If not JSON, use as is
            }
            throw new Error(`Custom model API error: ${response.status} - ${errorDetails}`);
          }

          const contentType = response.headers.get('content-type') || '';
          let generatedImage: string | null = null;

          // Handle different response types based on content-type
          if (contentType.includes('image/')) {
            // Binary image response - convert to base64
            const imageBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            
            let imageFormat = 'png';
            if (contentType.includes('image/jpeg')) {
              imageFormat = 'jpeg';
            } else if (contentType.includes('image/webp')) {
              imageFormat = 'webp';
            } else if (contentType.includes('image/png')) {
              imageFormat = 'png';
            }
            
            generatedImage = `data:image/${imageFormat};base64,${base64Image}`;
          } else if (contentType.includes('text/plain')) {
            // Plain text response - could be URL or base64
            generatedImage = await response.text();
          } else {
            // Assume JSON response - extract image from various possible formats
            const data = await response.json();
            
            // Helper function to recursively search for image data
            const extractImage = (obj: any): string | null => {
              if (!obj) return null;
              
              // Direct string
              if (typeof obj === 'string') {
                if (obj.startsWith('data:image/') || obj.startsWith('http') || obj.length > 100) {
                  return obj;
                }
              }
              
              // Common field names
              const imageFields = ['image', 'url', 'generatedImage', 'output', 'b64_json', 'artifact'];
              for (const field of imageFields) {
                if (obj[field]) {
                  const extracted = extractImage(obj[field]);
                  if (extracted) return extracted;
                }
              }
              
              // Check 'data' field (could be nested)
              if (obj.data) {
                // Handle arrays like data[0].b64_json, data[0].url, etc.
                if (Array.isArray(obj.data) && obj.data.length > 0) {
                  const extracted = extractImage(obj.data[0]);
                  if (extracted) return extracted;
                }
                // Handle nested objects like data.image, data.url
                else if (typeof obj.data === 'object') {
                  const extracted = extractImage(obj.data);
                  if (extracted) return extracted;
                }
                // Handle direct string
                else if (typeof obj.data === 'string') {
                  return obj.data;
                }
              }
              
              // Handle arrays at top level (images[0], output[0])
              if (Array.isArray(obj) && obj.length > 0) {
                return extractImage(obj[0]);
              }
              
              return null;
            };
            
            generatedImage = extractImage(data);
          }
          
          if (!generatedImage) {
            throw new Error('No image data found in custom model response');
          }
          
          // Normalize base64 strings to data URLs if they're not already
          if (typeof generatedImage === 'string' && 
              !generatedImage.startsWith('data:') && 
              !generatedImage.startsWith('http')) {
            // Detect format from base64 signature
            let format = 'png';
            if (generatedImage.startsWith('/9j/')) {
              format = 'jpeg';
            } else if (generatedImage.startsWith('iVBOR')) {
              format = 'png';
            } else if (generatedImage.startsWith('UklGR')) {
              format = 'webp';
            }
            generatedImage = `data:image/${format};base64,${generatedImage}`;
          }
          
          res.json({
            success: true,
            generatedImage: generatedImage
          });

        } catch (fetchError) {
          console.error('Error calling custom model API:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          res.status(502).json({
            error: "Failed to generate image with custom model",
            details: errorMessage
          });
        }
      }

    } catch (error) {
      console.error('Error in custom model generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Failed to process custom model request",
        details: errorMessage
      });
    }
  });

  // User Profile endpoints
  app.get("/api/user-profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      let profile = await storage.getUserProfileByUserId(userId);
      
      // If profile doesn't exist, create a default one
      if (!profile) {
        profile = await storage.createUserProfile({
          userId,
          displayName: null,
          bio: null,
          location: null,
          website: null,
          phone: null,
          company: null,
          jobTitle: null,
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true,
          dataSharing: false,
          defaultImageModel: 'gemini-2.5-flash',
          defaultImageQuality: 'standard',
          defaultImageSize: '1024x1024',
          useOriginalModelsOnly: false,
          autoSaveGenerations: true,
          twitterHandle: null,
          instagramHandle: null,
          linkedinUrl: null,
          githubHandle: null,
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put("/api/user-profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate request body using Zod schema
      const validation = insertUserProfileSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: errorMessage.toString()
        });
      }
      
      // Check if profile exists
      let profile = await storage.getUserProfileByUserId(userId);
      
      if (!profile) {
        // Create new profile
        profile = await storage.createUserProfile({
          userId,
          ...validation.data
        });
      } else {
        // Update existing profile
        profile = await storage.updateUserProfile(userId, validation.data);
      }
      
      if (!profile) {
        return res.status(404).json({ error: "Failed to update profile" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.delete("/api/user-profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // TODO: CRITICAL SECURITY ISSUE - Add Firebase authentication verification
      // This endpoint should verify the Firebase ID token and ensure the requesting
      // user matches the userId being deleted. Without this, anyone can delete any user's data.
      // Implementation should use Firebase Admin SDK to verify the token:
      // const token = req.headers.authorization?.replace('Bearer ', '');
      // const decodedToken = await admin.auth().verifyIdToken(token);
      // if (decodedToken.uid !== userId) return res.status(403).json({ error: 'Forbidden' });
      
      const success = await storage.deleteUserAccount(userId);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete account" });
      }
      
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: "Failed to delete user account" });
    }
  });

  // Admin routes
  app.get("/api/admin/check/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const isAdmin = await storage.isAdmin(email);
      res.json({ isAdmin });
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  app.get("/api/admin/images", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const images = await storage.getAllImages(limit, offset);
      
      console.log(`[Admin] Fetched ${images.length} images for admin panel`);
      images.forEach(img => {
        console.log(`[Admin] Image ${img.id}: userDisplayName="${img.userDisplayName || 'NOT SET'}"`);
      });
      
      res.json(images);
    } catch (error) {
      console.error('Error fetching admin images:', error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.patch("/api/admin/images/:id/moderation", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['approved', 'pending', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid moderation status" });
      }
      
      const image = await storage.updateImageModerationStatus(id, status);
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error('Error updating image moderation status:', error);
      res.status(500).json({ error: "Failed to update moderation status" });
    }
  });

  app.get("/api/admin/user-profiles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const profiles = await storage.getAllUserProfiles(limit, offset);
      
      // Enrich profiles with statistics
      const enrichedProfiles = await Promise.all(
        profiles.map(async (profile) => {
          const stats = await storage.getUserStatistics(profile.userId);
          return {
            ...profile,
            isOnline: profile.isOnline || false,
            lastActiveAt: profile.lastActive,
            totalImagesGenerated: stats.totalImagesGenerated,
            totalImagesSaved: stats.totalImagesSaved,
            totalArtStylesCreated: stats.totalArtStylesCreated,
            totalCustomModels: stats.totalCustomModels,
          };
        })
      );
      
      res.json(enrichedProfiles);
    } catch (error) {
      console.error('Error fetching admin user profiles:', error);
      res.status(500).json({ error: "Failed to fetch user profiles" });
    }
  });

  app.get("/api/admin/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/admin/art-styles", async (req, res) => {
    try {
      const artStyles = await storage.getAllUserArtStyles();
      res.json(artStyles);
    } catch (error) {
      console.error('Error fetching art styles:', error);
      res.status(500).json({ error: "Failed to fetch art styles" });
    }
  });

  app.delete("/api/admin/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[Admin] Deleting image: ${id}`);
      const success = await storage.deleteImage(id);
      
      if (!success) {
        console.log(`[Admin] Image not found: ${id}`);
        return res.status(404).json({ error: "Image not found" });
      }
      
      console.log(`[Admin] Image deleted successfully: ${id}`);
      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error('[Admin] Error deleting image:', error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Admin] Deleting user: ${userId}`);
      const success = await storage.deleteUserProfile(userId);
      
      if (!success) {
        console.log(`[Admin] User not found: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[Admin] User deleted successfully: ${userId}`);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error('[Admin] Error deleting user:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:userId/ban", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Admin] Banning user: ${userId}`);
      const profile = await storage.banUser(userId);
      
      if (!profile) {
        console.log(`[Admin] User not found for ban: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[Admin] User banned successfully: ${userId}`);
      res.json(profile);
    } catch (error) {
      console.error('[Admin] Error banning user:', error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.patch("/api/admin/users/:userId/unban", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Admin] Unbanning user: ${userId}`);
      const profile = await storage.unbanUser(userId);
      
      if (!profile) {
        console.log(`[Admin] User not found for unban: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[Admin] User unbanned successfully: ${userId}`);
      res.json(profile);
    } catch (error) {
      console.error('[Admin] Error unbanning user:', error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.get("/api/admin/users/:userId/statistics", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserStatistics(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
