import asyncio

from app.db.models import User
from app.db.session import get_db_context
from sqlalchemy import select, update

TEST_EMAILS = [
    "admin-a@test.local",
    "super-instructor-a@test.local",
    "instructor-a@test.local",
    "learner-a@test.local",
    "learner-b@test.local",
    "admin-b@test.local",
]


async def main():
    async with get_db_context() as db:
        # Get Admin A's tenant
        result = await db.execute(
            select(User).where(User.email == "admin-a@test.local")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("Admin A not found!")
            return

        target_tenant_id = admin.tenant_id
        print(f"Target Tenant ID (from Admin A): {target_tenant_id}")

        # Update all others
        for email in TEST_EMAILS:
            if email == "admin-a@test.local":
                continue

            print(f"Updating {email} to tenant {target_tenant_id}...")
            await db.execute(
                update(User)
                .where(User.email == email)
                .values(tenant_id=target_tenant_id)
            )

        await db.commit()
        print("Tenants unified.")


if __name__ == "__main__":
    import os
    import sys

    sys.path.append(os.getcwd())
    asyncio.run(main())
