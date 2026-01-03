from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from typing import Optional

class Settings(BaseSettings):
    # Database - Railway MySQL configuration
    # Variables de entorno que Railway proporciona automáticamente
    database_url: Optional[str] = None
    mysql_url: Optional[str] = None
    mysql_public_url: Optional[str] = None  # MYSQL_PUBLIC_URL para conexiones externas
    
    # Variables MySQL individuales (Railway las proporciona con nombres específicos)
    mysqlhost: Optional[str] = None  # MYSQLHOST
    mysqlpassword: Optional[str] = None  # MYSQLPASSWORD
    mysqldatabase: Optional[str] = None  # MYSQLDATABASE
    mysql_port: int = 3306
    
    # Railway también puede proporcionar DATABASE_URL directamente
    def get_database_url(self) -> str:
        # Si estamos ejecutando desde Railway run (externo), usar MYSQL_PUBLIC_URL
        # Si estamos en Railway server (interno), usar MYSQL_URL
        # Si estamos en desarrollo local, usar SQLite
        
        if self.mysql_public_url:
            # Para railway run y conexiones externas
            return self.mysql_public_url
        elif self.mysql_url:
            # Para el servidor de Railway (conexión interna)
            return self.mysql_url
        elif self.database_url:
            return self.database_url  
        elif all([self.mysqlhost, self.mysqlpassword, self.mysqldatabase]):
            # Railway MySQL siempre usa 'root' como usuario
            return f"mysql+pymysql://root:{self.mysqlpassword}@{self.mysqlhost}:{self.mysql_port}/{self.mysqldatabase}"
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
