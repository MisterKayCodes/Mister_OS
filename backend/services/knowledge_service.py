import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from sqlalchemy.orm import Session
from services.note_service import NoteService
from data.repository import NoteRepository
import re

class KnowledgeService:
    @staticmethod
    def ingest_youtube(url: str, db: Session) -> dict:
        """Fetches YouTube transcript and saves it as a note."""
        # 1. Get metadata
        ydl_opts = {'quiet': True, 'no_warnings': True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get('title', 'Unknown Title')
                video_id = info.get('id')
        except Exception as e:
            raise ValueError(f"Could not extract video metadata: {str(e)}")

        if not video_id:
            raise ValueError("Could not extract Video ID.")

        # 2. Get transcript
        try:
            api = YouTubeTranscriptApi()
            transcript_list_obj = api.list(video_id)
            
            try:
                transcript_obj = transcript_list_obj.find_transcript(['en'])
            except:
                available = list(transcript_list_obj)
                if not available:
                    raise ValueError("No transcripts available.")
                transcript_obj = available[0]
                
            data = transcript_obj.fetch()
            
            full_text = ""
            for item in data:
                if hasattr(item, 'text'):
                    full_text += item.text + "\n"
                elif isinstance(item, dict) and 'text' in item:
                    full_text += item['text'] + "\n"
                else:
                    full_text += str(item) + "\n"
                    
        except Exception as e:
            raise ValueError(f"Could not fetch transcript: {type(e).__name__}: {e}")

        # 3. Get or create "YouTube Transcripts" folder
        folder_name = "YouTube Transcripts"
        from data import models
        folder = db.query(models.Folder).filter(models.Folder.name.ilike(folder_name)).first()
        if not folder:
            folder = models.Folder(name=folder_name)
            db.add(folder)
            db.commit()
            db.refresh(folder)

        # 4. Save as Note (NoteService automatically vectors and chunks it!)
        note_content = f"Title: {title}\nURL: {url}\n\n{full_text}"
        note = NoteService.create_note(db=db, title=title, content=note_content, folder_id=folder.id)

        word_count = len(full_text.split())

        return {
            "note_id": note.id,
            "title": note.title,
            "word_count": word_count
        }
