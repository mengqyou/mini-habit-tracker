#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_rounded_checkmark_icon(size):
    """Create normal checkmark icon with rounded corners"""
    
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
    
    # Checkmark coordinates - normal checkmark shape
    # Left point of the checkmark
    left_x = center_x - check_size * 0.3
    left_y = center_y
    
    # Bottom point (corner of the checkmark) - where both lines meet
    bottom_x = center_x - check_size * 0.1
    bottom_y = center_y + check_size * 0.2
    
    # Right point (top of the checkmark)
    right_x = center_x + check_size * 0.35
    right_y = center_y - check_size * 0.25
    
    # Draw checkmark stroke with thick lines and rounded ends
    stroke_width = max(4, int(size // 18))
    
    # Draw rounded checkmark: red left line, purple right line
    # Left line (red): from left point to corner point with rounded ends
    draw.line([left_x, left_y, bottom_x, bottom_y], 
              fill=red_color, width=stroke_width)
    
    # Right line (purple): from corner point to right point with rounded ends
    draw.line([bottom_x, bottom_y, right_x, right_y], 
              fill=purple_color, width=stroke_width)
    
    # Add rounded end caps to make the checkmark look smoother
    cap_radius = stroke_width // 2
    
    # Left end cap (red)
    draw.ellipse([left_x - cap_radius, left_y - cap_radius, 
                  left_x + cap_radius, left_y + cap_radius], 
                 fill=red_color)
    
    # Right end cap (purple)
    draw.ellipse([right_x - cap_radius, right_y - cap_radius, 
                  right_x + cap_radius, right_y + cap_radius], 
                 fill=purple_color)
    
    # Corner junction cap (purple to match the right line)
    draw.ellipse([bottom_x - cap_radius, bottom_y - cap_radius, 
                  bottom_x + cap_radius, bottom_y + cap_radius], 
                 fill=purple_color)
    
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
    """Create the rounded checkmark icon for review"""
    
    print("Creating rounded checkmark icon (512x512)...")
    print("Design:")
    print("  ✓ Normal checkmark shape")
    print("  ✓ Rounded corners and end caps")
    print("  ✓ Red left line + Purple right line")
    print("  ✓ Smooth corner junction")
    print("  ✓ Checkmark 30% larger")
    print("  ✓ Light green dot for first level")
    
    # Create the rounded checkmark icon
    rounded_icon = create_rounded_checkmark_icon(512)
    
    # Save for review
    rounded_icon.save("google-play-icon-512-rounded.png", 'PNG')
    
    print("✅ Rounded checkmark icon saved as: google-play-icon-512-rounded.png")
    print("\n📱 Rounded Checkmark Features:")
    print("   🟢 Green background = Basic level")
    print("   🔴 Red left line (rounded) = Good level") 
    print("   🟣 Purple right line (rounded) = Excellent level")
    print("   🟢🔴🟣 Colored dots = Light Green, Red, Purple")
    print("\nSmooth, modern checkmark with rounded corners!")

if __name__ == "__main__":
    main()