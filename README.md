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