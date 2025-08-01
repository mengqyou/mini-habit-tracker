#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def create_final_rounded_checkmark_icon(size):
    """Create the final rounded checkmark icon - perfect for all uses"""
    
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
    """Update ALL icons with the final rounded checkmark design"""
    
    print("🚀 UPDATING ALL ICONS WITH FINAL ROUNDED CHECKMARK DESIGN")
    print("=" * 60)
    
    # Icon sizes for different densities
    icon_sizes = {
        'mdpi': 48,
        'hdpi': 72,
        'xhdpi': 96,
        'xxhdpi': 144,
        'xxxhdpi': 192
    }
    
    base_path = 'android/app/src/main/res'
    
    print("📱 Updating all Android app icons...")
    for density, size in icon_sizes.items():
        print(f"  Creating {density} icon ({size}x{size})...")
        
        # Create the icon
        icon = create_final_rounded_checkmark_icon(size)
        
        # Save both regular and round icons
        folder_path = f"{base_path}/mipmap-{density}"
        os.makedirs(folder_path, exist_ok=True)
        
        icon.save(f"{folder_path}/ic_launcher.png", 'PNG')
        icon.save(f"{folder_path}/ic_launcher_round.png", 'PNG')
        
        print(f"    ✅ Saved {density} icons")
    
    print("\n🏪 Creating Google Play Store icons...")
    
    # Create the Google Play Store icon (512x512)
    print("  Creating Google Play Store icon (512x512)...")
    store_icon = create_final_rounded_checkmark_icon(512)
    store_icon.save("google-play-icon-512.png", 'PNG')
    print("    ✅ Saved google-play-icon-512.png")
    
    # Also create a high-res version for other purposes
    print("  Creating high-resolution icon (1024x1024)...")
    hires_icon = create_final_rounded_checkmark_icon(1024)
    hires_icon.save("app-icon-1024.png", 'PNG')
    print("    ✅ Saved app-icon-1024.png")
    
    print("\n" + "=" * 60)
    print("✅ ALL ICONS UPDATED SUCCESSFULLY!")
    print("\n📱 Final Rounded Checkmark Features:")
    print("   🟢 Green background circle = Basic level")
    print("   🔴 Red left line (rounded ends) = Good level") 
    print("   🟣 Purple right line (rounded ends) = Excellent level")
    print("   🟢🔴🟣 Three colored dots = Light Green, Red, Purple")
    print("   ✨ Smooth rounded corners = Modern, professional look")
    print("   📏 30% larger checkmark = More prominent and visible")
    print("\n🎯 Updated Files:")
    print("   • All Android app icons (mdpi to xxxhdpi)")
    print("   • Both ic_launcher.png and ic_launcher_round.png")
    print("   • Google Play Store icon (512x512)")
    print("   • High-resolution icon (1024x1024)")
    print("\n🔄 Next Steps:")
    print("   1. Build and install on emulator")
    print("   2. Install on Pixel phone")
    print("   3. Build final production AAB")
    print("   4. Ready for Google Play Store submission!")

if __name__ == "__main__":
    main()