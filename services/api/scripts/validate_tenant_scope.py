import asyncio
import os
import sys
from datetime import datetime
from uuid import uuid4

import httpx
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.db.models import (
    Course,
    CourseSection,
    Group,
    GroupCourse,
    GroupMember,
    PasswordResetToken,
    PointsLedger,
    Tenant,
    User,
)
from app.db.session import async_session_factory


async def pick_ids(session):
    t = await session.execute(select(Tenant.id).limit(1))
    tenant_id = t.scalar()
    u = await session.execute(
        select(User.id).where(User.tenant_id == tenant_id).limit(1)
    )
    user_id = u.scalar()
    c = await session.execute(
        select(Course.id).where(Course.tenant_id == tenant_id).limit(1)
    )
    course_id = c.scalar()
    return tenant_id, user_id, course_id


async def run_groups(session, tenant_id, user_id, course_id):
    g = Group(tenant_id=tenant_id, name=f"Group {datetime.utcnow().isoformat()}")
    session.add(g)
    await session.flush()
    gm = GroupMember(
        tenant_id=tenant_id,
        group_id=g.id,
        user_id=user_id,
        added_at=datetime.utcnow(),
    )
    session.add(gm)
    gc = GroupCourse(
        tenant_id=tenant_id,
        group_id=g.id,
        course_id=course_id,
        added_at=datetime.utcnow(),
    )
    session.add(gc)
    await session.commit()
    res = await session.execute(
        select(Group)
        .options(selectinload(Group.members), selectinload(Group.courses))
        .where(Group.id == g.id)
    )
    grp = res.scalar_one()
    print("GROUP_OK", grp.id, len(grp.members), len(grp.courses))


async def run_password_reset_token(session, tenant_id, user_id):
    token = f"tok-{uuid4()}"
    prt = PasswordResetToken(
        tenant_id=tenant_id,
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow(),
    )
    session.add(prt)
    await session.commit()
    res = await session.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    row = res.scalar_one()
    print("PRT_CREATE_OK", row.id)
    row.used_at = datetime.utcnow()
    await session.commit()
    res2 = await session.execute(
        select(PasswordResetToken.used_at).where(PasswordResetToken.id == row.id)
    )
    print("PRT_UPDATE_OK", res2.scalar() is not None)


async def run_points_ledger(session, tenant_id, user_id):
    pl = PointsLedger(
        tenant_id=tenant_id,
        user_id=user_id,
        points=10,
        reason="test",
    )
    session.add(pl)
    await session.commit()
    res = await session.execute(
        select(PointsLedger).where(PointsLedger.user_id == user_id).limit(1)
    )
    print("PL_OK", res.scalar() is not None)


async def run_course_sections(session, tenant_id, course_id):
    # Determine next order_index for this course
    from sqlalchemy import func

    res = await session.execute(
        select(func.max(CourseSection.order_index)).where(
            CourseSection.course_id == course_id
        )
    )
    max_order = res.scalar() or 0
    next_order = int(max_order) + 1
    cs = CourseSection(
        tenant_id=tenant_id,
        course_id=course_id,
        title=f"Section {datetime.utcnow().isoformat()}",
        order_index=next_order,
        drip_enabled=False,
    )
    session.add(cs)
    await session.commit()
    res = await session.execute(
        select(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.order_index)
    )
    rows = res.scalars().all()
    print("CS_OK", len(rows) >= 1)


async def main():
    async with async_session_factory() as session:
        tenant_id, user_id, course_id = await pick_ids(session)
        if not all([tenant_id, user_id, course_id]):
            print("MISSING_BASE_DATA", tenant_id, user_id, course_id)
            return
        await run_groups(session, tenant_id, user_id, course_id)
        await run_password_reset_token(session, tenant_id, user_id)
        await run_points_ledger(session, tenant_id, user_id)
        await run_course_sections(session, tenant_id, course_id)

    # Leak test: compare course counts across two tenants
    try:
        from app.auth.jwt import create_access_token

        # Token for existing tenant
        async with async_session_factory() as session:
            res = await session.execute(
                select(
                    User.id,
                    User.email,
                    User.active_role,
                    User.node_id,
                    User.tenant_id,
                    User.token_version,
                ).limit(1)
            )
            row = res.first()
        role_value = (
            row.active_role.value
            if hasattr(row.active_role, "value")
            else str(row.active_role)
        )
        token_a = create_access_token(
            row.id,
            row.email,
            role_value,
            tenant_id=row.tenant_id,
            node_id=row.node_id,
            token_version=row.token_version or 0,
        )
        # Token for random tenant (no data)
        token_b = create_access_token(
            row.id,
            row.email,
            role_value,
            tenant_id="00000000-0000-0000-0000-000000000000",
            node_id=row.node_id,
            token_version=row.token_version or 0,
        )
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8001") as client:
            r1 = await client.get("/api/courses?limit=5", cookies={"session": token_a})
            r2 = await client.get("/api/courses?limit=5", cookies={"session": token_b})
            c1 = (r1.json().get("total") or 0) if r1.status_code == 200 else -1
            c2 = (r2.json().get("total") or 0) if r2.status_code == 200 else -1
            print(
                "LEAK_TEST_COURSES",
                {"tenantA_total": c1, "tenantB_total": c2, "PASS": c2 == 0},
            )
    except Exception as e:
        print("LEAK_TEST_FAILED", e)


if __name__ == "__main__":
    asyncio.run(main())
