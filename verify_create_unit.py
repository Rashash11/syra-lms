import asyncio
import sys
import os

# Add service directory to path to import app modules
sys.path.append("e:/lms/services/api")

from app.db.session import async_session_factory
from app.db.models import Course, User, UnitType, UnitStatus, CourseUnit
from sqlalchemy import select

async def main():
    async with async_session_factory() as db:
        # 1. Find a course
        result = await db.execute(select(Course).limit(1))
        course = result.scalar_one_or_none()
        if not course:
            print("No courses found. creating one...")
            # Create a dummy course if needed, but assuming seed data exists
            return

        print(f"Using course: {course.id} ({course.title})")

        # 2. Simulate Create Unit Logic (as if calling the API)
        # We can't easily call the API handler directly without mocking request/context, 
        # but we can verify the DB logic or just use requests to hit the running API if it was running.
        # Since I can't hit the running API from here (I am inside the environment but maybe ports are not exposed to this script easily without a client),
        # I will simulate the DB insertion logic I just wrote to ensure it works.
        
        # Actually, I should use `httpx` or similar to hit the local API if possible, 
        # but the server might not be running in the background for me to hit.
        # The instructions say "You are pair programming...". I can assume the server is running?
        # "Start Backend server" was a todo.
        
        # Let's try to verify the logic by creating a unit manually using the same logic as the endpoint.
        
        unit_type_str = "VIDEO"
        try:
            unit_type = UnitType(unit_type_str)
        except ValueError:
            unit_type = UnitType.TEXT
            
        print(f"Resolved Type: {unit_type}")
        
        new_unit = CourseUnit(
            course_id=course.id,
            section_id=None,
            type=unit_type,
            title="Test Video Unit",
            status=UnitStatus.DRAFT,
            config={"source": "youtube"},
            order_index=999
        )
        db.add(new_unit)
        await db.commit()
        await db.refresh(new_unit)
        
        print(f"Created Unit: {new_unit.id}")
        print(f"Type: {new_unit.type}")
        print(f"Config: {new_unit.config}")
        
        # Verify we can fetch it back
        result = await db.execute(select(CourseUnit).where(CourseUnit.id == new_unit.id))
        fetched = result.scalar_one()
        print(f"Fetched Unit Type: {fetched.type}")
        
        # Clean up
        await db.delete(fetched)
        await db.commit()
        print("Cleaned up.")

if __name__ == "__main__":
    asyncio.run(main())
