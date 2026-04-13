import imageio.v2 as imageio
from PIL import Image
import numpy as np
import os

fps = 30
duration_per_image = 3.0 # seconds
frames_per_image = int(fps * duration_per_image)
crossfade_duration = 0.8 # seconds
crossfade_frames = int(fps * crossfade_duration)

def create_video(image_paths, output_filename):
    print(f"Generating {output_filename}...")
    writer = imageio.get_writer(output_filename, fps=fps, macro_block_size=None)
    
    images = []
    target_size = (1920, 1080)
    for path in image_paths:
        if not os.path.exists(path):
            print(f"Warning: {path} not found.")
            continue
        img = Image.open(path).convert('RGB')
        # Resize maintaining aspect ratio then pad
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Create a black background
        new_img = Image.new("RGB", target_size, (0, 0, 0))
        # Paste centered
        new_img.paste(img, ((target_size[0] - img.width) // 2, (target_size[1] - img.height) // 2))
        
        images.append(np.array(new_img))
    
    if not images: 
        print(f"Skipping {output_filename}, no images.")
        return
    
    for i in range(len(images)):
        current_img = images[i]
        
        if i < len(images) - 1:
            next_img = images[i+1]
            hold_frames = frames_per_image - crossfade_frames
            
            for _ in range(hold_frames):
                writer.append_data(current_img)
                
            for j in range(crossfade_frames):
                alpha = j / float(crossfade_frames)
                blended = (current_img * (1 - alpha) + next_img * alpha).astype(np.uint8)
                writer.append_data(blended)
        else:
            for _ in range(frames_per_image):
                writer.append_data(current_img)
                
    writer.close()
    print(f"✅ Finished {output_filename}")

v1 = ['screenshots/03-dashboard.png', 'screenshots/18-studyrooms.png']
create_video(v1, 'promo_video1_workspace.mp4')

v2 = ['screenshots/04-project.png', 'screenshots/05-quiz.png', 'screenshots/06-flashcards.png']
create_video(v2, 'promo_video2_ia_summarizer.mp4')

v3 = ['screenshots/09-communities.png', 'screenshots/10-community-detail.png']
create_video(v3, 'promo_video3_comunidades.mp4')
