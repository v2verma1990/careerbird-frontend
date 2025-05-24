import hashlib
import json
import os

CACHE_DIR = os.path.join(os.path.dirname(__file__), "../cache_store")
os.makedirs(CACHE_DIR, exist_ok=True)

def hash_inputs(*args):
    m = hashlib.sha256()
    for arg in args:
        m.update(arg.encode("utf-8"))
    return m.hexdigest()

def get_cached_response(endpoint, cache_key):
    path = os.path.join(CACHE_DIR, f"{endpoint}_{cache_key}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def set_cached_response(endpoint, cache_key, data):
    path = os.path.join(CACHE_DIR, f"{endpoint}_{cache_key}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
