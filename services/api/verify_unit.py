import asyncio
import os

# flake8: noqa
import sys

# Ensure current directory is in path
sys.path.append(os.getcwd())

from app.db.models import Course, CourseUnit, UnitStatus, UnitType, User
from app.db.session import async_session_factory
from sqlalchemy import select


async def main():
    async with async_session_factory() as db:
        # 1. Find a course
        result = await db.execute(select(Course).limit(1))
        course = result.scalar_one_or_none()
        if not course:
            print("No courses found.")
            return

        print(f"Using course: {course.id} ({course.title})")

        # 2. Test Unit Creation Logic
        unit_type = UnitType.VIDEO
        print(f"Creating unit of type: {unit_type}")

        new_unit = CourseUnit(
            course_id=course.id,
            section_id=None,
            type=unit_type,
            title="Test Video Unit",
            status=UnitStatus.DRAFT,
            config={"source": "youtube"},
            order_index=999,
        )
        db.add(new_unit)
        await db.commit()
        await db.refresh(new_unit)

        print(f"Created Unit: {new_unit.id}")
        print(f"Type: {new_unit.type}")
        print(f"Status: {new_unit.status}")

        # Clean up
        await db.delete(new_unit)
        await db.commit()
        print("Cleaned up.")


if __name__ == "__main__":
    asyncio.run(main())
