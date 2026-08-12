Authorly Book Funnel API
A high-performance, stateless Node.js backend for managing a multi-step onboarding funnel for book publishing. This API handles dynamic branching logic, validates step-by-step user inputs, and maintains draft states using Redis for sub-millisecond data retrieval.

🚀 Features
Stateless Architecture: Uses Redis for state management, eliminating memory leaks and allowing the app to scale horizontally across multiple instances or serverless environments.

O(1) Branching Logic: Step transitions are computed instantly using dictionary lookups instead of slow, nested switch/case statements.

Type-Safe Validation: Strict request payload validation using Zod to ensure data integrity at every step of the funnel.

Auto-Cleanup: Incomplete funnel sessions are automatically purged from Redis after 24 hours (TTL) to prevent database bloat.

Dynamic Previews: Generates contextual metadata (like Amazon preview URLs and book cover text) on the fly based on user input.

🛠️ Tech Stack
Runtime: Node.js

Framework: Express.js

Caching/Database: Redis (via ioredis)

Validation: Zod

Security/Config: CORS, Crypto (UUIDs), dotenv

📦 Installation & Setup
1. Prerequisites
Node.js (v18 or higher)

Redis Server (Running locally or via a managed provider like Upstash/AWS ElastiCache)

2. Clone and Install
Bash
git clone <your-repo-url>
cd authorly-funnel-api
npm install
3. Environment Variables
Create a .env file in the root directory and add your Redis connection string:

Code snippet
PORT=3000
REDIS_URL=redis://localhost:6379
# For production, use your actual Redis URI (e.g., rediss://default:password@host:port)
4. Start the Server
Bash
# Development mode
node server.js
📖 API Reference
1. Advance Funnel Step
Processes data for the current step, saves the draft to Redis, and computes the next step.

Endpoint: POST /api/funnel/next

Request Body Example (Step 3: IDEA_TITLE):

JSON
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "currentStep": "IDEA_TITLE",
  "data": {
    "workingTitle": "dammn",
    "ideaDescription": "damn is life"
  }
}
(Note: Omit sessionId on the very first step, and the API will generate one for you).

Response Example:

JSON
{
  "success": true,
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "currentStep": "PREVIEW",
  "branchMetadata": {
    "nextStep": "PREVIEW",
    "previewState": {
      "bookCoverSubtitle": "DAMMN",
      "bookAuthor": "harshit soni",
      "amazonUrl": "amazon.com/dp/harshit-soni",
      "genreTag": "Self Help"
    }
  },
  "draft": {
    "genre": "Self Help",
    "authorName": "harshit soni",
    "workingTitle": "dammn",
    "ideaDescription": "damn is life"
  }
}
2. Retrieve Session State
Fetches the current draft state of a specific session. Useful for allowing users to resume their progress if they refresh the page.

Endpoint: GET /api/funnel/:sessionId

Response Example:

JSON
{
  "success": true,
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "draft": {
    "genre": "Self Help",
    "authorName": "harshit soni"
  }
}