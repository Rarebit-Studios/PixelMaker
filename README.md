# Pixel Art Editor

A powerful, web-based pixel art creation tool designed for both desktop and mobile use. Create, edit, and export pixel art with support for multiple color palettes and resolutions.

## Features

### Drawing Tools
- **Pen Tool (P)**: Draw with selected color
- **Eraser Tool (E)**: Clear pixels
- **Color Picker (I)**: Sample colors from the canvas
- **Fill Tool (F)**: Flood fill connected areas
- **Undo/Redo**: Multiple levels of undo/redo (Ctrl+Z/Ctrl+Y)

### Color Management
- **Multiple Color Palettes**:
  - Default 16-color palette
  - MakeCode Arcade palette
  - Endesga32 (32 colors)
  - Nanner32 (32 colors)
- **Custom Color Picker**: Choose any color
- **Dual Palette Display**: Easy access to colors on both sides
- **Smart Palette Switching**: Automatically matches existing colors to closest equivalents

### Canvas Options
- **Adjustable Resolution**: 8x8 to 64x64 pixels
- **Live Preview**: Real-time miniature preview
- **Coordinate Display**: Shows current pixel position

### Import/Export
- **Save as PNG**: Export with customizable scale
- **Image Import**: Import and automatically resize images
- **Clipboard Support**: Paste images directly from clipboard
- **MakeCode Export**: Generate code for MakeCode Arcade
- **Share Artwork**: Generate shareable URLs

### Auto-Save Features
- Automatic saving every 60 seconds
- Save on page close
- Restore previous work on reload

### Responsive Design
- Works on desktop and mobile devices
- Touch-optimized interface
- Landscape and portrait mode support

## Keyboard Shortcuts
- `P` - Select Pen Tool
- `E` - Select Eraser Tool
- `I` - Select Color Picker Tool
- `F` - Select Fill Tool
- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo

## Technical Details

### Storage
- Uses localStorage for auto-saving
- Saves:
  - Pixel data
  - Current resolution
  - Selected palette
  - Tool states

### File Formats
- Exports as PNG with transparency support
- Imports common image formats (PNG, JPG, GIF)
- MakeCode export in sprite format

### Color Handling
- RGB and Hex color support
- Intelligent color matching when switching palettes
- Transparency support

### Share URL Compression Format
The share URL uses a compressed format to efficiently encode pixel art data:

#### Data Structure
```javascript
{
    "p": [[count, colorIndex], ...], // Compressed pixel data
    "l": "paletteName",             // Palette identifier
    "r": resolution                 // Canvas resolution
}
```

#### Compression Method
1. **Color Index Mapping**
   - Each pixel color is mapped to its palette index (0-31)
   - Transparent pixels are mapped to -1
   - This reduces color data from 7 characters (#RRGGBB) to 1-2 digits

2. **Run-Length Encoding (RLE)**
   - Consecutive identical colors are compressed into [count, colorIndex] pairs
   - Example: 
     - Original: [0,0,0,0,1,1,1,-1,-1]
     - Compressed: [[4,0], [3,1], [2,-1]]

3. **Base64 Encoding**
   - The final JSON is encoded in Base64 to ensure URL safety

#### Example
```javascript
// Original pixel data (16x16 image)
"#FF0000,#FF0000,transparent,#00FF00..." (256 colors * 7 chars each)

// Compressed format
{
    "p": [[2,4], [1,-1], [1,7]...],  // [count, colorIndex] pairs
    "l": "default",                   // Palette name
    "r": 16                          // 16x16 resolution
}
```

#### Compression Benefits
- **Size Reduction**: 
  - Color values: ~85% reduction (7 chars → 1-2 digits)
  - RLE: Variable reduction (best with large same-color areas)
  - Example: 16x16 solid color image
    - Uncompressed: ~3,584 bytes (256 * 7 chars)
    - Compressed: ~20 bytes [[256,4]]

- **Palette Integrity**:
  - Colors are always matched to exact palette colors
  - Ensures consistency across shares

#### Backward Compatibility
- The system can still load older uncompressed share URLs
- Automatically detects and handles both formats

### Loading Process
1. Decode Base64 string
2. Parse JSON data
3. Extract resolution and create canvas
4. Set palette
5. Decompress RLE data
6. Convert color indices back to actual colors
7. Render to canvas

## Usage Guide

### Getting Started
1. Select your desired canvas resolution
2. Choose a color palette
3. Select a color from the palette or color picker
4. Use the pen tool to start drawing

### Creating Pixel Art
1. Use the pen tool for drawing
2. Use eraser to remove pixels
3. Use fill tool for larger areas
4. Use color picker to match existing colors
5. Use undo/redo for corrections

### Saving Your Work
- Click the save button to export as PNG
- Work is automatically saved in browser
- Generate share URL for collaboration

### Importing Images
1. Click import or use paste button
2. Select an image file or paste from clipboard
3. Image will be automatically resized to fit canvas

### MakeCode Integration
1. Switch to MakeCode palette
2. Create your sprite
3. Click Export MakeCode
4. Copy generated code to MakeCode Arcade

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Installation
No installation required. Access directly through web browser at [URL].

## Development

### File Structure
- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `pixengine.js` - Core application logic
- `palettes.js` - Color palette definitions

### Local Development
1. Clone the repository
2. Open index.html in a browser
3. No build process required

## Version History
- 1.0.5 - Current version
  - Added 32-color palette support
  - Improved mobile interface
  - Added share functionality
- 1.0.4 - Previous version
  - Added MakeCode export
  - Improved color handling
- 1.0.3 - Initial release

## Credits
- Created by Reality Boffins
- Visit [realityboffins.com](https://realityboffins.com)

## License
[Add your license information here] 