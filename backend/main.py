
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
import os
from utils import update_id3_tags

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
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    # Extract metadata
    try:
        mp3 = MP3(filepath, ID3=EasyID3)
        metadata = {k: v for k, v in mp3.items()}
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
    result = update_id3_tags(metadata, UPLOAD_DIR)
    files = result.get('updated_files', [])
    updated_metadata = None
    actual_filename = files[0] if files else None
    # Save cover art if provided
    if cover_art and actual_filename:
        from mutagen.id3 import ID3, APIC, error
        path = os.path.join(UPLOAD_DIR, actual_filename)
        try:
            audio = ID3(path)
            cover_bytes = await cover_art.read()
            # Remove existing APIC frames
            audio.delall('APIC')
            audio.add(APIC(
                encoding=3, # 3 is for utf-8
                mime=cover_art.content_type,
                type=3, # 3 is for the cover(front) image
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
            from mutagen.mp3 import MP3
            from mutagen.easyid3 import EasyID3
            path = os.path.join(UPLOAD_DIR, actual_filename)
            mp3 = MP3(path, ID3=EasyID3)
            updated_metadata = {k: v for k, v in mp3.items()}
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
