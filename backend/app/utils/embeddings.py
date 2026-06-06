import hashlib
import random
from app.config import VECTOR_SIZE


def generate_embedding(text: str):
    seed = int(hashlib.md5(text.encode()).hexdigest(), 16) % (10 ** 8)
    rng = random.Random(seed)

    return [rng.random() for _ in range(VECTOR_SIZE)]