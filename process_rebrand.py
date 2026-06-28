import cv2
import numpy as np
import os
import glob
import re
import json

def run_pipeline():
    print("Starting Rebrand and Cropping Process...")

    # 1. Update style.css
    css_path = os.path.join('src', 'style.css')
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()

        # Replace variables for Orange and Black theme
        css_content = re.sub(r'--bg-dark:\s*#050508;', '--bg-dark: #0d0d0d;', css_content)
        css_content = re.sub(r'--bg-card:\s*rgba\(15, 15, 25, 0\.7\);', '--bg-card: rgba(25, 25, 25, 0.7);', css_content)
        css_content = re.sub(r'--bg-card-hover:\s*rgba\(22, 22, 38, 0\.85\);', '--bg-card-hover: rgba(35, 35, 35, 0.85);', css_content)
        css_content = re.sub(r'--border-glow:\s*rgba\(0, 242, 254, 0\.3\);', '--border-glow: rgba(255, 102, 0, 0.3);', css_content)
        css_content = re.sub(r'--accent-cyan:\s*#00f2fe;', '--accent-cyan: #ff6600;', css_content)
        css_content = re.sub(r'--accent-indigo:\s*#4facfe;', '--accent-indigo: #cc3300;', css_content)
        css_content = re.sub(r'--text-secondary:\s*#94a3b8;', '--text-secondary: #a3a3a3;', css_content)
        css_content = re.sub(r'--text-muted:\s*#64748b;', '--text-muted: #666666;', css_content)
        css_content = re.sub(r'--grad-dark:\s*linear-gradient\(180deg, #07070d 0%, var\(--bg-dark\) 100%\);', '--grad-dark: linear-gradient(180deg, #1a1a1a 0%, var(--bg-dark) 100%);', css_content)
        css_content = re.sub(r'--grad-glow:\s*radial-gradient\(circle, rgba\(0, 242, 254, 0\.15\) 0%, rgba\(79, 172, 254, 0\) 70%\);', '--grad-glow: radial-gradient(circle, rgba(255, 102, 0, 0.15) 0%, rgba(204, 51, 0, 0) 70%);', css_content)

        # Replace box-shadow colors
        css_content = css_content.replace('0, 242, 254', '255, 102, 0')
        css_content = css_content.replace('79, 172, 254', '204, 51, 0')

        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print("Updated src/style.css to Orange and Black theme.")
    else:
        print(f"Warning: Could not find {css_path}")

    # 2. Process Images
    input_dir = 'ilovepdf_pages-to-jpg'
    output_dir = os.path.join('public', 'assets', 'products')
    os.makedirs(output_dir, exist_ok=True)

    files = sorted(glob.glob(os.path.join(input_dir, '*.jpg')))
    if not files:
        print(f"No JPG files found in {input_dir}. Please check the folder name.")
        return

    new_products = []
    product_id_counter = 1

    print("Extracting and cropping toys from catalog pages...")
    for file in files:
        img = cv2.imread(file)
        if img is None:
            continue
        h, w, _ = img.shape
        
        # Split horizontally into top and bottom halves (each page has 2 items typically)
        halves = [
            img[0:h//2, 0:w],
            img[h//2:h, 0:w]
        ]
        
        for half in halves:
            # Crop to the left ~65% to isolate the image and avoid text
            left_crop = half[:, 0:int(w*0.65)]
            
            # Convert to grayscale and threshold (background is white, so invert)
            gray = cv2.cvtColor(left_crop, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                c = max(contours, key=cv2.contourArea)
                x, y, w_c, h_c = cv2.boundingRect(c)
                
                # Add padding to the crop
                pad = 30
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(left_crop.shape[1], x + w_c + pad)
                y2 = min(left_crop.shape[0], y + h_c + pad)
                
                cropped_figure = left_crop[y1:y2, x1:x2]
                
                if cropped_figure.shape[0] < 50 or cropped_figure.shape[1] < 50:
                    cropped_figure = left_crop
            else:
                cropped_figure = left_crop
                
            output_filename = f'product_{product_id_counter:03d}.jpg'
            output_path = os.path.join(output_dir, output_filename)
            cv2.imwrite(output_path, cropped_figure)
            
            new_products.append({
                'id': f'auto-prod-{product_id_counter}',
                'categoryId': 'ar-enterprises',
                'name': f'A.R. Collectible Figure {product_id_counter}',
                'scale': 'Assorted',
                'material': 'PVC/ABS',
                'dimensions': 'See packaging',
                'releaseDate': 'Available Now',
                'description': 'Premium imported collectible toy figure. Part of the new wholesale collection.',
                'features': ['Highly detailed sculpt', 'Vibrant paint application', 'Official wholesale packaging'],
                'image': f'/assets/products/{output_filename}'
            })
            
            product_id_counter += 1

    print(f"Processed {len(files)} pages and generated {product_id_counter - 1} cropped images in {output_dir}")

    # 3. Update data.js
    data_js_path = os.path.join('src', 'data.js')
    if os.path.exists(data_js_path):
        with open(data_js_path, 'r', encoding='utf-8') as f:
            data_content = f.read()

        # Generate JSON string for new products without outer brackets
        new_products_str = json.dumps(new_products, indent=2)
        new_products_str = new_products_str.strip()[1:-1]

        if "];" in data_content:
            last_bracket_idx = data_content.rfind('];')
            if last_bracket_idx != -1:
                before_bracket = data_content[:last_bracket_idx].strip()
                if not before_bracket.endswith('['):
                    insert_str = ",\n" + new_products_str + "\n"
                else:
                    insert_str = "\n" + new_products_str + "\n"
                    
                new_data_content = data_content[:last_bracket_idx] + insert_str + data_content[last_bracket_idx:]
                
                with open(data_js_path, 'w', encoding='utf-8') as f:
                    f.write(new_data_content)
                print("Updated src/data.js with new products.")
        else:
            print("Could not find the end of the products array in data.js")
    else:
        print(f"Warning: Could not find {data_js_path}")

    print("Rebranding and Automation Complete! Run 'npm run dev' (or use your live server) to view changes.")

if __name__ == '__main__':
    run_pipeline()
