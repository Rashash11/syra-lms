import enum


class RoleKey(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    LEARNER = "LEARNER"


r = RoleKey.ADMIN
print(f"Value: {r.value}")
print(f"Str: {str(r)}")
print(f"Type: {type(r)}")
