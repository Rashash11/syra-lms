import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.models import TimelineEvent, User, Course, CourseStatus, Branch
from app.config import get_settings
from app.auth.jwt import create_access_token, verify_token
from sqlalchemy import func, select

# Adjust database URL for async
settings = get_settings()
DATABASE_URL = settings.async_database_url

async def check_timeline_events():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # ... (TimelineEvent check skipped for brevity if needed, but keeping it is fine)
        
        print("Checking Auth Flow...")
        try:
            # Get a user first
            user_res = await session.execute(select(User.id, User.email).limit(1))
            user_row = user_res.first()
            
            if user_row:
                user_id = user_row.id
                email = user_row.email
                print(f"Found user: {user_id} ({email})")
                
                # Create token
                token = create_access_token(user_id=user_id, email=email, role="ADMIN")
                print(f"Created token: {token[:20]}...")
                
                # Verify token
                payload = await verify_token(token, session)
                print(f"Token verified successfully! Payload: {payload}")
            else:
                print("No user found.")
        except Exception as e:
            print(f"Auth verification failed: {e}")
            import traceback
            traceback.print_exc()



if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_timeline_events())
