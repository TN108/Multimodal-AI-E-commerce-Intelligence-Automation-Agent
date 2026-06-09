from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

model = SentenceTransformer(EMBEDDING_MODEL_NAME)


def generate_embedding(text: str):
    if not text:
        text = ""

    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()