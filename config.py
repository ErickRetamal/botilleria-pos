from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from typing import Optional

class Settings(BaseSettings):
    # Database - Railway MySQL configuration
    # Variables de entorno que Railway proporciona automáticamente
    database_url: Optional[str] = None
    mysql_url: Optional[str] = None
    
    # Variables MySQL individuales (Railway las proporciona)
    mysql_user: Optional[str] = None
    mysql_password: Optional[str] = None 
    mysql_host: Optional[str] = None
    mysql_port: int = 3306
    mysql_database: Optional[str] = None
    
    # Railway también puede proporcionar DATABASE_URL directamente
    def get_database_url(self) -> str:
        # Prioridad: DATABASE_URL > MYSQL_URL > variables individuales
        if self.database_url:
            return self.database_url
        elif self.mysql_url:
            return self.mysql_url
        elif all([self.mysql_user, self.mysql_password, self.mysql_host, self.mysql_database]):
            return f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        else:
            # Fallback para desarrollo local
            return "sqlite:///./botilleria.db"
    
    # App
    app_name: str = "Botillería System"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
