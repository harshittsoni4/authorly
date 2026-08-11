import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

// 1. Validation Schema for the exact questionnaire steps
const BookSubmissionSchema = z.object({
  genre: z.enum([
    "Self Help",
    "Business",
    "Finance",
    "Marketing",
    "Psychology",
    "Technology",
    "Biography",
    "Health",
    "Education",
    "Other",
  ]),
  authorName: z.string().min(1, "Author name is required"),
  workingTitle: z.string().min(1, "Working title is required"),
  ideaDescription: z.string().min(1, "Idea description is required"),
  currentStage: z.enum([
    "Just an idea",
    "Rough notes / outline",
    "Some chapters written",
    "Full manuscript ready",
  ]),
  servicesRequired: z.array(
    z.enum([
      "Full ghostwriting + cover + Amazon publishing",
      "Cover design only",
      "Formatting + Amazon publishing only",
      "Not sure - need guidance",
    ])
  ).nonempty("Select at least one service"),
  additionalNotes: z.string().optional(),
});

// 2. The Endpoint
app.post("/api/book-leads", async (req, res) => {
  try {
    // Validate request body
    const validatedData = BookSubmissionSchema.parse(req.body);

    // Construct preview URL metadata (replicating the Amazon preview screen)
    const slugifiedAuthor = encodeURIComponent(
      validatedData.authorName.toLowerCase().replace(/\s+/g, "-")
    );
    const previewUrl = `amazon.com/dp/${slugifiedAuthor}`;

    const leadRecord = {
      ...validatedData,
      previewUrl,
      createdAt: new Date().toISOString(),
      status: "NEW_LEAD",
    };

    // TODO: Save to your database (PostgreSQL, MongoDB, Supabase, Airtable, etc.)
    console.log("Saving lead to database:", leadRecord);

    // Return the processed lead and dynamic preview details
    return res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      lead: leadRecord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});