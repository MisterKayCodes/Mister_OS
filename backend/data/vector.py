import chromadb
from chromadb.config import Settings
import os

# Ensure data directory exists
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(DB_DIR, exist_ok=True)

# Initialize ChromaDB persistent client
chroma_client = chromadb.PersistentClient(path=DB_DIR)

# Get or create the main collection for notes
notes_collection = chroma_client.get_or_create_collection(
    name="mister_notes",
    metadata={"description": "Omni-Brain vector storage for all notes"}
)

def chunk_text(text: str, chunk_size: int = 500) -> list:
    """Split text into manageable chunks for better embedding and retrieval."""
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) > chunk_size and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = len(word)
        else:
            current_chunk.append(word)
            current_length += len(word) + 1
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def upsert_note_vectors(note_id: int, title: str, content: str):
    """Chunks a note and updates it in ChromaDB."""
    # First, delete any existing vectors for this note_id to prevent duplicates on update
    try:
        notes_collection.delete(where={"note_id": note_id})
    except Exception:
        pass # Ignore if it doesn't exist yet
        
    chunks = chunk_text(content)
    if not chunks:
        return
        
    ids = [f"note_{note_id}_chunk_{i}" for i in range(len(chunks))]
    documents = chunks
    metadatas = [{"note_id": note_id, "title": title} for _ in chunks]
    
    notes_collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

def query_relevant_notes(query: str, n_results: int = 3):
    """Searches ChromaDB for the most relevant note chunks."""
    results = notes_collection.query(
        query_texts=[query],
        n_results=n_results
    )
    if not results['documents'] or not results['documents'][0]:
        return []
    
    # Return formatted context strings
    return [
        f"From note '{meta['title']}': {doc}"
        for doc, meta in zip(results['documents'][0], results['metadatas'][0])
    ]
