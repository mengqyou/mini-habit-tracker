#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_enhanced_three_color_checkmark_icon(size):
    """Create the enhanced three-color checkmark icon with bigger/wider checkmark and colored dots"""
    
    # Create a transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors from Material Design palette
    green_color = (76, 175, 80, 255)    # Material Design Green 500 (Basic level)
    red_color = (244, 67, 54, 255)      # Material Design Red 500 (Good level)  
    purple_color = (156, 39, 176, 255)  # Material Design Purple 500 (Excellent level)
    
    # Draw background circle (green for basic level)
    margin = size * 0.05
    circle_size = size - (2 * margin)
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                 fill=green_color, outline=None)
    
    # Calculate enhanced checkmark dimensions
    # Previous: check_scale = 0.6, now 30% bigger = 0.6 * 1.3 = 0.78
    check_scale = 0.78  # 30% bigger than before
    width_multiplier = 1.5  # 50% wider
    
    center_x = size // 2
    center_y = size // 2
    check_size = size * check_scale
    
    # Checkmark coordinates (relative to center) - made wider
    # Left point of the checkmark (moved further left for width)
    left_x = center_x - check_size * 0.35 * width_multiplier  # was 0.3, now wider
    left_y = center_y
    
    # Bottom point (corner of the checkmark)
    bottom_x = center_x - check_size * 0.1
    bottom_y = center_y + check_size * 0.2
    
    # Right point (top of the checkmark) - moved further right for width
    right_x = center_x + check_size * 0.4 * width_multiplier  # was 0.35, now wider
    right_y = center_y - check_size * 0.25
    
    # Draw checkmark stroke with thick lines (also bigger for the larger checkmark)
    stroke_width = max(4, size // 15)  # Increased stroke width for bigger checkmark
    
    # Draw checkmark stem (left to bottom) in RED (good level)
    draw.line([left_x, left_y, bottom_x, bottom_y], 
              fill=red_color, width=stroke_width)
    
    # Draw checkmark tip (bottom to right) in PURPLE (excellent level)
    draw.line([bottom_x, bottom_y, right_x, right_y], 
              fill=purple_color, width=stroke_width)
    
    # Add three colored dots at the bottom to represent the 3 levels
    dot_size = size * 0.03  # Slightly bigger dots for better visibility
    dot_y = size * 0.85
    
    # Dot positions (evenly spaced)
    dot1_x = center_x - size * 0.09  # Spread them out a bit more
    dot2_x = center_x
    dot3_x = center_x + size * 0.09
    
    # Draw dots in respective level colors
    # Dot 1: Green (Basic level)
    draw.ellipse([dot1_x - dot_size, dot_y - dot_size, dot1_x + dot_size, dot_y + dot_size], 
                 fill=green_color)
    
    # Dot 2: Red (Good level)  
    draw.ellipse([dot2_x - dot_size, dot_y - dot_size, dot2_x + dot_size, dot_y + dot_size], 
                 fill=red_color)
    
    # Dot 3: Purple (Excellent level)
    draw.ellipse([dot3_x - dot_size, dot_y - dot_size, dot3_x + dot_size, dot_y + dot_size], 
                 fill=purple_color)
    
    return img

def main():
    """Create the enhanced Google Play Store icon for review"""
    
    print("Creating enhanced Google Play Store icon (512x512)...")
    print("Changes:")
    print("  ✓ Checkmark 30% bigger (0.6 → 0.78 scale)")
    print("  ✓ Checkmark 50% wider")
    print("  ✓ Bottom dots now colored: Green, Red, Purple")
    
    # Create the enhanced icon
    enhanced_icon = create_enhanced_three_color_checkmark_icon(512)
    
    # Save for review
    enhanced_icon.save("google-play-icon-512-enhanced.png", 'PNG')
    
    print("✅ Enhanced icon saved as: google-play-icon-512-enhanced.png")
    print("\n📱 Enhanced Icon Features:")
    print("   🟢 Green background = Basic level")
    print("   🔴 Red checkmark stem (bigger & wider) = Good level") 
    print("   🟣 Purple checkmark tip (bigger & wider) = Excellent level")
    print("   🔴🟢🟣 Colored dots = Three level indicators")
    print("\nPlease review and confirm before updating all app icons!")

if __name__ == "__main__":
    main()