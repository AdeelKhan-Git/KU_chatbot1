import os
from phi.embedder.openai import OpenAIEmbedder



open_api_key = os.environ.get("OPENAI_API_KEY")


openai_embedder = OpenAIEmbedder(
    model="text-embedding-3-large",
    api_key=open_api_key,
)


