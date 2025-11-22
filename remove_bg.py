from PIL import Image
import math
import os

def color_distance(c1, c2):
    # Euclidean distance between two colors (ignoring alpha if present, or handling it)
    # c1 and c2 are tuples (R, G, B, A) or (R, G, B)
    r_diff = c1[0] - c2[0]
    g_diff = c1[1] - c2[1]
    b_diff = c1[2] - c2[2]
    return math.sqrt(r_diff**2 + g_diff**2 + b_diff**2)

def remove_background(image_path, tolerance=60): # Increased tolerance
    try:
        print(f"Processing {image_path}...")
        img = Image.open(image_path)
        img = img.convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # Sample the ENTIRE perimeter to get background candidates
        sample_coords = []
        # Top and Bottom rows
        for x in range(width):
            sample_coords.append((x, 0))
            sample_coords.append((x, 1)) # Sample 2 rows deep
            sample_coords.append((x, height-1))
            sample_coords.append((x, height-2))
        # Left and Right columns
        for y in range(height):
            sample_coords.append((0, y))
            sample_coords.append((1, y)) # Sample 2 cols deep
            sample_coords.append((width-1, y))
            sample_coords.append((width-2, y))

        bg_colors = set()
        for x, y in sample_coords:
            bg_colors.add(pixels[x, y])
            
        # Also add pure white and the typical checkerboard grays just in case
        bg_colors.add((255, 255, 255, 255)) # White
        bg_colors.add((204, 204, 204, 255)) # Light gray checkerboard
        bg_colors.add((255, 255, 255, 255)) # White
        
        # Convert bg_colors to list for easier iteration
        bg_candidates = list(bg_colors)

        # Flood fill from the entire perimeter
        # This ensures we catch background regions that might be separated by the character
        queue = []
        # Add all perimeter pixels to queue
        for x in range(width):
            queue.append((x, 0))
            queue.append((x, height-1))
        for y in range(height):
            queue.append((0, y))
            queue.append((width-1, y))
            
        visited = set(queue)
        
        while queue:
            x, y = queue.pop(0)
            
            if not (0 <= x < width and 0 <= y < height):
                continue

            current_color = pixels[x, y]
            
            # Check if this pixel is close to ANY of the sampled background colors
            is_bg = False
            
            # Optimization: if already transparent, it is bg
            if current_color[3] == 0:
                is_bg = True
            else:
                for bg_c in bg_candidates:
                    if color_distance(current_color, bg_c) <= tolerance:
                        is_bg = True
                        break
            
            if is_bg:
                # Make transparent
                pixels[x, y] = (0, 0, 0, 0)
                
                # Add neighbors
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            visited.add((nx, ny))
                            queue.append((nx, ny))

        img.save(image_path)
        print(f"Saved {image_path}")

    except Exception as e:
        print(f"Error processing {image_path}: {e}")

# Process the files
files = ['Cazador.png', 'CazadorSaltando.png', 'Cazador-X.png', 'cerdito.png']
for f in files:
    if os.path.exists(f):
        remove_background(f)
    else:
        print(f"File not found: {f}")
