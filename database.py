from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()

# Crear engine de SQLAlchemy (MySQL en Railway o SQLite local)
database_url = settings.get_database_url()
print(f"🔗 Conectando a: {database_url.split('@')[0]}@[HOST_HIDDEN]" if '@' in database_url else database_url)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20 if 'mysql' in database_url else 1,
    max_overflow=30 if 'mysql' in database_url else 0,
    echo=settings.debug,
    # Configuraciones específicas para SQLite si es necesario
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
)

# Session local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# Dependency para obtener DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
