import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import crypto from 'crypto';
import Redis from 'ioredis';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Redis (Provide your connection string via env vars)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 1. Zod Schemas
const stepSchemas = {
  GENRE: z.object({
    genre: z.enum(['Self Help', 'Business', 'Finance', 'Marketing', 'Psychology', 'Technology', 'Biography', 'Health', 'Education', 'Other']),
  }),
  AUTHOR_NAME: z.object({
    authorName: z.string().trim().min(2),
  }),
  IDEA_TITLE: z.object({
    workingTitle: z.string().trim().min(1),
    ideaDescription: z.string().trim().min(5),
  }),
  PREVIEW: z.object({
    confirmedPreview: z.boolean().default(true),
  }),
  DETAILS: z.object({
    currentStage: z.enum(['Just an idea', 'Rough notes / outline', 'Some chapters written', 'Full manuscript ready']),
    servicesRequired: z.array(z.string()).min(1),
    additionalNotes: z.string().optional(),
  }),
};

// 2. O(1) Dictionary for Branch Resolution (Highly optimized)
const branchEngine = {
  GENRE: () => ({ nextStep: 'AUTHOR_NAME' }),
  
  AUTHOR_NAME: (session) => ({ 
    nextStep: 'IDEA_TITLE',
    previewState: { bookAuthor: session.authorName } 
  }),
  
  IDEA_TITLE: (session) => {
    const slug = encodeURIComponent(session.authorName?.toLowerCase().replace(/\s+/g, '-'));
    return {
      nextStep: 'PREVIEW',
      previewState: {
        bookCoverSubtitle: session.workingTitle.toUpperCase(),
        bookAuthor: session.authorName,
        amazonUrl: `amazon.com/dp/${slug}`,
        genreTag: session.genre,
      },
    };
  },
  
  PREVIEW: () => ({ nextStep: 'DETAILS' }),
  
  DETAILS: () => ({ nextStep: 'COMPLETED', isComplete: true }),
};

// 3. The Optimized Progression Endpoint
app.post('/api/funnel/next', async (req, res) => {
  try {
    let { sessionId, currentStep = 'GENRE', data = {} } = req.body;
    let sessionData = {};

    // Retrieve existing session from Redis (if provided)
    if (sessionId) {
      const cachedSession = await redis.get(`funnel:${sessionId}`);
      if (cachedSession) sessionData = JSON.parse(cachedSession);
    } else {
      sessionId = crypto.randomUUID();
    }

    // Validate request payload
    const schema = stepSchemas[currentStep];
    if (!schema) {
      return res.status(400).json({ success: false, message: 'Invalid step' });
    }
    const validatedData = schema.parse(data);

    // Merge state efficiently
    const updatedState = { ...sessionData, ...validatedData };

    // Resolve branch logic in O(1) time
    const resolution = branchEngine[currentStep] 
      ? branchEngine[currentStep](updatedState) 
      : null;

    if (!resolution) {
      return res.status(500).json({ success: false, message: 'Branch execution failed' });
    }

    // Save back to Redis with a 24-hour expiration (86400 seconds)
    await redis.set(`funnel:${sessionId}`, JSON.stringify(updatedState), 'EX', 86400);

    return res.status(200).json({
      success: true,
      sessionId,
      currentStep: resolution.nextStep,
      branchMetadata: resolution,
      draft: updatedState,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 4. Fast Retrieval Endpoint
app.get('/api/funnel/:sessionId', async (req, res) => {
  const cachedSession = await redis.get(`funnel:${req.params.sessionId}`);
  
  if (!cachedSession) {
    return res.status(404).json({ success: false, message: 'Session expired or not found' });
  }

  return res.status(200).json({
    success: true,
    sessionId: req.params.sessionId,
    draft: JSON.parse(cachedSession),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Optimized API running on port ${PORT}`));