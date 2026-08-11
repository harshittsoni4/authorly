from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

app = FastAPI(title="Authorly Book Flow API")

class GenreEnum(str, Enum):
    SELF_HELP = "Self Help"
    BUSINESS = "Business"
    FINANCE = "Finance"
    MARKETING = "Marketing"
    PSYCHOLOGY = "Psychology"
    TECHNOLOGY = "Technology"
    BIOGRAPHY = "Biography"
    HEALTH = "Health"
    EDUCATION = "Education"
    OTHER = "Other"

class StageEnum(str, Enum):
    JUST_AN_IDEA = "Just an idea"
    ROUGH_NOTES = "Rough notes / outline"
    SOME_CHAPTERS = "Some chapters written"
    MANUSCRIPT_READY = "Full manuscript ready"

class ServiceEnum(str, Enum):
    FULL_PACKAGE = "Full ghostwriting + cover + Amazon publishing"
    COVER_ONLY = "Cover design only"
    FORMATTING_ONLY = "Formatting + Amazon publishing only"
    NEED_GUIDANCE = "Not sure - need guidance"

class BookSubmissionRequest(BaseModel):
    genre: GenreEnum
    author_name: str = Field(..., min_length=1)
    working_title: str = Field(..., min_length=1)
    idea_description: str = Field(..., min_length=1)
    current_stage: StageEnum
    services_required: List[ServiceEnum] = Field(..., min_items=1)
    additional_notes: Optional[str] = None

@app.post("/api/book-leads", status_code=status.HTTP_201_CREATED)
async def create_book_lead(payload: BookSubmissionRequest):
    slugified_name = payload.author_name.strip().lower().replace(" ", "-")
    preview_url = f"amazon.com/dp/{slugified_name}"

    lead_record = {
        **payload.dict(),
        "preview_url": preview_url,
        "created_at": datetime.utcnow().isoformat(),
        "status": "NEW_LEAD",
    }

    # TODO: Persist lead_record to DB or trigger CRM webhook
    return {
        "success": True,
        "message": "Lead submitted successfully",
        "data": lead_record,
    }