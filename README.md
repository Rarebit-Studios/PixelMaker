# Pixel Art Editor 

A simple web-based pixel art tool. Create, edit, and export pixel art with support for multiple color palettes and exports to Makecode Arcade.

I threw this together for some kids workshops where we needed a simple image import/export to makecode arcade.
Its expanded a bit to cover favicon making and images for embedded platforms such are arduino. I'm pretty rough as javascript and web stuff, there will be gremlins. 

It's tools are deliberately limited to enforce the idea of constraint. 

Palettes from https://lospec.com/palette-list ... Your Awesome


You can use it here: 
[https://pixel.realityboffins.com](https://pixel.realityboffins.com)

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
  - Steam Lords
  - Pico-8
  - CGA
  - NA16
  - GameBoy
  - Grayscale
  - Pastel
  - Jehkoba 32 (32 colors)
  - Endesga 32 (32 colors)
  - Nanner 32 (32 colors)
- **Custom Color Picker**: Choose any color
- **Dual Palette Display**: Easy access to colors on both sides
- **Smart Palette Switching**: Automatically matches existing colors to closest equivalents

### Canvas Options
- **Adjustable Resolution**: 8x8 to 32x32 pixels
- **Live Preview**: Real-time miniature preview
- **Coordinate Display**: Shows current pixel position

### Gallery System
- **Save to Gallery**: Store artwork with unique names
- **Browse Gallery**: View all saved artwork with thumbnails
- **Filename Display**: Shows artwork name under thumbnails
- **Duplicate Prevention**: Prevents saving artwork with existing names
- **Batch Operations**: 
  - Select multiple artworks
  - Create spritesheets from selected artwork
  - Delete multiple artworks at once

### Import/Export
- **Save as PNG**: Export with customizable scale
- **Image Import**: Import and automatically resize images
- **Clipboard Support**: Paste images directly from clipboard
- **MakeCode Export**: Generate code for MakeCode Arcade
- **Share Artwork**: Generate shareable URLs that include:
  - Pixel data
  - Palette selection
  - Resolution
  - Artwork name

### Auto-Save Features
- Automatic saving every 60 seconds
- Save on page close
- Restore previous work on reload
- Persistent filenames across sessions

### File Management
- **Automatic Naming**: Generates unique names for new artwork (format: AdjectiveNoun1234)
- **Filename Display**: Shows current artwork name in:
  - Browser tab
  - Top-left corner
  - Gallery thumbnails
- **Name Persistence**: Maintains filename when sharing artwork

### Responsive Design
- Works on desktop and mobile devices
- Touch-optimized interface
- Landscape and portrait mode support
- Tool tooltips with shortcut information

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
The share URL system uses a compressed format to efficiently encode pixel art data, making URLs shorter and more manageable.

#### Data Structure
```javascript
{
    "p": [[count, colorIndex], ...], // Run-length encoded pixel data
    "l": "paletteName",             // Palette identifier
    "r": resolution                 // Canvas resolution (8-64)
}
```

#### Compression Pipeline
1. **Color Mapping**
   - Convert each pixel's color to its palette index (0-31)
   - Map transparent pixels to -1
   - Reduces color data from "#RRGGBB" (7 chars) to 1-2 digits

2. **Run-Length Encoding**
   - Compress consecutive identical colors into [count, colorIndex] pairs
   - Example:
     ```javascript
     Original:  [0,0,0,1,1,-1,-1]
     Encoded:   [[3,0], [2,1], [2,-1]]
     ```

3. **JSON Serialization**
   - Convert compressed data structure to JSON

4. **Base64 Encoding**
   - Encode JSON as Base64 for URL-safe sharing

#### Decompression Pipeline
1. **Base64 Decode** → JSON string
2. **JSON Parse** → data structure
3. **RLE Decode** → flat pixel array
4. **Color Index Resolution** → RGB colors
5. **Canvas Rendering**


### MakeCode Export
The MakeCode export feature generates code compatible with MakeCode Arcade's sprite system.

1. Converts pixel data to MakeCode's format
2. Generates JavaScript code block
3. Includes:
   - Sprite definition
   - Transparency handling

Example output:
```javascript
const mySprite = sprites.create(img`
    . . . . . . . . 
    . 1 1 1 1 1 . . 
    . 1 . . . 1 . . 
    . 1 . . . 1 . . 
    . 1 1 1 1 1 . . 
    . . . . . . . . 
`, SpriteKind.Player)
```

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

## Version History

- 1.2.2 - Current Version
  - Fixed Ico export
  - Fixed Gallery Size
  - Fixed Tooltips
  - Added 64x64 and 128x128 sizes
  - Fixed Some general bugs

- 1.1.0
  - Added ICO file export support
  - Fixed icon export functionality
  - Improved file format handling

- 1.0.9 - Previous version
  - Added drag prevention on all buttons and images
  - Added export options for embedded displays (Arduino, Adafruit GFX, Raw Binary)
  - Improved save modal with multiple format options
  - Enhanced user interface consistency

- 1.0.8 - Previous version
  - Added automatic artwork naming system (AdjectiveNoun1234)
  - Added filename display in browser tab and interface
  - Added spritesheet creation from multiple artworks
  - Added tooltips for all tools with shortcut information
  - Added duplicate name prevention in gallery
  - Improved sharing to include artwork names

- 1.0.7 - Previous version
  - Added gallery system with thumbnail previews
  - Added gallery batch operations (select all, delete multiple)
  - Added persistent filenames across sessions
  - Added filename display under gallery thumbnails
  - Improved mobile interface responsiveness
  
- 1.0.6 - Previous version
  - Added new color palettes (Steam Lords, Pico-8, CGA)
  - Added GameBoy, Grayscale, and Pastel palettes
  - Added Jehkoba32 color palette
  - Improved touch interface

- 1.0.5 - Previous version
  - Added 32-color palette support
  - Improved mobile interface
  - Added share functionality

- 1.0.4 - Previous version
  - Added MakeCode export
  - Improved color handling

- 1.0.3 - Initial release

## Credits
- Created by Charles Gershom - Reality Boffins
- Visit [realityboffins.com](https://realityboffins.com)

