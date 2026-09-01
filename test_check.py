from config import YOUTUBE_VIDEO_ID
from rag_chain import get_rag_chain

def test_verify():
    print("Starting Verification...")
    try:
        chain, is_fallback = get_rag_chain(YOUTUBE_VIDEO_ID)
        if not chain:
            print("Verification Failed: Could not build chain.")
            return
        
        # Simple test query
        question = "What is the video about?"
        print(f"Querying: {question}")
        answer = chain.invoke(question)
        print(f"Answer:\n{answer}")
        print("Verification Successful!")
    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    test_verify()

