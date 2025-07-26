
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
import os

def update_id3_tags(metadata: dict, directory):
    files = sorted([f for f in os.listdir(directory) if f.endswith(".mp3")])
    for idx, filename in enumerate(files, 1):
        path = os.path.join(directory, filename)
        mp3 = MP3(path, ID3=EasyID3)
        for key, value in metadata.items():
            try:
                mp3[key] = value
            except Exception:
                # Skip invalid keys (like cover_art)
                continue
        # Optionally update tracknumber if not provided
        if 'tracknumber' not in metadata:
            track_str = f"{idx:02d}/{len(files)}"
            mp3["tracknumber"] = track_str
        mp3.save()
    return {"status": "success", "updated_files": files}
