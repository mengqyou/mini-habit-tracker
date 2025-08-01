#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_three_color_checkmark_icon(size):
    """Create the three-color checkmark icon representing our 3-level habit system"""
    
    # Create a transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors from Material Design palette
    green_color = (76, 175, 80, 255)    # Material Design Green 500 (Basic level)
    red_color = (244, 67, 54, 255)      # Material Design Red 500 (Good level)  
    purple_color = (156, 39, 176, 255)  # Material Design Purple 500 (Excellent level)
    white_color = (255, 255, 255, 255)
    
    # Draw background circle (green for basic level)
    margin = size * 0.05
    circle_size = size - (2 * margin)
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                 fill=green_color, outline=None)
    
    # Calculate checkmark dimensions (50% larger than before)
    check_scale = 0.6  # Increased from 0.4 for 50% larger checkmark
    center_x = size // 2
    center_y = size // 2
    check_size = size * check_scale
    
    # Checkmark coordinates (relative to center)
    # Left point of the checkmark
    left_x = center_x - check_size * 0.3
    left_y = center_y
    
    # Bottom point (corner of the checkmark)
    bottom_x = center_x - check_size * 0.1
    bottom_y = center_y + check_size * 0.2
    
    # Right point (top of the checkmark)
    right_x = center_x + check_size * 0.35
    right_y = center_y - check_size * 0.25
    
    # Draw checkmark stroke with thick lines
    stroke_width = max(3, size // 20)
    
    # Draw checkmark stem (left to bottom) in RED (good level)
    draw.line([left_x, left_y, bottom_x, bottom_y], 
              fill=red_color, width=stroke_width)
    
    # Draw checkmark tip (bottom to right) in PURPLE (excellent level)
    draw.line([bottom_x, bottom_y, right_x, right_y], 
              fill=purple_color, width=stroke_width)
    
    # Add three small dots at the bottom to represent the 3 levels
    dot_size = size * 0.025
    dot_y = size * 0.85
    
    # Dot positions (evenly spaced)
    dot1_x = center_x - size * 0.08
    dot2_x = center_x
    dot3_x = center_x + size * 0.08
    
    # Draw dots in respective colors
    draw.ellipse([dot1_x - dot_size, dot_y - dot_size, dot1_x + dot_size, dot_y + dot_size], 
                 fill=white_color)
    draw.ellipse([dot2_x - dot_size, dot_y - dot_size, dot2_x + dot_size, dot_y + dot_size], 
                 fill=white_color)
    draw.ellipse([dot3_x - dot_size, dot_y - dot_size, dot3_x + dot_size, dot_y + dot_size], 
                 fill=white_color)
    
    return img

def main():
    """Update all Android app icons with the three-color checkmark design"""
    
    # Icon sizes for different densities
    icon_sizes = {
        'mdpi': 48,
        'hdpi': 72,
        'xhdpi': 96,
        'xxhdpi': 144,
        'xxxhdpi': 192
    }
    
    base_path = 'android/app/src/main/res'
    
    for density, size in icon_sizes.items():
        print(f"Creating {density} icon ({size}x{size})...")
        
        # Create the icon
        icon = create_three_color_checkmark_icon(size)
        
        # Save both regular and round icons
        folder_path = f"{base_path}/mipmap-{density}"
        os.makedirs(folder_path, exist_ok=True)
        
        icon.save(f"{folder_path}/ic_launcher.png", 'PNG')
        icon.save(f"{folder_path}/ic_launcher_round.png", 'PNG')
        
        print(f"  Saved {density} icons")
    
    # Also create the Google Play Store icon (512x512)
    print("Creating Google Play Store icon (512x512)...")
    store_icon = create_three_color_checkmark_icon(512)
    store_icon.save("google-play-icon-512.png", 'PNG')
    print("  Saved google-play-icon-512.png")
    
    print("\n✅ All icons updated successfully!")
    print("📱 Icons represent the 3-level habit system:")
    print("   🟢 Green background = Basic level")
    print("   🔴 Red checkmark stem = Good level") 
    print("   🟣 Purple checkmark tip = Excellent level")
    print("   ⚪ White dots = Three levels indicator")

if __name__ == "__main__":
    main()