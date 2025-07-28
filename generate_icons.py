#!/usr/bin/env python3
import subprocess
import os

# Define the required icon sizes for Android
icon_sizes = {
    'mipmap-hdpi': 72,
    'mipmap-mdpi': 48, 
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# Base directory for Android resources
base_dir = 'android/app/src/main/res'

# Create a simple PNG icon using Python PIL
def create_icon_with_pil():
    try:
        from PIL import Image, ImageDraw, ImageFont
        import math
        
        # Create a 512x512 image
        size = 512
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Background circle with gradient effect
        center = size // 2
        radius = 240
        
        # Draw background circle
        draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                    fill=(76, 175, 80, 255), outline=(27, 94, 32, 255), width=8)
        
        # Draw chart area
        chart_left = 120
        chart_right = 390
        chart_top = 140
        chart_bottom = 380
        
        # Draw grid lines (subtle)
        grid_color = (102, 187, 106, 80)
        for y in range(chart_top, chart_bottom + 1, 60):
            draw.line([(chart_left, y), (chart_right, y)], fill=grid_color, width=1)
        for x in range(chart_left, chart_right + 1, 60):
            draw.line([(x, chart_top), (x, chart_bottom)], fill=grid_color, width=1)
        
        # Draw axes
        axis_color = (255, 255, 255, 255)
        draw.line([(chart_left, chart_bottom), (chart_right, chart_bottom)], fill=axis_color, width=3)
        draw.line([(chart_left, chart_bottom), (chart_left, chart_top)], fill=axis_color, width=3)
        
        # Draw exponential curve points
        points = [
            (120, 380), (160, 365), (200, 330), (240, 260),
            (280, 170), (320, 100), (360, 70), (390, 64)
        ]
        
        # Draw curve lines
        line_color = (255, 107, 53, 255)
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=line_color, width=6)
        
        # Draw data points
        point_color = (255, 210, 63, 255)
        for point in points:
            x, y = point
            r = 5 if point == points[-1] else 4
            draw.ellipse([x-r, y-r, x+r, y+r], fill=point_color, outline=line_color, width=2)
        
        # Draw arrow at the end
        arrow_points = [(385, 54), (395, 64), (385, 74), (390, 64)]
        draw.polygon(arrow_points, fill=point_color, outline=line_color)
        
        # Draw habit dots at bottom
        dot_color = (165, 214, 167, 180)
        for x in range(140, 361, 20):
            draw.ellipse([x-3, 420-3, x+3, 420+3], fill=dot_color)
        
        return img
        
    except ImportError:
        print("PIL not available, creating simple colored circle...")
        # Fallback: create a simple colored circle
        from PIL import Image, ImageDraw
        
        size = 512
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Simple green circle with growth line
        center = size // 2
        radius = 240
        draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                    fill=(76, 175, 80, 255), outline=(27, 94, 32, 255), width=8)
        
        # Simple growth line
        draw.line([(150, 400), (200, 300), (300, 200), (400, 150)], 
                 fill=(255, 107, 53, 255), width=8)
        
        return img

def generate_android_icons():
    try:
        # Try to use PIL to create the icon
        from PIL import Image
        
        # Create the base icon
        base_icon = create_icon_with_pil()
        
        # Generate all required sizes
        for folder, size in icon_sizes.items():
            folder_path = os.path.join(base_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            
            # Resize and save
            resized_icon = base_icon.resize((size, size), Image.Resampling.LANCZOS)
            icon_path = os.path.join(folder_path, 'ic_launcher.png')
            resized_icon.save(icon_path, 'PNG')
            
            # Also create round icon
            round_icon_path = os.path.join(folder_path, 'ic_launcher_round.png')
            
            # Create round version
            round_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            
            # Create circular mask
            mask = Image.new('L', (size, size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse([0, 0, size, size], fill=255)
            
            # Apply mask to resized icon
            round_icon.paste(resized_icon, (0, 0))
            round_icon.putalpha(mask)
            round_icon.save(round_icon_path, 'PNG')
            
            print(f"Created {icon_path} ({size}x{size})")
            print(f"Created {round_icon_path} ({size}x{size})")
        
        print("✅ All Android icons generated successfully!")
        return True
        
    except ImportError:
        print("❌ PIL (Pillow) not installed. Installing...")
        return False

if __name__ == "__main__":
    try:
        success = generate_android_icons()
        if not success:
            print("Please install Pillow: pip install Pillow")
    except Exception as e:
        print(f"Error generating icons: {e}")