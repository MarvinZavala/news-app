from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BartForConditionalGeneration, BartTokenizer
import torch
import re

# --- Carga del Modelo (se ejecuta una sola vez al iniciar) ---
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Usando dispositivo: {device}")

try:
    # Usar BART-LARGE pero con configuraciones optimizadas para 6 segundos
    model_name = "facebook/bart-large-cnn"
    tokenizer = BartTokenizer.from_pretrained(model_name)
    model = BartForConditionalGeneration.from_pretrained(model_name).to(device)
    
    # Optimizaciones para 6 segundos exactos
    model.eval()
    if device == "cpu":
        torch.set_num_threads(6)
        torch.set_grad_enabled(False)
    
    print(f"Modelo BART-LARGE cargado exitosamente en {device} (optimizado para 6 segundos).")
except Exception as e:
    print(f"Error al cargar el modelo: {e}")
    model = None
    tokenizer = None

# --- Definición de la App FastAPI ---
app = FastAPI(
    title="API de Resumen de Noticias - OPTIMAL",
    description="Servicio óptimo: 6 segundos con alta calidad.",
    version="5.0.0"
)

# --- Modelos de Datos Pydantic ---
class SummarizeRequest(BaseModel):
    text: str
    min_length: int = 40
    max_length: int = 110

class SummarizeResponse(BaseModel):
    summary: str

def optimal_preprocess_text(text: str) -> str:
    """
    Preprocesamiento óptimo para 6 segundos con calidad.
    """
    # Limpiar texto básico
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r'[^\w\s.,!?;:-]', '', text)
    
    # Estrategia para 6 segundos: tomar contenido clave pero no demasiado
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 12]
    
    if len(sentences) > 3:
        # Seleccionar 3 oraciones clave: primera, una del medio, y última
        selected = [
            sentences[0],  # Primera oración (titular/contexto)
            sentences[len(sentences)//2],  # Oración del medio (detalles)
            sentences[-1]  # Última oración (conclusión)
        ]
        processed_text = '. '.join(selected) + '.'
    else:
        processed_text = '. '.join(sentences) + '.'
    
    # Longitud óptima para 6 segundos
    if len(processed_text) > 400:
        # Mantener hasta 400 caracteres
        last_period = processed_text[:400].rfind('.')
        if last_period > 300:  # Si hay un punto en rango razonable
            processed_text = processed_text[:last_period + 1]
        else:
            processed_text = processed_text[:400] + '.'
    
    return processed_text

# --- Endpoint de la API ---
@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """
    Genera resumen óptimo: 6 segundos con alta calidad.
    """
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Modelo de IA no está disponible.")

    try:
        # Preprocesamiento óptimo
        processed_text = optimal_preprocess_text(request.text)
        
        # Configuración optimizada para 6 segundos
        inputs = tokenizer(
            processed_text,
            max_length=280,  # Reducido para 6 segundos consistentes
            return_tensors="pt",
            truncation=True,
            padding=False
        ).to(device)

        # Crear attention mask
        attention_mask = inputs['input_ids'].ne(tokenizer.pad_token_id).long()

        # Generación optimizada para 6 segundos
        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                attention_mask=attention_mask,
                max_length=request.max_length,
                min_length=request.min_length,
                num_beams=2,              # Balance velocidad/calidad
                early_stopping=True,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
                no_repeat_ngram_size=2,
                length_penalty=1.1,
                repetition_penalty=1.1
            )

        # Decodificar y limpiar resultado
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        summary = re.sub(r'\s+', ' ', summary.strip())
        
        # Asegurar terminación correcta
        if not summary.endswith(('.', '!', '?')):
            last_punct = max(
                summary.rfind('.'),
                summary.rfind('!'),
                summary.rfind('?')
            )
            if last_punct > len(summary) * 0.7:
                summary = summary[:last_punct + 1]
            else:
                summary = summary + '.'
        
        return SummarizeResponse(summary=summary)
        
    except Exception as e:
        print(f"Error durante la generación del resumen: {e}")
        raise HTTPException(status_code=500, detail="No se pudo procesar el texto.")

# --- Endpoint de Health Check ---
@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "model_ready": model is not None, 
        "device": device,
        "version": "optimal",
        "model": "bart-large-cnn",
        "target_speed": "6_seconds",
        "quality": "high"
    }