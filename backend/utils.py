
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC
import os

def get_audio_metadata(filepath: str) -> dict:
    """Extract metadata from MP3 file"""
    try:
        audio = MP3(filepath, ID3=EasyID3)
        if audio.tags is None:
            audio.add_tags()
        return {k: v for k, v in audio.items()}
    except Exception as e:
        return {"error": str(e)}

def update_audio_tags(metadata: dict, directory, specific_files=None):
    """Update tags for MP3 files"""
    if specific_files:
        files = specific_files
    else:
        # Get all MP3 files
        files = sorted([f for f in os.listdir(directory) 
                       if f.lower().endswith('.mp3')])
    
    updated_files = []
    
    for idx, filename in enumerate(files, 1):
        path = os.path.join(directory, filename)
        
        try:
            audio = MP3(path, ID3=EasyID3)
            if audio.tags is None:
                audio.add_tags()
            
            # Handle cover art for MP3
            if 'cover_art' in metadata:
                cover_bytes = metadata['cover_art']
                cover_mime = metadata.get('cover_mime', 'image/jpeg')
                audio.tags.delall('APIC')
                audio.tags.add(APIC(
                    encoding=3,
                    mime=cover_mime,
                    type=3,
                    desc=u'Cover',
                    data=cover_bytes
                ))
                # Remove cover_art from metadata to avoid setting it as a tag
                metadata_copy = {k: v for k, v in metadata.items() 
                               if k not in ['cover_art', 'cover_mime']}
            else:
                metadata_copy = metadata
            
            for key, value in metadata_copy.items():
                try:
                    audio[key] = value
                except Exception:
                    continue
            
            # Update tracknumber if not provided
            if 'tracknumber' not in metadata_copy:
                track_str = f"{idx:02d}/{len(files)}"
                audio["tracknumber"] = track_str
            
            audio.save()
            updated_files.append(filename)
            
        except Exception as e:
            print(f"Error updating {filename}: {e}")
            continue
    
    return {"status": "success", "updated_files": updated_files}
