from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Database - Forzar SQLite para evitar problemas de configuración en Railway
    database_url: str = "sqlite:///./botilleria.db"  # Usar SQLite siempre por ahora
    
    # App
    app_name: str = "Botillería System"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
