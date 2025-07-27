
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
import os
from utils import update_audio_tags, get_audio_metadata

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Check if file is an MP3 file
    if not file.filename.lower().endswith('.mp3'):
        return {"error": "Only MP3 files are supported"}
    
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract metadata
    try:
        metadata = get_audio_metadata(filepath)
    except Exception as e:
        metadata = {"error": str(e)}
    
    return {"filename": file.filename, "metadata": metadata}

@app.post("/update-tags/")
async def update_tags(request: Request):
    form = await request.form()
    metadata = {k: v for k, v in form.items() if k != 'cover_art'}
    cover_art = form.get("cover_art")
    # Handle file renaming if 'filename' is present
    new_filename = metadata.pop('filename', None)
    result = update_audio_tags(metadata, UPLOAD_DIR)
    files = result.get('updated_files', [])
    updated_metadata = None
    actual_filename = files[0] if files else None
    
    # Save cover art if provided
    if cover_art and actual_filename:
        path = os.path.join(UPLOAD_DIR, actual_filename)
        try:
            from mutagen.id3 import ID3, APIC
            audio = ID3(path)
            cover_bytes = await cover_art.read()
            audio.delall('APIC')
            audio.add(APIC(
                encoding=3,
                mime=cover_art.content_type,
                type=3,
                desc=u'Cover',
                data=cover_bytes
            ))
            audio.save()
        except Exception as e:
            print(f"Error saving cover art: {e}")
    
    if new_filename and actual_filename:
        import shutil
        old_path = os.path.join(UPLOAD_DIR, actual_filename)
        new_path = os.path.join(UPLOAD_DIR, new_filename)
        shutil.move(old_path, new_path)
        actual_filename = new_filename
    
    if actual_filename:
        try:
            path = os.path.join(UPLOAD_DIR, actual_filename)
            updated_metadata = get_audio_metadata(path)
        except Exception as e:
            updated_metadata = {"error": str(e)}
    
    download_url = None
    if actual_filename:
        download_url = f"/download/{actual_filename}"
    
    return {**result, "metadata": updated_metadata, "filename": actual_filename, "download_url": download_url}

@app.get("/download/{filename}")
async def download_file(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        return {"error": "File not found"}
    
    return FileResponse(filepath, media_type='audio/mpeg', filename=filename)
