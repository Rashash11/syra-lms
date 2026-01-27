import re
import os

source_path = r'e:\lms\lights\lquid-glass'
dest_path = r'apps/web/src/shared/ui/components/LiquidGlassAssets.tsx'

try:
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()

    svg_match = re.search(r'(<svg.*?</svg>)', content, re.DOTALL)
    if svg_match:
        svg_content = svg_match.group(1)
        # Fix React attributes
        svg_content = svg_content.replace('xlink:href', 'xlinkHref')
        
        template = f"""'use client';

import React from 'react';

export const LiquidGlassAssets = () => (
  <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
    {svg_content}
  </div>
);
"""
        
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(template)
        print("Success")
    else:
        print("No SVG found")
except Exception as e:
    print(f"Error: {e}")
