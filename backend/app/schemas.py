from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---- auth ----
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ---- chat ----
class ChatIn(BaseModel):
    conversation_id: int | None = None
    message: str = Field(min_length=1, max_length=8000)


class ChatOut(BaseModel):
    conversation_id: int
    reply: str
    intent: str
    confidence: float


# ---- notes ----
class NoteIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = ""
    tags: str = ""


class NoteOut(NoteIn):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- tasks ----
class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    priority: str = "medium"
    due: str = ""


class TaskPatch(BaseModel):
    title: str | None = None
    done: bool | None = None
    priority: str | None = None
    due: str | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool
    priority: str
    due: str

    class Config:
        from_attributes = True


# ---- memory ----
class FactIn(BaseModel):
    kind: str = "fact"
    text: str = Field(min_length=1, max_length=255)


class FactOut(FactIn):
    id: int

    class Config:
        from_attributes = True
