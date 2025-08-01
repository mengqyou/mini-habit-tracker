#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_refined_three_color_checkmark_icon(size):
    """Create refined three-color checkmark icon with 30% larger checkmark and different green dot"""
    
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
    # Previous working: check_scale = 0.6, now 30% larger = 0.6 * 1.3 = 0.78
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
    
    # Draw checkmark stroke with thick lines (scaled for larger checkmark)
    stroke_width = max(4, int(size // 18))  # Adjusted for 30% larger checkmark
    
    # Draw checkmark stem (left to bottom) in RED (good level)
    draw.line([left_x, left_y, bottom_x, bottom_y], 
              fill=red_color, width=stroke_width)
    
    # Draw checkmark tip (bottom to right) in PURPLE (excellent level)
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
    """Create the refined Google Play Store icon for review"""
    
    print("Creating refined Google Play Store icon (512x512)...")
    print("Changes from working version:")
    print("  ✓ Checkmark 30% larger (same proportions)")
    print("  ✓ First dot: Light Green instead of white")
    print("  ✓ Keep everything else exactly the same")
    
    # Create the refined icon
    refined_icon = create_refined_three_color_checkmark_icon(512)
    
    # Save for review
    refined_icon.save("google-play-icon-512-refined.png", 'PNG')
    
    print("✅ Refined icon saved as: google-play-icon-512-refined.png")
    print("\n📱 Refined Icon Features:")
    print("   🟢 Green background = Basic level")
    print("   🔴 Red checkmark stem (30% larger) = Good level") 
    print("   🟣 Purple checkmark tip (30% larger) = Excellent level")
    print("   🟢🔴🟣 Colored dots = Light Green, Red, Purple")
    print("\nPlease review this refined version!")

if __name__ == "__main__":
    main()