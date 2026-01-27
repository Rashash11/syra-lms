from typing import Annotated

from fastapi import Header, Request

# Default Tenant ID from seed.json
DEFAULT_TENANT_ID = "70f58220-0d04-4ded-89bc-a76ad09ac473"


async def get_tenant_id(
    request: Request,
    x_tenant_id: Annotated[str | None, Header()] = None,
) -> str:
    """
    Resolve Tenant ID from Header, Cookie, Host, or Auth Context.
    """
    # If user is authenticated, use their tenant context set by TenantMiddleware
    if hasattr(request.state, "tenant_id") and request.state.tenant_id:
        return request.state.tenant_id

    if x_tenant_id:
        return x_tenant_id

    return DEFAULT_TENANT_ID
