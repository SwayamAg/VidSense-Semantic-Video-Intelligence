import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def test_openai_config():
    print("=" * 60)
    print("   OPENAI API CONFIGURATION DIAGNOSTIC")
    print("=" * 60)

    api_key = os.getenv("OPENAI_API_KEY")
    chat_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    base_url = os.getenv("OPENAI_BASE_URL")

    print(f"API Key Present: {'Yes' if api_key and api_key != 'your_openai_api_key_here' else 'No (or placeholder)'}")
    print(f"Chat Model:      {chat_model}")
    print(f"Embedding Model: {embedding_model}")
    if base_url:
        print(f"Base URL:        {base_url}")
    print("-" * 60)

    if not api_key or api_key == "your_openai_api_key_here":
        print("\033[91m[ERROR] Please set your actual OPENAI_API_KEY in the .env file.\033[0m")
        return False

    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url

    client = OpenAI(**client_kwargs)

    # 1. Test Chat Model
    print(f"\n[1/2] Testing Chat Model ({chat_model})...")
    try:
        completion = client.chat.completions.create(
            model=chat_model,
            messages=[{"role": "user", "content": "Respond with 'OpenAI Chat is working!' only."}],
            max_tokens=20
        )
        msg = completion.choices[0].message.content.strip()
        print(f"\033[92m[SUCCESS]\033[0m Chat response: {msg}")
    except Exception as e:
        print(f"\033[91m[FAILED]\033[0m Chat completion error: {e}")
        return False

    # 2. Test Embedding Model
    print(f"\n[2/2] Testing Embeddings Model ({embedding_model})...")
    try:
        embed_resp = client.embeddings.create(
            model=embedding_model,
            input="Test embedding connection"
        )
        vec_len = len(embed_resp.data[0].embedding)
        print(f"\033[92m[SUCCESS]\033[0m Generated embedding vector of length: {vec_len}")
    except Exception as e:
        print(f"\033[91m[FAILED]\033[0m Embedding error: {e}")
        return False

    print("\n" + "=" * 60)
    print("\033[92m[ALL CHECKS PASSED] OpenAI API is fully configured and operational!\033[0m")
    print("=" * 60)
    return True

if __name__ == "__main__":
    test_openai_config()
