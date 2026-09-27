from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Note, User
from ..schemas import NoteIn, NoteOut

router = APIRouter(prefix="/api/notes", tags=["notes"])


def _owned(note_id: int, user: User, db: Session) -> Note:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.owner_id == user.id))
    if note is None:
        raise HTTPException(404, "Note not found")
    return note


@router.get("", response_model=list[NoteOut])
def list_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(Note).where(Note.owner_id == user.id).order_by(Note.updated_at.desc())))


@router.post("", response_model=NoteOut, status_code=201)
def create_note(payload: NoteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = Note(**payload.model_dump(), owner_id=user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _owned(note_id, user, db)
    for k, v in payload.model_dump().items():
        setattr(note, k, v)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_owned(note_id, user, db))
    db.commit()
