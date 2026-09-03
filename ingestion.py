import os
import warnings
from typing import Optional

warnings.filterwarnings("ignore", message="urllib3 .* or chardet .* doesn't match a supported version!")

from langchain_community.document_loaders import YoutubeLoader, TextLoader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from config import (
    CHUNK_SIZE, 
    CHUNK_OVERLAP, 
    FAISS_INDEX_PATH, 
    get_embeddings
)

def fetch_transcript_with_ytdlp(video_id: str) -> Optional[str]:
    """Uses yt-dlp to extract transcripts. Highly robust against blocks."""
    import yt_dlp
    import requests
    import json
    
    url = f"https://www.youtube.com/watch?v={video_id}"
    print(f"[FETCH] Attempting pro-fetch with yt-dlp for: {video_id}")
    
    # Comprehensive English dialect & variant keys + Hindi
    ENGLISH_KEYS = [
        'en-orig', 'en', 'en-us', 'en-gb', 'en-ca', 'en-au', 'en-in', 
        'en-ie', 'en-nz', 'en-za', 'en-sg', 'en-ph', 'hi', 'hi-latn'
    ]

    # 1. Check for cookie file in standard paths or environment variable
    cookie_file = None
    possible_paths = [
        "cookies.txt",
        "/etc/secrets/cookies.txt",
        "/app/cookies.txt",
        os.path.join(os.getcwd(), "cookies.txt")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            cookie_file = p
            print(f"[AUTH] Found active YouTube cookies at: {p}")
            break

    if not cookie_file and os.getenv("YOUTUBE_COOKIES"):
        cookie_path = os.path.join(os.getcwd(), ".youtube_cookies.txt")
        try:
            with open(cookie_path, "w", encoding="utf-8") as f:
                f.write(os.getenv("YOUTUBE_COOKIES", ""))
            cookie_file = cookie_path
            print("[AUTH] Generated cookies file from YOUTUBE_COOKIES env var.")
        except Exception:
            pass

    ydl_opts = {
        'skip_download': True,
        'writeautomaticsub': True,
        'writesubtitles': True,
        'subtitleslangs': ['en.*', 'en', 'hi.*', 'hi'],
        'quiet': True,
        'no_warnings': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    }

    if cookie_file:
        ydl_opts['cookiefile'] = cookie_file
        ydl_opts['extractor_args'] = {'youtube': {'player_client': ['web', 'mweb', 'android']}}
    else:
        ydl_opts['extractor_args'] = {'youtube': {'player_client': ['android', 'web']}}





    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Prioritize manual subtitles over automatic ones
            subtitles = info.get('subtitles') or info.get('automatic_captions')
            if not subtitles:
                return None
                
            chosen_key = None
            # 1. Exact or prefix match against priority English dialects
            for lang in ENGLISH_KEYS:
                for key in subtitles.keys():
                    if key.lower() == lang or key.lower().startswith(lang):
                        chosen_key = key
                        break
                if chosen_key:
                    break

            # 2. Broad fallback: any key that starts with or contains 'en'
            if not chosen_key:
                for key in subtitles.keys():
                    if key.lower().startswith('en') or 'en' in key.lower().split('-'):
                        chosen_key = key
                        break

            if chosen_key:
                formats = subtitles[chosen_key]
                json_fmt = next((f['url'] for f in formats if f.get('ext') == 'json3'), None)
                if json_fmt:
                    sub_headers = {
                        'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11; Pixel 5)',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                    resp = requests.get(json_fmt, headers=sub_headers, timeout=10)
                    if resp.status_code == 200:

                        data = resp.json()
                        formatted_events = []
                        for event in data.get('events', []):
                            if 'segs' in event and 'tStartMs' in event:
                                ms = event['tStartMs']
                                s = ms // 1000
                                m, s = divmod(s, 60)
                                h, m = divmod(m, 60)
                                time_str = f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"
                                text = "".join([seg['utf8'] for seg in event['segs'] if 'utf8' in seg])
                                if text.strip():
                                    formatted_events.append(f"[{time_str}] {text.strip()}")
                        if formatted_events:
                            return " ".join(formatted_events)
        return None
    except Exception as e:
        print(f"[WARNING] yt-dlp extraction failed: {e}")


    # 2. Standalone Direct Innertube captionTracks fallback if yt-dlp fails or is blocked
    try:
        print(f"[FETCH] Attempting direct Innertube caption extraction for: {video_id}")
        page_url = f"https://www.youtube.com/watch?v={video_id}"
        page_res = requests.get(page_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'}, timeout=5)
        key = '"captionTracks":'
        pos = page_res.text.find(key)
        if pos != -1:
            slice_text = page_res.text[pos + len(key):]
            end_pos = slice_text.find('],') + 1
            tracks = json.loads(slice_text[:end_pos])
            if tracks:
                chosen = next((t for t in tracks if t.get('languageCode', '').startswith('en')), tracks[0])
                base_url = chosen.get('baseUrl')
                if base_url:
                    cap_url = base_url + "&fmt=json3" if "fmt=" not in base_url else base_url
                    cap_res = requests.get(cap_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'}, timeout=5)
                    if cap_res.status_code == 200 and cap_res.text.strip():
                        c_data = cap_res.json()
                        direct_events = []
                        for ev in c_data.get('events', []):
                            if 'segs' in ev and 'tStartMs' in ev:
                                ms = ev['tStartMs']
                                s = ms // 1000
                                m, s = divmod(s, 60)
                                h, m = divmod(m, 60)
                                t_str = f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"
                                txt = "".join([seg['utf8'] for seg in ev['segs'] if 'utf8' in seg])
                                if txt.strip():
                                    import html
                                    direct_events.append(f"[{t_str}] {html.unescape(txt.strip())}")
                        if direct_events:
                            return " ".join(direct_events)
    except Exception as ie:
        print(f"[WARNING] Direct Innertube caption fallback failed: {ie}")

    return None



def fetch_transcript_with_youtube_api(video_id: str) -> Optional[str]:
    """
    Fetches captions using official Google Cloud YouTube Data API v3.
    Requires YOUTUBE_API_KEY. Completely immune to datacenter IP blocks.
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return None

    import requests
    import xml.etree.ElementTree as ET
    import html

    try:
        print(f"[FETCH] Attempting official YouTube Data API v3 for: {video_id}")
        list_url = f"https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId={video_id}&key={api_key}"
        res = requests.get(list_url, timeout=10)
        if res.status_code != 200:
            print(f"[API_V3] Captions list returned status {res.status_code}: {res.text[:120]}")
            return None

        items = res.json().get("items", [])
        if not items:
            return None

        # Prioritize English or first available track
        chosen_id = None
        for it in items:
            snip = it.get("snippet", {})
            lang = snip.get("language", "")
            if lang.lower().startswith("en"):
                chosen_id = it.get("id")
                break
        if not chosen_id:
            chosen_id = items[0].get("id")

        download_url = f"https://www.googleapis.com/youtube/v3/captions/{chosen_id}?key={api_key}&tfmt=ttml"
        dl_res = requests.get(download_url, timeout=10)
        if dl_res.status_code == 200 and dl_res.text.strip():
            root = ET.fromstring(dl_res.text)
            events = []
            for p in root.iter("{http://www.w3.org/ns/ttml}p"):
                begin = p.attrib.get("begin", "")
                txt = "".join(p.itertext()).strip()
                if txt:
                    time_str = begin.split(".")[0] if begin else ""
                    events.append(f"[{time_str}] {html.unescape(txt)}" if time_str else html.unescape(txt))
            if events:
                return " ".join(events)

        return None
    except Exception as e:
        print(f"[WARNING] YouTube Data API v3 extraction error: {e}")
        return None

def fetch_transcript_from_youtube(video_id: str) -> str:
    """
    Fetches transcript from YouTube using yt-dlp first, official YouTube Data API v3 second, then scraper.
    Raises ValueError with descriptive reasoning if no transcript is available.
    """
    # 1. Try yt-dlp (Pro)
    transcript = fetch_transcript_with_ytdlp(video_id)
    if transcript:
        print("[SUCCESS] Transcript fetched via yt-dlp.")
        return transcript

    # 2. Try official YouTube Data API v3 (Immune to cloud IP blocks)
    transcript_api = fetch_transcript_with_youtube_api(video_id)
    if transcript_api:
        print("[SUCCESS] Transcript fetched via official YouTube Data API v3.")
        return transcript_api

    # 3. Fallback to youtube-transcript-api (Fast)
    from youtube_transcript_api import YouTubeTranscriptApi
    try:
        print(f"[FETCH] Falling back to standard scraper for: {video_id}")

        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try all major English dialects and Hindi
        en_codes = ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU', 'en-IN', 'en-IE', 'hi']
        try:
            transcript_obj = transcript_list.find_transcript(en_codes)
        except:
            transcript_obj = next(iter(transcript_list))
            
        data = transcript_obj.fetch()
        full_text = " ".join([t['text'] for t in data])
        if full_text.strip():
            return full_text
            
    except Exception as e:
        error_str = str(e)
        if "Subtitles are disabled" in error_str or "No transcripts were found" in error_str:
            raise ValueError(f"This YouTube video does not have closed captions/subtitles enabled by the creator. (Scraper: {error_str[:60]})")
        elif "Too Many Requests" in error_str or "429" in error_str:
            raise ValueError("YouTube API rate-limited caption requests. Please try again in a few moments.")
        else:
            raise ValueError(f"Unable to access video transcript: {error_str[:120]}")

    raise ValueError("No English or supported language subtitles could be found for this video.")


def get_or_create_vector_store(video_id: str):
    """
    Manages the Vector Store lifecycle for a specific video_id.
    Raises ValueError or RuntimeError on failures with explanatory details.
    """
    embeddings = get_embeddings()
    index_path = os.path.join(FAISS_INDEX_PATH, video_id)
    
    # 1. Check if a persistent index for THIS video exists on disk
    if os.path.exists(index_path):
        print(f"[INDEX] Loading existing FAISS index for Video ID: {video_id}...")
        try:
            return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True), False
        except Exception as e:
            print(f"[RECOVERY] Local index corrupted: {e}. Re-indexing...")

    # 2. Try to fetch and index NEW transcript directly from YouTube
    print(f"[INDEX] Initializing ingestion pipeline for Video ID: {video_id}...")
    transcript = fetch_transcript_from_youtube(video_id)
        
    # Semantic Chunking & Vectorization
    print(f"[PROCESS] Splitting text into chunks...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    chunks = splitter.create_documents([transcript])
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    # Persistence
    vector_store.save_local(index_path)
    print(f"[INDEX] Index persisted at '{index_path}'.")
    
    return vector_store, False


if __name__ == "__main__":
    from config import YOUTUBE_VIDEO_ID
    vs, _ = get_or_create_vector_store(YOUTUBE_VIDEO_ID)
    if vs:
        print("[OK] Ingestion system diagnostic passed.")

