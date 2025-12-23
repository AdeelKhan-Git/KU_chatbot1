
from phi.embedder.google import GeminiEmbedder
import os



gemini_api_key = os.environ.get("GOOGLE_API_KEY")




gemini_embedder = GeminiEmbedder(
    model="models/text-embedding-004",
    api_key=gemini_api_key
)


