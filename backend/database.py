from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scms.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
elif DATABASE_URL.startswith("libsql://") and not DATABASE_URL.startswith("sqlite+libsql://"):
    # SQLAlchemy requires sqlite+libsql:// for the Turso dialect
    DATABASE_URL = DATABASE_URL.replace("libsql://", "sqlite+libsql://", 1)

connect_args = {}
# Local SQLite config
if "sqlite" in DATABASE_URL and "libsql" not in DATABASE_URL:
    connect_args["check_same_thread"] = False

# Turso config
if "libsql" in DATABASE_URL:
    if "?" not in DATABASE_URL and not DATABASE_URL.endswith("/"):
        DATABASE_URL += "/?secure=true"
    elif "secure=true" not in DATABASE_URL:
        DATABASE_URL += "&secure=true"
        
    TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")
    if TURSO_AUTH_TOKEN:
        connect_args["auth_token"] = TURSO_AUTH_TOKEN

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Enable WAL mode for local SQLite ONLY
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    if "sqlite" in DATABASE_URL and "libsql" not in DATABASE_URL:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
