#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_natural_checkmark_icon(size):
    """Create checkmark icon with natural connection - overlap part all purple"""
    
    # Create a transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors from Material Design palette
    green_color = (76, 175, 80, 255)      # Material Design Green 500 (Basic level - background)
    light_green_color = (139, 195, 74, 255)  # Material Design Light Green 500 (for first dot)
    red_color = (244, 67, 54, 255)        # Material Design Red 500 (Good level)  
    purple_color = (156, 39, 176, 255)    # Material Design Purple 500 (Excellent level)
    
    # Draw background circle (green for basic level)
    margin = size * 0.05
    circle_size = size - (2 * margin)
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                 fill=green_color, outline=None)
    
    # Calculate checkmark dimensions - 30% larger than the working version
    check_scale = 0.78  # 30% larger, same proportions
    center_x = size // 2
    center_y = size // 2
    check_size = size * check_scale
    
    # Checkmark coordinates (same proportions as working version, just scaled up)
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
    stroke_width = max(4, int(size // 18))
    
    # Strategy: Draw red line first (shorter to avoid overlap), then purple line (full length)
    # This way the purple naturally covers the overlap area
    
    # Calculate shortened red line to stop before overlap
    overlap_distance = stroke_width * 0.7  # How much to shorten red line
    
    # Vector from left to bottom
    red_dx = bottom_x - left_x
    red_dy = bottom_y - left_y
    red_length = (red_dx**2 + red_dy**2)**0.5
    
    # Shorten red line by overlap_distance
    red_ratio = (red_length - overlap_distance) / red_length
    red_end_x = left_x + red_dx * red_ratio
    red_end_y = left_y + red_dy * red_ratio
    
    # Draw shortened red line (left to shortened bottom)
    draw.line([left_x, left_y, red_end_x, red_end_y], 
              fill=red_color, width=stroke_width)
    
    # Draw full purple line (bottom to right) - this will naturally cover the junction
    draw.line([bottom_x, bottom_y, right_x, right_y], 
              fill=purple_color, width=stroke_width)
    
    # Add three colored dots at the bottom to represent the 3 levels
    dot_size = size * 0.03
    dot_y = size * 0.85
    
    # Dot positions (evenly spaced)
    dot1_x = center_x - size * 0.08
    dot2_x = center_x
    dot3_x = center_x + size * 0.08
    
    # Draw dots in respective level colors
    # Dot 1: Light Green (different shade for first dot)
    draw.ellipse([dot1_x - dot_size, dot_y - dot_size, dot1_x + dot_size, dot_y + dot_size], 
                 fill=light_green_color)
    
    # Dot 2: Red (Good level)  
    draw.ellipse([dot2_x - dot_size, dot_y - dot_size, dot2_x + dot_size, dot_y + dot_size], 
                 fill=red_color)
    
    # Dot 3: Purple (Excellent level)
    draw.ellipse([dot3_x - dot_size, dot_y - dot_size, dot3_x + dot_size, dot_y + dot_size], 
                 fill=purple_color)
    
    return img

def main():
    """Create the natural checkmark icon for review"""
    
    print("Creating natural checkmark icon (512x512)...")
    print("Improvements:")
    print("  ✓ Red and purple lines connect naturally")
    print("  ✓ Overlap area is all purple")
    print("  ✓ Checkmark 30% larger")
    print("  ✓ Light green dot for first level")
    
    # Create the natural checkmark icon
    natural_icon = create_natural_checkmark_icon(512)
    
    # Save for review
    natural_icon.save("google-play-icon-512-natural.png", 'PNG')
    
    print("✅ Natural checkmark icon saved as: google-play-icon-512-natural.png")
    print("\n📱 Natural Checkmark Features:")
    print("   🟢 Green background = Basic level")
    print("   🔴 Red checkmark stem = Good level") 
    print("   🟣 Purple checkmark tip with natural connection = Excellent level")
    print("   🟢🔴🟣 Colored dots = Light Green, Red, Purple")
    print("\nThe red and purple lines now connect naturally!")

if __name__ == "__main__":
    main()