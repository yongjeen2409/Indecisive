from PIL import Image

def remove_checkerboard(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # We will perform a simple BFS flood-fill from the 4 corners to find background pixels
    # Since it's a checkerboard, we need a slightly forgiving threshold.
    # The checkerboard is white (255,255,255) and gray (around 200-240).
    
    def is_bg(x, y):
        r, g, b, a = pixels[x, y]
        # Check if the pixel is "bright and grayscale-ish"
        # i.e. r, g, b > 190 and the difference between them is small
        if r > 190 and g > 190 and b > 190:
            if abs(r - g) < 20 and abs(r - b) < 20 and abs(g - b) < 20:
                return True
        # Specific check for pure white
        if r == 255 and g == 255 and b == 255:
            return True
        return False

    visited = set()
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    for start_node in queue:
        if is_bg(*start_node):
            visited.add(start_node)
            
    # Standard BFS
    q = list(visited)
    while q:
        x, y = q.pop(0)
        # Make it transparent
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        
        # Check neighbors
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    if is_bg(nx, ny):
                        visited.add((nx, ny))
                        q.append((nx, ny))
                        
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_checkerboard("public/departmentstaff.png", "public/staff_crisp.png")
    remove_checkerboard("public/departmentlead.jpeg", "public/lead_crisp.png")
    remove_checkerboard("public/director.jpeg", "public/director_crisp.png")
    print("Done removing background from original images!")
