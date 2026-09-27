from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import MemoryFact, User
from ..schemas import FactIn, FactOut

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("", response_model=list[FactOut])
def list_facts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(MemoryFact).where(MemoryFact.owner_id == user.id)))


@router.post("", response_model=FactOut, status_code=201)
def add_fact(payload: FactIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fact = MemoryFact(**payload.model_dump(), owner_id=user.id)
    db.add(fact)
    db.commit()
    db.refresh(fact)
    return fact


@router.delete("/{fact_id}", status_code=204)
def delete_fact(fact_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fact = db.scalar(select(MemoryFact).where(MemoryFact.id == fact_id, MemoryFact.owner_id == user.id))
    if fact is None:
        raise HTTPException(404, "Fact not found")
    db.delete(fact)
    db.commit()
