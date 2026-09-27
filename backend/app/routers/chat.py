from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..llm import llm_reply
from ..models import Conversation, MemoryFact, Message, User
from ..schemas import ChatIn, ChatOut

router = APIRouter(prefix="/api/chat", tags=["chat"])


def local_route(message: str) -> tuple[str, str, float] | None:
    """Cheap deterministic intents handled without the LLM (mirrors the
    frontend engine — math/units/etc. never burn tokens)."""
    text = message.strip().lower()
    if text in {"hi", "hello", "hey"}:
        return ("Nyaa~ hello! How can I help today? \U0001F43E", "smalltalk.greeting", 0.96)
    if text in {"thanks", "thank you"}:
        return ("You're welcome! *purrs*", "smalltalk.thanks", 0.95)
    return None


@router.post("/message", response_model=ChatOut)
async def send_message(
    payload: ChatIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # conversation (owner-scoped)
    conv = None
    if payload.conversation_id:
        conv = db.scalar(
            select(Conversation).where(
                Conversation.id == payload.conversation_id,
                Conversation.owner_id == user.id,
            )
        )
    if conv is None:
        conv = Conversation(owner_id=user.id, title=payload.message[:60])
        db.add(conv)
        db.commit()
        db.refresh(conv)

    db.add(Message(conversation_id=conv.id, role="user", content=payload.message))

    routed = local_route(payload.message)
    if routed:
        reply, intent, conf = routed
    else:
        memory = [
            f.text
            for f in db.scalars(
                select(MemoryFact).where(MemoryFact.owner_id == user.id).limit(10)
            )
        ]
        history = [
            {"role": m.role, "content": m.content}
            for m in db.scalars(
                select(Message)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .limit(8)
            )
        ][::-1]
        llm = await llm_reply(payload.message, memory, history)
        if llm:
            reply, intent, conf = llm, "llm.completion", 0.9
        else:
            reply, intent, conf = (
                "The cloud LLM is not configured on this server "
                "(set LLM_API_KEY). Deterministic intents still work.",
                "fallback.no_llm",
                0.3,
            )

    db.add(Message(conversation_id=conv.id, role="assistant", content=reply, intent=intent))
    db.commit()
    return ChatOut(conversation_id=conv.id, reply=reply, intent=intent, confidence=conf)
