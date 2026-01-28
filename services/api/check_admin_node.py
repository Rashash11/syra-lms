import asyncio
from app.db.session import get_db_context
from sqlalchemy import select, text
from app.db.models import User

async def check_admin_node():
    async with get_db_context() as db:
        # Check admin user
        result = await db.execute(
            select(User).where(User.email == 'admin@portal.com')
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f'Admin user: {user.email}')
            print(f'  node_id: {user.node_id}')
            print(f'  role: {user.role}')
            print(f'  active_role: {user.active_role}')
        else:
            print('Admin user not found!')
        
        # Check users by node_id
        result2 = await db.execute(
            text('SELECT COUNT(*) as total, node_id FROM "User" GROUP BY node_id')
        )
        
        print('\nUsers by node_id:')
        for row in result2:
            print(f'  node_id={row.node_id}: {row.total} users')
        
        # Check total users
        result3 = await db.execute(text('SELECT COUNT(*) as total FROM "User"'))
        total = result3.scalar()
        print(f'\nTotal users in database: {total}')

asyncio.run(check_admin_node())
