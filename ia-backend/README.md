# AI News Summarization Backend

Este es el backend de IA para el servicio de resumen de noticias que utiliza el modelo BART de Hugging Face.

## Instalación

1. **Crear entorno virtual:**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

## Ejecución

1. **Iniciar el servidor FastAPI:**
```bash
uvicorn main:app --reload
```

El servidor estará disponible en: http://127.0.0.1:8000

2. **Verificar que funciona:**
- Health check: http://127.0.0.1:8000/health
- Documentación automática: http://127.0.0.1:8000/docs

## Testing

Para probar la API:
```bash
python test_api.py
```

## Endpoints

### POST /summarize
Genera un resumen de texto usando BART.

**Request body:**
```json
{
  "text": "Texto a resumir...",
  "min_length": 50,
  "max_length": 150
}
```

**Response:**
```json
{
  "summary": "Resumen generado..."
}
```

### GET /health
Verifica el estado del servicio y del modelo.

**Response:**
```json
{
  "status": "ok",
  "model_ready": true
}
```

## Notas

- El modelo BART se descarga automáticamente en el primer uso
- Utiliza GPU si está disponible, si no usa CPU
- El modelo se carga una sola vez al iniciar el servidor para mayor eficiencia