const APP_VERSION = '1.1.0'; // Match this with meta tag and title

const nameGenerator = {
    adjectives: [
        "Brave", "Cosmic", "Mystic", "Pixel", "Digital", "Neon", "Retro", "Cyber", 
        "Crystal", "Golden", "Silent", "Hidden", "Vibrant", "Ancient", "Glowing",
        "Tiny", "Mighty", "Stellar", "Lunar", "Solar", "Electric", "Quantum", 
        "Radiant", "Dreamy", "Magical", "Sacred", "Wild", "Secret", "Dancing"
    ],
    nouns: [
        "Pixel", "Sprite", "Canvas", "Art", "Creation", "Dream", "Vision", "World",
        "Beast", "Hero", "Legend", "Spirit", "Star", "Moon", "Sun", "Heart",
        "Dragon", "Knight", "Wizard", "Warrior", "Sage", "Guardian", "Explorer",
        "Wanderer", "Seeker", "Maker", "Builder", "Crafter", "Master"
    ],
    
    generate() {
        const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
        const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
        // Generate random number between 1000 and 9999
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `${adjective}${noun}${number}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Generate new random name before importing
                    const randomName = nameGenerator.generate();
                    const filenameDisplay = document.querySelector('.filename-display');
                    if (filenameDisplay) {
                        filenameDisplay.textContent = randomName;
                    }
                    importImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(files[0]);
        } else {
            showNotification('Please drop an image file', 3000);
        }
    });
    
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    
    const pixelGrid = document.getElementById('pixelGrid');
    const colorPicker = document.getElementById('colorPicker');
    const penBtn = document.getElementById('pen');
    const eraserBtn = document.getElementById('eraser');
    const clearBtn = document.getElementById('clear');
    const saveBtn = document.getElementById('save');
    const importBtn = document.getElementById('import');
    const imageInput = document.getElementById('imageInput');
    const leftPalette = document.querySelector('.left-palette');
    const rightPalette = document.querySelector('.right-palette');
    const leftPalette2 = document.querySelector('.left-palette2');
    const rightPalette2 = document.querySelector('.right-palette2');
    const miniPreview = document.getElementById('miniPreview');
    const paletteSelector = document.getElementById('paletteSelector');
    const toolsDiv = document.querySelector('.tools');
    const exportMakeCodeBtn = document.getElementById('exportMakeCode');
    const colorPickerBtn = document.getElementById('colorpicker');
    const coordinatesDisplay = document.getElementById('coordinates');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const floodFillBtn = document.getElementById('floodfill');
    
    // State management
    const MAX_HISTORY_SIZE = 100;
    let undoStack = [];
    let redoStack = [];
    let isUndoRedoOperation = false;
    let currentResolution = 16;
    let currentPalette = palettes.default;
    let isDrawing = false;
    let currentColor = '#1a1c2c';
    let isEraser = false;
    let isPickerActive = false;
    let isFloodFill = false;
    let currentTool = 'pen';

    // Previous tool state
    let previousToolState = {
        isEraser: false,
        penColor: '#1a1c2c'
    };

    // Add this near the top with other const declarations
    const notificationContainer = document.createElement('div');
    notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        transition: opacity 0.3s;
        opacity: 0;
        pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);

    // Add this function to show notifications
    function showNotification(message, duration = 2000) {
        notificationContainer.textContent = message;
        notificationContainer.style.opacity = '1';
        
        setTimeout(() => {
            notificationContainer.style.opacity = '0';
        }, duration);
    }

    // Update saveToLocalStorage function to include filename
    function saveToLocalStorage() {
        try {
            const pixels = document.querySelectorAll('.pixel');
            const pixelData = Array.from(pixels).map(pixel => pixel.style.backgroundColor || 'transparent');
            const currentPaletteName = paletteSelector.value;
            const currentFilename = document.querySelector('.filename-display').textContent;
            
            // Save pixel data, resolution, palette, and filename
            localStorage.setItem('pixelArtData', JSON.stringify(pixelData));
            localStorage.setItem('pixelArtResolution', currentResolution.toString());
            localStorage.setItem('pixelArtPalette', currentPaletteName);
            localStorage.setItem('pixelArtFilename', currentFilename);
            
            showNotification('Auto-saving...', 1000);
        } catch (error) {
            console.error('Error saving data:', error);
            showNotification('Error saving work', 3000);
        }
    }

    // Function to update color swatches
    function updateColorSwatches() {
        // Clear existing swatches
        leftPalette.innerHTML = '';
        rightPalette.innerHTML = '';
   
        leftPalette2.innerHTML = '';
        rightPalette2.innerHTML = '';

        // Determine palette distribution based on size
        if (currentPalette.length <= 16) {
            // For 16 or fewer colors, use only main palettes
            const leftColors = currentPalette.slice(0, 8);
            const rightColors = currentPalette.slice(8);

            // Hide secondary palettes
            leftPalette2.style.display = 'none';
            rightPalette2.style.display = 'none';

            // Create color swatches for main palettes
            leftColors.forEach(color => {
                leftPalette.appendChild(createColorSwatch(color));
            });

            rightColors.forEach(color => {
                rightPalette.appendChild(createColorSwatch(color));
            });
        } else {
            // For up to 32 colors, use all palettes
            const leftColors = currentPalette.slice(0, 8);
            const rightColors = currentPalette.slice(8, 16);
            const leftColors2 = currentPalette.slice(16, 24);
            const rightColors2 = currentPalette.slice(24, 32);

            // Show secondary palettes
            leftPalette2.style.display = 'flex';
            rightPalette2.style.display = 'flex';

            // Create color swatches for all palettes
            leftColors.forEach(color => {
                leftPalette.appendChild(createColorSwatch(color));
            });

            rightColors.forEach(color => {
                rightPalette.appendChild(createColorSwatch(color));
            });

            leftColors2.forEach(color => {
                leftPalette2.appendChild(createColorSwatch(color));
            });

            rightColors2.forEach(color => {
                rightPalette2.appendChild(createColorSwatch(color));
            });
        }

        // Update current color if it's not in the new palette
        if (!currentPalette.includes(currentColor) && !isEraser) {
            currentColor = currentPalette[0];
            colorPicker.value = currentColor;
        }
    }

    // Create color swatches for both palettes
    function createColorSwatch(color) {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            // Update selected state
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            
            // Update color picker value and current color
            colorPicker.value = color;
            currentColor = color;
            
            // Switch to pen tool when selecting a color
           // switchTool('pen');
            
            // Update hover color
            updateHoverColor();
        });
        return swatch;
    }

    // Initialize the first palette
    updateColorSwatches();

    // Update the palette selector event handler
    paletteSelector.addEventListener('change', (e) => {
        // Store the new palette
        const newPaletteName = e.target.value;
        const newPalette = palettes[newPaletteName];
        
        // Push current state to undo stack before changing
        pushState();
        
        // Update current palette
        currentPalette = newPalette;
        
        // Recolor all pixels to closest colors in new palette
        const pixels = document.querySelectorAll('.pixel');
        pixels.forEach(pixel => {
            const currentColor = pixel.style.backgroundColor;
            if (currentColor && currentColor !== 'transparent') {
                // Convert RGB to hex if needed
                const hexColor = currentColor.startsWith('rgb') ? rgbToHex(currentColor) : currentColor;
                const rgb = hexToRgb(hexColor);
                if (rgb) {
                    // Find closest color in new palette
                    const closestColor = findClosestColor(rgb.r, rgb.g, rgb.b);
                    pixel.style.backgroundColor = closestColor;
                }
            }
        });
        
        // Update color swatches
        updateColorSwatches();
        
        // Update preview
        updateMiniPreview();
        
        // Show/hide MakeCode export button based on palette selection
        exportMakeCodeBtn.style.display = newPaletteName === 'makecode' ? 'inline-block' : 'none';
        
        // Save the changes
        saveToLocalStorage();
        
        // Show notification
        showNotification(`Palette changed to ${newPaletteName}`);
    });

    // Make sure the button visibility is set correctly on initial load
    exportMakeCodeBtn.style.display = paletteSelector.value === 'makecode' ? 'inline-block' : 'none';

    // Function to update mini preview
    function updateMiniPreview() {
        const pixels = document.querySelectorAll('.pixel');
        const previewPixels = document.querySelectorAll('.mini-preview-pixel');
        pixels.forEach((pixel, index) => {
            previewPixels[index].style.backgroundColor = pixel.style.backgroundColor;
        });
    }

    // Add mousemove handler for picker preview
    pixelGrid.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (target.classList.contains('pixel')) {
            // Calculate pixel coordinates based on currentResolution
            const pixels = Array.from(pixelGrid.children);
            const index = pixels.indexOf(target);
            const x = index % currentResolution;
            const y = Math.floor(index / currentResolution);
            coordinatesDisplay.textContent = `${x},${y}`;
        }
        if (isDrawing && e.buttons === 1) {  // Only if drawing AND left button is pressed
            draw(e);
        }
        else if (isEraser && e.buttons === 1) {
            let target;
            if (e.type === 'mousemove') {
                if (e.buttons !== 1) {  // Check if left mouse button is not pressed
                    isDrawing = false;
                    return;
                }
                target = document.elementFromPoint(e.clientX, e.clientY);
            } else {
                target = e.target;
            }
            target.style.backgroundColor = isEraser ? 'transparent' : currentColor;
            updateMiniPreview();
           
        }
        if (isPickerActive) {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (target && target.classList.contains('pixel')) {
                const hoverColor = target.style.backgroundColor;
                if (hoverColor && hoverColor !== 'transparent') {
                    const root = document.documentElement;
                    root.style.setProperty('--hover-color', hoverColor);
                }
            }
        }
       
    });

    // Reset coordinates when mouse leaves the grid
    pixelGrid.addEventListener('mouseleave', () => {
        coordinatesDisplay.textContent = '0,0';
        isDrawing = false;
    });

    // Tool functions
    const tools = {
        pen: {
            activate: () => {
                isEraser = false;
                isFloodFill = false;
                isPickerActive = false;
                updateButtonStates('pen');
            },
            use: (target) => {
                if (!target || !target.classList.contains('pixel')) return;
                target.style.backgroundColor = currentColor;
                updateMiniPreview();
            }
        },
        eraser: {
            activate: () => {
                isEraser = true;
                isFloodFill = false;
                isPickerActive = false;
                updateButtonStates('eraser');
            },
            use: (target) => {
                if (!target || !target.classList.contains('pixel')) return;
                target.style.backgroundColor = 'transparent';
                updateMiniPreview();
            }
        },
        picker: {
            activate: () => {
                previousToolState = {
                    isEraser,
                    penColor: currentColor
                };
                isPickerActive = true;
                isEraser = false;
                isFloodFill = false;
                updateButtonStates('picker');
            },
            use: (target) => {
                if (!target || !target.classList.contains('pixel')) return;
                const pickedColor = target.style.backgroundColor;
                if (pickedColor && pickedColor !== 'transparent') {
                    currentColor = pickedColor.startsWith('rgb') ? 
                        rgbToHex(pickedColor) : pickedColor;
                    colorPicker.value = currentColor;
                    switchTool(previousToolState.isEraser ? 'eraser' : 'pen');
                }
            }
        },
        fill: {
            activate: () => {
                isFloodFill = true;
                isEraser = false;
                isPickerActive = false;
                updateButtonStates('fill');
            },
            use: (target) => {
                if (!target || !target.classList.contains('pixel')) return;
                
                const pixels = Array.from(document.querySelectorAll('.pixel'));
                const index = pixels.indexOf(target);
                const x = index % currentResolution;
                const y = Math.floor(index / currentResolution);
                const targetColor = target.style.backgroundColor || 'transparent';
                
                pushState();
                floodFill(x, y, targetColor, currentColor);
                updateMiniPreview();
            }
        }
    };

    function updateButtonStates(activeTool) {
        const buttons = {
            pen: penBtn,
            eraser: eraserBtn,
            picker: colorPickerBtn,
            fill: floodFillBtn
        };

        Object.entries(buttons).forEach(([tool, button]) => {
            if (button) {
                button.style.backgroundColor = tool === activeTool ? '#ff4444' : '#18b2e0';
            }
        });
        
        updateHoverColor();
    }

    function switchTool(tool) {
        if (tools[tool]) {
            currentTool = tool;
            tools[tool].activate();
        }
    }

    // Update draw function to use tool system
    function draw(e) {
        if (!isDrawing && e.type !== 'mousedown') return;
        
        const target = e.type === 'mousemove' ? 
            document.elementFromPoint(e.clientX, e.clientY) : 
            e.target;
        
        if (tools[currentTool]) {
            tools[currentTool].use(target);
        }
    }

    // Update mouse event handlers
    pixelGrid.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left click only
            isDrawing = true;
            draw(e);
        }
        e.preventDefault(); // Prevent other mouse actions
    });

    document.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // Prevent selection
    document.addEventListener('selectstart', e => e.preventDefault());

    // Update touch event handlers
    pixelGrid.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target && target.classList.contains('pixel')) {
            // Update coordinates display
            const pixels = Array.from(pixelGrid.children);
            const index = pixels.indexOf(target);
            const x = index % currentResolution;
            const y = Math.floor(index / currentResolution);
            coordinatesDisplay.textContent = `${x},${y}`;
            
            // Set drawing state
            isDrawing = true;
            
            if (currentTool === 'fill') {
                // Handle flood fill directly
                const targetColor = target.style.backgroundColor || 'transparent';
                pushState();
                floodFill(x, y, targetColor, currentColor);
                updateMiniPreview();
                saveToLocalStorage();
            } else {
                // For other tools, use the tools system directly
                tools[currentTool].use(target);
                if (currentTool === 'picker') {
                    isDrawing = false; // Stop drawing after picking color
                }
            }
        }
    });

    pixelGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (!isDrawing) return; // Don't draw if not in drawing state
        
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target && target.classList.contains('pixel')) {
            // Update coordinates
            const pixels = Array.from(pixelGrid.children);
            const index = pixels.indexOf(target);
            const x = index % currentResolution;
            const y = Math.floor(index / currentResolution);
            coordinatesDisplay.textContent = `${x},${y}`;
            
            // Don't handle flood fill or picker during move
            if (currentTool !== 'fill' && currentTool !== 'picker') {
                tools[currentTool].use(target);
            }
        }
    });

    pixelGrid.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDrawing = false;
        coordinatesDisplay.textContent = '0,0';
        
        // Push state for undo/redo if we were drawing
        if (!isUndoRedoOperation) {
            pushState();
        }
    });

    pixelGrid.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        isDrawing = false;
        coordinatesDisplay.textContent = '0,0';
    });

    pixelGrid.addEventListener('touchleave', (e) => {
        e.preventDefault();
        isDrawing = false;
        coordinatesDisplay.textContent = '0,0';
    });

    // Color picker
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        // Switch to pen tool when selecting a color
        switchTool('pen');
        // Remove selected state from color swatches
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        updateHoverColor();
    });

    // Update the eraser button logic
    penBtn.addEventListener('click', () => switchTool('pen'));

    eraserBtn.addEventListener('click', () => switchTool('eraser'));

    // Clear canvas
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any immediate action
        const modalOverlay = document.getElementById('modalOverlay');
        const clearModal = document.getElementById('clearModal');
        
        // Show the modal and overlay
        modalOverlay.style.display = 'block';
        clearModal.style.display = 'block';
    });

    // Import Image
    importBtn.addEventListener('click', () => {
        imageInput.click();
    });

    // Add this function for handling image imports
    function importImage(img) {
        // Create a temporary canvas to process the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentResolution;
        tempCanvas.height = currentResolution;
        const ctx = tempCanvas.getContext('2d');
        
        // Draw and resize the image to current resolution
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, currentResolution, currentResolution);
        
        // Get the pixel data
        const imageData = ctx.getImageData(0, 0, currentResolution, currentResolution);
        const pixels = imageData.data;
        
        // Process each pixel
        const gridPixels = document.querySelectorAll('.pixel');
        for (let i = 0; i < gridPixels.length; i++) {
            const r = pixels[i * 4];
            const g = pixels[i * 4 + 1];
            const b = pixels[i * 4 + 2];
            const a = pixels[i * 4 + 3];
            
            if (a < 128) {
                // For MakeCode palette, use the transparent color
                gridPixels[i].style.backgroundColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
            } else {
                // Find the closest color in our palette
                const color = findClosestColor(r, g, b);
                gridPixels[i].style.backgroundColor = color;
            }
        }
        updateMiniPreview();
        pushState(); // Add to undo history
        saveToLocalStorage(); // Save the changes
        showNotification('Image imported!');
    }

    // Update the image input handler
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Generate new random name before importing
                    const randomName = nameGenerator.generate();
                    const filenameDisplay = document.querySelector('.filename-display');
                    if (filenameDisplay) {
                        filenameDisplay.textContent = randomName;
                    }
                    importImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        // Reset the input
        e.target.value = '';
    });

    // Helper function to find the closest color in our palette
    function findClosestColor(r, g, b) {
        let minDistance = Infinity;
        let closestColor = currentPalette[0];
        
        for (const color of currentPalette) {
            // Skip transparent color in MakeCode palette
            if (color === '#00000000') continue;
            
            const rgb = hexToRgb(color);
            if (rgb) {  // Only process if we can parse the color
                const distance = colorDistance(r, g, b, rgb.r, rgb.g, rgb.b);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = color;
                }
            }
        }
        
        return closestColor;
    }

    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Helper function to calculate color distance (using weighted RGB)
    function colorDistance(r1, g1, b1, r2, g2, b2) {
        // Using weighted RGB distance for better human perception
        const rMean = (r1 + r2) / 2;
        const dr = r1 - r2;
        const dg = g1 - g2;
        const db = b1 - b2;
        const r = (2 + rMean / 256) * dr * dr;
        const g = 4 * dg * dg;
        const b = (2 + (255 - rMean) / 256) * db * db;
        return Math.sqrt(r + g + b);
    }

    function saveImage(scale = 10, format = 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentResolution * scale;
        canvas.height = currentResolution * scale;

        // Make canvas transparent for PNG, white for other formats
        if (format === 'png') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw pixels to canvas
        const pixels = document.querySelectorAll('.pixel');
        pixels.forEach((pixel, index) => {
            const x = (index % currentResolution) * scale;
            const y = Math.floor(index / currentResolution) * scale;
            const color = pixel.style.backgroundColor;
            if (color && color !== 'transparent') {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, scale, scale);
            }
        });
        return canvas;
    }

    // Function to download image
    function downloadImage(canvas, format) {
        const currentFilename = document.querySelector('.filename-display').textContent;
        const link = document.createElement('a');
        link.download = `${currentFilename}.${format}`;
        
        // Handle different formats
        if (format === 'jpg' || format === 'jpeg') {
            link.href = canvas.toDataURL('image/jpeg', 0.9);
        } else if (format === 'webp') {
            link.href = canvas.toDataURL('image/webp', 0.9);
        } else if (format === 'gif') {
            link.href = canvas.toDataURL('image/gif');
        } else if (format === 'bmp') {
            link.href = canvas.toDataURL('image/bmp');
        } else {
        link.href = canvas.toDataURL('image/png');
        }
        
        link.click();
        
        // Hide modal after download
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('saveModal').style.display = 'none';
    }

    // Add click handlers for each format button
    document.getElementById('savePNG').addEventListener('click', () => {
        const canvas = saveImage(10, 'png');
        downloadImage(canvas, 'png');
    });

    document.getElementById('saveJPG').addEventListener('click', () => {
        const canvas = saveImage(10, 'jpg');
        downloadImage(canvas, 'jpg');
    });

    // Add this function to update the filename display
    function updateFilenameDisplay(filename = 'Untitled') {
        const filenameDisplay = document.querySelector('.filename-display');
        if (filenameDisplay) {
            filenameDisplay.textContent = filename;
        }
    }

    // Update save button handler to use current filename
    saveBtn.addEventListener('click', () => {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('saveModal').style.display = 'block';
    });

    function getPixelGridData() {
        const pixels = document.querySelectorAll('.pixel');
        const grid = [];
        let row = [];
        
        pixels.forEach((pixel, index) => {
            let color = pixel.style.backgroundColor || 'transparent';
            let paletteIndex = 0; // Default to transparent
            
            if (color && color !== 'transparent') {
                // Convert rgb(r, g, b) to hex
                if (color.startsWith('rgb')) {
                    color = rgbToHex(color);
                }
                // Convert color to lowercase for comparison
                color = color.toLowerCase();
                
                // Find matching color in makecode palette
                paletteIndex = palettes.makecode.findIndex(c => c.toLowerCase() === color);
                if (paletteIndex === -1) {
                    // If no exact match, find the closest color
                    const rgb = hexToRgb(color);
                    if (rgb) {
                        paletteIndex = findClosestMakeCodeColor(rgb.r, rgb.g, rgb.b);
                    }
                }
            }
            
            row.push(paletteIndex);
            if (row.length === currentResolution) {  // Changed from hardcoded 16 to currentResolution
                grid.push([...row]);
                row = [];
            }
        });
        
        return grid;
    }

    function findClosestMakeCodeColor(r, g, b) {
        let minDistance = Infinity;
        let closestIndex = 0;
        
        palettes.makecode.forEach((color, index) => {
            if (color === '#00000000') return; // Skip transparent
            const rgb = hexToRgb(color);
            if (rgb) {
                const distance = colorDistance(r, g, b, rgb.r, rgb.g, rgb.b);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            }
        });
        
        return closestIndex;
    }

    function convertToMakeCodeFormat(grid) {
        let result = 'const mySprite = img`\n';  // Updated variable name to match MakeCode convention
        
        // Convert each row
        grid.forEach(row => {
            result += '    '; // 4 space indent
            result += row.map(value => value.toString(16)).join(' ');
            result += '\n';
        });
        
        result += '`;';
        return result;
    }

    // Update the exportMakeCodeBtn click handler
    exportMakeCodeBtn.addEventListener('click', () => {
        if (paletteSelector.value !== 'makecode') {
            showNotification('Please switch to MakeCode palette first', 3000);
            return;
        }
        
        const grid = getPixelGridData();
        const makeCodeFormat = convertToMakeCodeFormat(grid);
        
        // Copy to clipboard
        navigator.clipboard.writeText(makeCodeFormat).then(() => {
            // Show the existing modal
            document.getElementById('modalOverlay').style.display = 'block';
            document.getElementById('copyModal').style.display = 'block';
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                document.getElementById('modalOverlay').style.display = 'none';
                document.getElementById('copyModal').style.display = 'none';
            }, 2000);
        }).catch(err => {
            showNotification('Failed to copy to clipboard', 3000);
        });
    });

    function updateHoverColor() {
        const root = document.documentElement;
        root.style.setProperty('--hover-color', isEraser ? 'transparent' : currentColor);
    }

    // Initialize hover color
    updateHoverColor();

    // Update the color picker button click handler
    colorPickerBtn.addEventListener('click', () => switchTool('picker'));

    // Update the loadFromLocalStorage function to retrieve filename
    function loadFromLocalStorage() {
        try {
            // 1. Get and set the last selected resolution first, create grid
            const savedResolution = localStorage.getItem('pixelArtResolution');
            const resolution = savedResolution ? parseInt(savedResolution) : 16;
            
            // Update resolution selector and current resolution
            const resolutionSelector = document.getElementById('resolutionSelector');
            if (resolutionSelector) {
                resolutionSelector.value = resolution.toString();
            }
            currentResolution = resolution;
            
            // Create the grid at the correct size WITHOUT saving
            createGridWithoutSave(resolution);
            
            // 2. Load the last image data into the grid if it exists
            const savedData = localStorage.getItem('pixelArtData');
            if (savedData) {
                try {
                    const pixelData = JSON.parse(savedData);
                    const pixels = document.querySelectorAll('.pixel');
                    
                    // Apply the saved pixel data to the grid
                    pixels.forEach((pixel, index) => {
                        if (index < pixelData.length) {
                            pixel.style.backgroundColor = pixelData[index];
                        }
                    });
                    
                    // Load and set the saved filename
                    const savedFilename = localStorage.getItem('pixelArtFilename');
                    if (savedFilename) {
                        const filenameDisplay = document.querySelector('.filename-display');
                        if (filenameDisplay) {
                            filenameDisplay.textContent = savedFilename;
                        }
                    } else {
                        // If no filename saved, generate a new one
                        const randomName = nameGenerator.generate();
                        const filenameDisplay = document.querySelector('.filename-display');
                        if (filenameDisplay) {
                            filenameDisplay.textContent = randomName;
                        }
                    }
                    
                    // Update the preview
                    updateMiniPreview();
                    
                    // Initialize the undo stack with the loaded state
                    undoStack = [pixelData];
                    redoStack = [];
                    
                    showNotification('Previous work loaded!', 3000);
                } catch (error) {
                    console.error('Error parsing saved data:', error);
                    showNotification('Error loading previous work', 3000);
                }
            } else {
                // No saved data, generate new filename
                const randomName = nameGenerator.generate();
                const filenameDisplay = document.querySelector('.filename-display');
                if (filenameDisplay) {
                    filenameDisplay.textContent = randomName;
                }
            }
            
            // 3. Load the last selected palette and update swatches
            const savedPalette = localStorage.getItem('pixelArtPalette');
            if (savedPalette && paletteSelector) {
                paletteSelector.value = savedPalette;
                currentPalette = palettes[savedPalette];
                updateColorSwatches();
                
                // 4. Show/hide MakeCode export button based on palette
                if (exportMakeCodeBtn) {
                    exportMakeCodeBtn.style.display = savedPalette === 'makecode' ? 'inline-block' : 'none';
                }
            }
            
        } catch (error) {
            console.error('Error loading saved data:', error);
            showNotification('Error loading previous work', 3000);
            // Create default grid if loading fails
            createGridWithoutSave(16);
            // Generate new filename on error
            const randomName = nameGenerator.generate();
            const filenameDisplay = document.querySelector('.filename-display');
            if (filenameDisplay) {
                filenameDisplay.textContent = randomName;
            }
        }
    }

    // Add new function to create grid without saving
    function createGridWithoutSave(size) {
        const pixelGrid = document.getElementById('pixelGrid');
        const miniPreview = document.getElementById('miniPreview');
        
        // Clear existing grids
        pixelGrid.innerHTML = '';
        miniPreview.innerHTML = '';
        
        // Create new main grid
        for (let i = 0; i < size * size; i++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            // Set initial color to transparent (color index 0)
            pixel.style.backgroundColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
            pixelGrid.appendChild(pixel);
        }
        
        // Create new mini preview grid
        for (let i = 0; i < size * size; i++) {
            const pixel = document.createElement('div');
            pixel.classList.add('mini-preview-pixel');
            // Set initial color to transparent (color index 0)
            pixel.style.backgroundColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
            miniPreview.appendChild(pixel);
        }
        
        // Update grid CSS
        pixelGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        miniPreview.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        
        // Update state management
        currentResolution = size;
        
        // Update preview
        updateMiniPreview();
    }

    // Set up auto-save interval (60 seconds)
    setInterval(saveToLocalStorage, 60000);

    // Add event listener for page unload to save before closing
    window.addEventListener('beforeunload', saveToLocalStorage);

    // Call loadFromLocalStorage which will handle everything in the correct order
    loadFromLocalStorage();

    // Only initialize first state if there's no saved data
    if (!localStorage.getItem('pixelArtData')) {
        pushState();
    }

    // Add this function to capture the current state
    function captureState() {
        const pixels = document.querySelectorAll('.pixel');
        return Array.from(pixels).map(pixel => pixel.style.backgroundColor || 'transparent');
    }

    // Add this function to apply a state
    function applyState(state) {
        const pixels = document.querySelectorAll('.pixel');
        pixels.forEach((pixel, index) => {
            pixel.style.backgroundColor = state[index];
        });
        updateMiniPreview();
    }

    // Add this function to push state to history
    function pushState() {
        if (isUndoRedoOperation) return;
        
        const currentState = captureState();
        undoStack.push(currentState);
        
        // Limit stack size
        if (undoStack.length > MAX_HISTORY_SIZE) {
            undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        redoStack = [];
        
        // Save to localStorage after each state change
        saveToLocalStorage();
    }

    // Add undo function
    function undo() {
        if (undoStack.length === 0) return;
        
        isUndoRedoOperation = true;
        const currentState = captureState();
        redoStack.push(currentState);
        
        const previousState = undoStack.pop();
        applyState(previousState);
        isUndoRedoOperation = false;
        showNotification('Undo');
    }

    // Add redo function
    function redo() {
        if (redoStack.length === 0) return;
        
        isUndoRedoOperation = true;
        const currentState = captureState();
        undoStack.push(currentState);
        
        const nextState = redoStack.pop();
        applyState(nextState);
        isUndoRedoOperation = false;
        showNotification('Redo');
    }

    // Update the keyboard shortcut handler
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) { // metaKey for Mac support
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        } else if (e.key.toLowerCase() === 'p') {
            // Pen shortcut
            penBtn.click();
        } else if (e.key.toLowerCase() === 'e') {
            // Eraser shortcut
            eraserBtn.click();
        } else if (e.key.toLowerCase() === 'i') {
            // Color picker shortcut
            colorPickerBtn.click();
        } else if (e.key.toLowerCase() === 'f') {
            // Fill tool shortcut
            floodFillBtn.click();
        }
    });

    // Modify the draw function to track history
    const originalDraw = draw;
    function enhancedDraw(e) {
        const beforeState = captureState();
        originalDraw(e);
        
        // Only push state when drawing ends or for single clicks
        if (!isDrawing || e.type === 'mousedown') {
            const afterState = captureState();
            // Check if state actually changed
            if (JSON.stringify(beforeState) !== JSON.stringify(afterState)) {
                pushState();
            }
        }
    }
    draw = enhancedDraw;

    // Add history tracking to clear button
    const originalImageInput = imageInput.onchange;
    imageInput.onchange = (e) => {
        pushState(); // Save state before importing
        if (originalImageInput) {
            originalImageInput.call(this, e);
        }
    };

    // Add click handlers for undo/redo buttons
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // Add tooltips to all tools
    function addTooltips() {
        // Mini preview tooltip
        miniPreview.title = "Artwork Preview";
        
        // Main Tools tooltips
        penBtn.title = "Pen (P) - Draw with selected color";
        eraserBtn.title = "Eraser (E) - Erase pixels";
        colorPickerBtn.title = "Color Picker (I) - Pick a color from the canvas";
        floodFillBtn.title = "Fill Tool (F) - Fill connected areas";
        undoBtn.title = "Undo (Ctrl+Z) - Undo last action";
        redoBtn.title = "Redo (Ctrl+Y/Ctrl+Shift+Z) - Redo last undone action";
        
        // Color tools tooltips
        colorPicker.title = "Choose any color";
        paletteSelector.title = "Choose a color palette";
        
        // File operation tooltips
        saveBtn.title = "Save - Export as PNG";
        importBtn.title = "Import - Import an image";
        clearBtn.title = "Clear - Clear the canvas";
        exportMakeCodeBtn.title = "Export MakeCode - Export for MakeCode Arcade";
        
        // Gallery tooltips
        document.getElementById('openGallery').title = "Open Gallery - Browse saved artwork";
        document.getElementById('saveToGallery').title = "Save to Gallery - Save current artwork";
        
        // Other tools tooltips
        document.getElementById('paste').title = "Paste - Paste image from clipboard";
        document.getElementById('share').title = "Share - Create shareable URL";
        document.getElementById('logoBtn').title = "Visit Github Repository";
        
        // Resolution selector tooltip
        document.getElementById('resolutionSelector').title = "Change canvas resolution";
        
        // Coordinates display tooltip
        coordinatesDisplay.title = "Pixel Coordinates";
        
        // Gallery modal buttons
        document.getElementById('spritesheetBtn').title = "Create spritesheet from selected artwork";
        document.getElementById('deleteAllBtn').title = "Delete selected artwork";
        document.getElementById('closeGalleryModal').title = "Close gallery";
    }

    // Call this function after DOM content is loaded
    addTooltips();

    // Update logo button handler
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            window.open('https://github.com/Reality-Boffins/PixelMaker/', '_blank', 'noopener,noreferrer');
        });
    }

    // Update the flood fill function
    function floodFill(startX, startY, targetColor, replacementColor) {
        const pixels = Array.from(document.querySelectorAll('.pixel'));
        const width = currentResolution;
        const height = currentResolution;
        
        // Normalize colors immediately
        targetColor = normalizeColor(targetColor);
        replacementColor = normalizeColor(replacementColor);
        
        // Don't flood fill if colors are the same
        if (targetColor === replacementColor) return;
        
        // Helper functions
        function getIndex(x, y) {
            return y * width + x;
        }
        
        function isValid(x, y) {
            return x >= 0 && x < width && y >= 0 && y < height;
        }
        
        function getColor(x, y) {
            return normalizeColor(pixels[getIndex(x, y)].style.backgroundColor);
        }
        
        function setColor(x, y, color) {
            if (isValid(x, y)) {
                pixels[getIndex(x, y)].style.backgroundColor = color;
            }
        }
        
        function normalizeColor(color) {
            if (!color || color === '') return 'transparent';
            if (color === 'transparent') return color;
            
            // Convert RGB to hex
            if (color.startsWith('rgb')) {
                const values = color.match(/\d+/g);
                return '#' + values.map(x => 
                    parseInt(x).toString(16).padStart(2, '0')
                ).join('').toLowerCase();
            }
            return color.toLowerCase();
        }
        
        // Use a queue for breadth-first fill
        const queue = [[startX, startY]];
        const visited = new Set();
        
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const pos = `${x},${y}`;
            
            if (!isValid(x, y) || visited.has(pos)) continue;
            
            visited.add(pos);
            
            if (getColor(x, y) === targetColor) {
                setColor(x, y, replacementColor);
                
                // Add adjacent pixels (4-way connectivity)
                queue.push([x, y - 1]); // up
                queue.push([x + 1, y]); // right
                queue.push([x, y + 1]); // down
                queue.push([x - 1, y]); // left
            }
        }
        
        // Update the preview after fill completes
        updateMiniPreview();
    }

    // Update the resolution selector handler
    document.getElementById('resolutionSelector').addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        const currentSize = currentResolution;
        
        if (newSize && !isNaN(newSize)) {
            // Check if there's existing art
            const hasArt = Array.from(document.querySelectorAll('.pixel')).some(
                pixel => pixel.style.backgroundColor && pixel.style.backgroundColor !== 'transparent'
            );
            
            if (hasArt) {
                // Show resolution change modal
                document.getElementById('modalOverlay').style.display = 'block';
                document.getElementById('resolutionModal').style.display = 'block';
                
                // Store the new size for use in the Yes handler
                document.getElementById('resolutionModal').dataset.newSize = newSize;
                
                // Reset selector to current value until confirmed
                e.target.value = currentSize;
            } else {
                // No existing art, just change the resolution
                createGrid(newSize);
                currentResolution = newSize; // Update current resolution
                // Save the new resolution immediately
                localStorage.setItem('pixelArtResolution', newSize.toString());
                saveToLocalStorage(); // Save all state
                showNotification(`Resolution changed to ${newSize}x${newSize}`);
            }
        }
    });

    // Update the clear button handler
    document.getElementById('clearYes').addEventListener('click', function() {
        // Push current state to history before clearing
        pushState();
        
        // Clear the canvas by setting all pixels to transparent
        const pixels = document.querySelectorAll('.pixel');
        const transparentColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
        
        pixels.forEach(pixel => {
            pixel.style.backgroundColor = transparentColor;
        });
        
        // Update the preview
        updateMiniPreview();
        
        // Save the changes
        saveToLocalStorage();
        
        // Hide the modal and overlay
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('clearModal').style.display = 'none';
        
        // Generate new random name and update filename display
        const randomName = nameGenerator.generate();
        const filenameDisplay = document.querySelector('.filename-display');
        if (filenameDisplay) {
            filenameDisplay.textContent = randomName;
        }
        
        // Reset page title
        document.title = 'Pixel Maker - Version ' + APP_VERSION;
    });

    // Handle the No button click
    document.getElementById('clearNo').addEventListener('click', function() {
        // Just hide the modal and overlay
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('clearModal').style.display = 'none';
    });

    document.getElementById('resolutionYes').addEventListener('click', () => {
        const resolutionModal = document.getElementById('resolutionModal');
        const newSize = parseInt(resolutionModal.dataset.newSize);
        
        // Change resolution
        document.getElementById('resolutionSelector').value = newSize;
        createGrid(newSize);
        currentResolution = newSize; // Update current resolution
        // Save the new resolution immediately
        localStorage.setItem('pixelArtResolution', newSize.toString());
        saveToLocalStorage(); // Save all state
        showNotification(`Resolution changed to ${newSize}x${newSize}`);
        
        // Hide modal
        document.getElementById('modalOverlay').style.display = 'none';
        resolutionModal.style.display = 'none';
        resetPageTitle();
    });

    document.getElementById('resolutionNo').addEventListener('click', () => {
        // Just hide modal
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('resolutionModal').style.display = 'none';
    });

    // Add overlay click handler to close all modals
    document.getElementById('modalOverlay').addEventListener('click', () => {
        // Hide all modals
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('clearModal').style.display = 'none';
        document.getElementById('resolutionModal').style.display = 'none';
        document.getElementById('copyModal').style.display = 'none';
    });

    function createGrid(size) {
        const pixelGrid = document.getElementById('pixelGrid');
        const miniPreview = document.getElementById('miniPreview');
        
        // Clear existing grids
        pixelGrid.innerHTML = '';
        miniPreview.innerHTML = '';
        
        // Create new main grid
        for (let i = 0; i < size * size; i++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            // Set initial color to transparent (color index 0)
            pixel.style.backgroundColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
            pixelGrid.appendChild(pixel);
        }
        
        // Create new mini preview grid
        for (let i = 0; i < size * size; i++) {
            const pixel = document.createElement('div');
            pixel.classList.add('mini-preview-pixel');
            // Set initial color to transparent (color index 0)
            pixel.style.backgroundColor = currentPalette === palettes.makecode ? '#00000000' : 'transparent';
            miniPreview.appendChild(pixel);
        }
        
        // Update grid CSS
        pixelGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        miniPreview.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        
        // Update state management
        currentResolution = size;
        
        // Save the resolution immediately
        localStorage.setItem('pixelArtResolution', size.toString());
        saveToLocalStorage();
        
        // Update preview
        updateMiniPreview();
    }

    // Create initial grid
    // createGrid(16);

    // Update the paste functionality
    const pasteBtn = document.getElementById('paste');
    if (pasteBtn) {
        pasteBtn.addEventListener('click', async () => {
            try {
                const clipboardItems = await navigator.clipboard.read();
                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        if (type.startsWith('image/')) {
                            const blob = await clipboardItem.getType(type);
                            const img = new Image();
                            img.onload = () => {
                                // Generate new random name before importing
                                const randomName = nameGenerator.generate();
                                const filenameDisplay = document.querySelector('.filename-display');
                                if (filenameDisplay) {
                                    filenameDisplay.textContent = randomName;
                                }
                                importImage(img);
                            };
                            img.src = URL.createObjectURL(blob);
                            return;
                        }
                    }
                }
                showNotification('No image found in clipboard');
            } catch (err) {
                console.error('Paste error:', err);
                showNotification('Unable to paste image. Try importing instead.');
            }
        });
    }

    // Improve modal handling
    function showModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById(modalId).style.display = 'block';
    }

    function hideModals() {
        const modals = [
            'modalOverlay', 
            'clearModal', 
            'resolutionModal', 
            'copyModal', 
            'galleryModal',
            'deleteConfirmModal',
            'deleteAllConfirmModal',
            'saveModal'  // Add saveModal to the list
        ];
        modals.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    // Update modal click handlers
    document.getElementById('modalOverlay').addEventListener('click', hideModals);

    function rgbToHex(rgb) {
        const values = rgb.match(/\d+/g);
        return '#' + values.map(x => 
            parseInt(x).toString(16).padStart(2, '0')
        ).join('');
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Add flood fill button click handler
    floodFillBtn.addEventListener('click', () => switchTool('fill'));

    // Add these event listeners and functions
    document.getElementById('share').addEventListener('click', shareArtwork);
    document.getElementById('copyShareUrl').addEventListener('click', copyShareUrl);

    function getPixelData() {
        const pixels = document.querySelectorAll('.pixel');
        return Array.from(pixels).map(pixel => pixel.style.backgroundColor || 'transparent');
    }

    function loadPixelData(pixelData) {
        const pixels = document.querySelectorAll('.pixel');
        pixels.forEach((pixel, index) => {
            if (index < pixelData.length) {
                pixel.style.backgroundColor = pixelData[index];
            }
        });
        updateMiniPreview();
    }

    // Add function to convert color to palette index
    function getColorIndex(color, palette) {
        if (!color || color === 'transparent') return -1;
        
        // Convert RGB to hex if needed
        const hexColor = color.startsWith('rgb') ? rgbToHex(color) : color;
        
        // Find exact match first
        const index = palette.findIndex(c => c.toLowerCase() === hexColor.toLowerCase());
        if (index !== -1) return index;
        
        // If no exact match, find closest color
        const rgb = hexToRgb(hexColor);
        if (!rgb) return -1;
        
        return findClosestColorIndex(rgb.r, rgb.g, rgb.b, palette);
    }

    // Add function to find closest color index
    function findClosestColorIndex(r, g, b, palette) {
        let minDistance = Infinity;
        let closestIndex = 0;
        
        palette.forEach((color, index) => {
            const rgb = hexToRgb(color);
            if (rgb) {
                const distance = colorDistance(r, g, b, rgb.r, rgb.g, rgb.b);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            }
        });
        
        return closestIndex;
    }

    // Update shareArtwork function to include filename
    function shareArtwork() {
        const pixelData = getPixelData();
        const currentPalette = document.getElementById('paletteSelector').value;
        const palette = palettes[currentPalette];
        const currentFilename = document.querySelector('.filename-display').textContent;
        
        // Convert colors to palette indices
        const indexData = pixelData.map(color => getColorIndex(color, palette));
        
        // Compress runs of identical indices
        let compressed = [];
        let count = 1;
        let current = indexData[0];
        
        for (let i = 1; i <= indexData.length; i++) {
            if (i < indexData.length && indexData[i] === current) {
                count++;
            } else {
                // Store as [count, index]
                compressed.push([count, current]);
                if (i < indexData.length) {
                    current = indexData[i];
                    count = 1;
                }
            }
        }
        
        // Create the compressed data string with filename
        const artworkData = btoa(JSON.stringify({
            p: compressed,         // compressed pixel indices
            l: currentPalette,    // palette name
            r: currentResolution, // resolution
            f: currentFilename   // filename
        }));
        
        // Use electron dialog to save file
        const { dialog } = require('electron').remote;
        const fs = require('fs');
        
        dialog.showSaveDialog({
            title: 'Save Shared Artwork',
            defaultPath: `${currentFilename}.pxm`,
            filters: [
                { name: 'Pixel Maker File', extensions: ['pxm'] }
            ]
        }).then(result => {
            if (!result.canceled) {
                fs.writeFileSync(result.filePath, artworkData);
                showNotification('Artwork saved for sharing');
            }
        });
    }

    function copyShareUrl() {
        const shareUrlInput = document.getElementById('shareUrl');
        shareUrlInput.select();
        document.execCommand('copy');
        
        // Optional: Show feedback that URL was copied
        const copyButton = document.getElementById('copyShareUrl');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    }

    // Update window load handler to handle filename in shared URL
    window.addEventListener('load', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const artData = urlParams.get('art');
        
        if (artData) {
            try {
                const decodedData = JSON.parse(atob(artData));
                
                // Set resolution
                const resolution = decodedData.r;
                if (resolution) {
                    currentResolution = resolution;
                    document.getElementById('resolutionSelector').value = resolution.toString();
                    createGridWithoutSave(resolution);
                }
                
                // Set palette
                const paletteName = decodedData.l;
                document.getElementById('paletteSelector').value = paletteName;
                currentPalette = palettes[paletteName];
                updateColorSwatches();
                
                // Set filename (if exists in shared data, otherwise generate new)
                const sharedFilename = decodedData.f;
                const filenameDisplay = document.querySelector('.filename-display');
                if (filenameDisplay) {
                    filenameDisplay.textContent = sharedFilename || nameGenerator.generate();
                }
                
                // Decompress and convert indices back to colors
                const compressed = decodedData.p;
                let pixels = [];
                
                compressed.forEach(([count, index]) => {
                    const color = index === -1 ? 'transparent' : currentPalette[index];
                    pixels = pixels.concat(Array(count).fill(color));
                });
                
                loadPixelData(pixels);
                showNotification('Shared artwork loaded!', 2000);
                
                // Save the loaded state
                saveToLocalStorage();
                
            } catch (error) {
                console.error('Failed to load shared artwork:', error);
                showNotification('Failed to load shared artwork', 3000);
                
                // Generate new filename on error
                const randomName = nameGenerator.generate();
                const filenameDisplay = document.querySelector('.filename-display');
                if (filenameDisplay) {
                    filenameDisplay.textContent = randomName;
                }
            }
        }
    });

    // Add this to your existing modal handling code
    function hideModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById(modalId).style.display = 'none';
    }

    // Add event listener for the close button
    document.querySelector('#shareModal .modal-close').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to overlay
        hideModal('shareModal');
    });

    // Update saveToGallery function
    function saveToGallery() {
        const canvas = saveImage(10);
        const timestamp = new Date().toISOString();
        const currentFilename = document.querySelector('.filename-display').textContent;
        
        // Get existing gallery items
        let galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        
        // Find existing item with same name
        const existingIndex = galleryItems.findIndex(item => item.name === currentFilename);
        
        // Create new gallery item
        const galleryItem = {
            id: existingIndex >= 0 ? galleryItems[existingIndex].id : Math.floor(Date.now()), // Keep existing ID if overwriting
            name: currentFilename,
            timestamp: timestamp,
            imageData: canvas.toDataURL('image/png'),
            resolution: currentResolution,
            palette: paletteSelector.value,
            pixels: getPixelData()
        };

        if (existingIndex >= 0) {
            // Overwrite existing item
            galleryItems[existingIndex] = galleryItem;
            showNotification(`Updated "${currentFilename}" in gallery`);
        } else {
        // Add new item
        galleryItems.push(galleryItem);
            showNotification(`Saved "${currentFilename}" to gallery`);
        }
        
        // Save back to localStorage
        localStorage.setItem('pixelGallery', JSON.stringify(galleryItems));
        
        // Reload gallery if it's open
        if (document.getElementById('galleryModal').style.display === 'flex') {
            loadGallery();
        }
    }

    function loadGallery() {
        const galleryModal = document.getElementById('galleryModal');
        const galleryGrid = document.getElementById('galleryGrid');
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        // Reset select all button text
        selectAllBtn.textContent = 'Select All';
        
        // Clear existing items
        galleryGrid.innerHTML = '';
        
        // Get gallery items
        const galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        
        if (galleryItems.length === 0) {
            galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ccc; padding: 20px;">No saved artwork yet</p>';
        } else {
            // Create gallery items
            galleryItems.forEach(item => {
                const galleryItem = document.createElement('div');
                galleryItem.style.cssText = `
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    padding-bottom: 5px;
                    border: 2px solid #444;
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    background-color: #222;
                    transition: transform 0.2s, border-color 0.2s;
                    width: 100%;  // This will make it fill the larger grid space
                `;
                
                // Create thumbnail container
                const thumbnailContainer = document.createElement('div');
                thumbnailContainer.style.cssText = `
                    width: 100%;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #222;
                `;
                
                // Create thumbnail
                const thumbnail = document.createElement('img');
                thumbnail.src = item.imageData;
                thumbnail.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    image-rendering: pixelated;
                `;
                
                // Create filename container with checkbox
                const filenameContainer = document.createElement('div');
                filenameContainer.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    width: 100%;
                    padding: 0 5px;
                    box-sizing: border-box;
                `;
                
                // Create checkbox with integer ID
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.itemId = Math.floor(item.id).toString(); // Ensure integer ID
                checkbox.style.cssText = `
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: #ff4444;
                `;
                
                // Create filename label
                const filenameLabel = document.createElement('div');
                filenameLabel.textContent = item.name || 'Untitled';
                filenameLabel.style.cssText = `
                    color: #fff;
                    font-size: 0.8rem;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                `;
                
                // Add hover effects
                galleryItem.addEventListener('mouseenter', () => {
                    galleryItem.style.transform = 'scale(1.02)';
                    galleryItem.style.borderColor = '#18b2e0';
                });
                
                galleryItem.addEventListener('mouseleave', () => {
                    galleryItem.style.transform = 'scale(1)';
                    galleryItem.style.borderColor = '#444';
                });
                
                // Handle click to load artwork
                galleryItem.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        // Set resolution
                        document.getElementById('resolutionSelector').value = item.resolution;
                        currentResolution = item.resolution;
                        createGridWithoutSave(item.resolution);
                        
                        // Set palette
                        paletteSelector.value = item.palette;
                        currentPalette = palettes[item.palette];
                        updateColorSwatches();
                        
                        // Load pixels
                        loadPixelData(item.pixels);
                        
                        // Set filename
                        const filenameDisplay = document.querySelector('.filename-display');
                        if (filenameDisplay) {
                            filenameDisplay.textContent = item.name;
                        }
                        
                        // Hide modal
                        hideModal('galleryModal');
                        
                        // Add to undo stack
                        pushState();
                        
                        showNotification('Artwork loaded from gallery');
                    }
                });
                
                // Assemble the components
                thumbnailContainer.appendChild(thumbnail);
                filenameContainer.appendChild(checkbox);
                filenameContainer.appendChild(filenameLabel);
                galleryItem.appendChild(thumbnailContainer);
                galleryItem.appendChild(filenameContainer);
                galleryGrid.appendChild(galleryItem);
            });
        }

        // Update the gallery grid style in the galleryGrid element
        document.getElementById('galleryGrid').style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));  // Changed from 120px to 150px
            gap: 15px;
            margin: 0;
            padding: 10px;
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            background-color: #333;
            border-radius: 4px;
            align-content: start;
            max-height: calc(80vh - 100px);
        `;
    }

    // Add these event listeners after other event listeners
    document.getElementById('saveToGallery').addEventListener('click', saveToGallery);

    document.getElementById('openGallery').addEventListener('click', () => {
        loadGallery(); // Load gallery contents
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('galleryModal').style.display = 'flex'; // Use flex display
    });

    document.getElementById('closeGalleryModal').addEventListener('click', () => {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('galleryModal').style.display = 'none';
    });

    // Add delete confirmation handlers
    document.getElementById('deleteConfirmYes').addEventListener('click', () => {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        const galleryModal = document.getElementById('galleryModal');
        const itemId = parseInt(deleteConfirmModal.dataset.itemId);
        
        // Get gallery items
        const galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        const updatedItems = galleryItems.filter(i => i.id !== itemId);
        
        // Save updated items
        localStorage.setItem('pixelGallery', JSON.stringify(updatedItems));
        
        // Hide delete confirmation modal
        deleteConfirmModal.style.display = 'none';
        
        // Show gallery modal (in case it was hidden)
        galleryModal.style.display = 'flex';
        
        // Reload gallery
        loadGallery();
        
        showNotification('Artwork deleted from gallery');
    });

    document.getElementById('deleteConfirmNo').addEventListener('click', () => {
        document.getElementById('deleteConfirmModal').style.display = 'none';
    });

    // Add these event listeners after other event listeners
    document.getElementById('deleteAllBtn').addEventListener('click', () => {
        const selectedItems = document.querySelectorAll('#galleryGrid input[type="checkbox"]:checked');
        
        if (selectedItems.length === 0) {
            showNotification('No items selected');
            return;
        }
        
        // Show delete confirmation modal
        document.getElementById('deleteAllConfirmModal').style.display = 'block';
    });

    document.getElementById('deleteAllConfirmYes').addEventListener('click', () => {
        const selectedItems = document.querySelectorAll('#galleryGrid input[type="checkbox"]:checked');
        const selectedIds = Array.from(selectedItems).map(checkbox => parseInt(checkbox.dataset.itemId)); // Already converting to integer
        
        if (selectedIds.length === 0) {
            showNotification('No items selected');
            return;
        }
        
        // Get gallery items
        let galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        
        // Ensure all IDs are integers for comparison
        galleryItems = galleryItems.map(item => ({
            ...item,
            id: Math.floor(item.id)
        }));
        
        // Filter out selected items
        galleryItems = galleryItems.filter(item => !selectedIds.includes(item.id));
        
        // Save updated gallery
        localStorage.setItem('pixelGallery', JSON.stringify(galleryItems));
        
        // Hide delete confirmation modal
        document.getElementById('deleteAllConfirmModal').style.display = 'none';
        
        // Show gallery modal
        document.getElementById('galleryModal').style.display = 'flex';
        
        // Reload gallery
        loadGallery();
        
        // Reset select all button text
        document.getElementById('selectAllBtn').textContent = 'Select All';
        
        showNotification(`${selectedIds.length} item(s) deleted from gallery`);
    });

    document.getElementById('deleteAllConfirmNo').addEventListener('click', () => {
        // Hide delete all confirmation modal
        document.getElementById('deleteAllConfirmModal').style.display = 'none';
    });

    // Update hideModals function to include the new modal
    function hideModals() {
        const modals = [
            'modalOverlay', 
            'clearModal', 
            'resolutionModal', 
            'copyModal', 
            'galleryModal',
            'deleteConfirmModal',
            'deleteAllConfirmModal',
            'saveModal'  // Add saveModal to the list
        ];
        modals.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    // Hide gallery modal on initial load
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.style.display = 'none';
    }

    // Add this function to create and download spritesheet
    function createSpritesheet() {
        const selectedItems = document.querySelectorAll('#galleryGrid input[type="checkbox"]:checked');
        
        if (selectedItems.length === 0) {
            showNotification('No items selected');
            return;
        }
        
        // Get gallery items
        const galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        const selectedIds = Array.from(selectedItems).map(checkbox => parseInt(checkbox.dataset.itemId));
        const selectedArtwork = galleryItems.filter(item => selectedIds.includes(item.id));
        
        // Calculate grid dimensions
        const numItems = selectedArtwork.length;
        const gridSize = Math.ceil(Math.sqrt(numItems)); // Make a square grid
        
        // Create canvas for spritesheet
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (each sprite is 160x160 - scaled up from 16x16)
        const spriteSize = 160; // 16 * 10 (scale)
        canvas.width = gridSize * spriteSize;
        canvas.height = gridSize * spriteSize;
        
        // Make canvas transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Load all images and draw them to the spritesheet
        let loadedImages = 0;
        selectedArtwork.forEach((item, index) => {
            const img = new Image();
            img.onload = () => {
                // Calculate position in grid
                const x = (index % gridSize) * spriteSize;
                const y = Math.floor(index / gridSize) * spriteSize;
                
                // Draw image
                ctx.drawImage(img, x, y, spriteSize, spriteSize);
                
                loadedImages++;
                
                // When all images are loaded, download the spritesheet
                if (loadedImages === numItems) {
                    const link = document.createElement('a');
                    const currentFilename = document.querySelector('.filename-display').textContent;
                    link.download = `${currentFilename}-spritesheet.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showNotification(`Spritesheet saved as "${currentFilename}"`);
                }
            };
            img.src = item.imageData;
        });
    }

    // Add event listener for the spritesheet button
    document.getElementById('spritesheetBtn').addEventListener('click', createSpritesheet);

    // Only update filename in these specific cases
    function resetPageTitle() {
        document.title = 'Pixel Maker - Version ' + APP_VERSION;
        const filenameDisplay = document.querySelector('.filename-display');
        if (filenameDisplay) {
            filenameDisplay.textContent = 'Untitled';
        }
    }

    // Add select all functionality
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#galleryGrid input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        
        // If all are checked, uncheck all. Otherwise, check all
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });
        
        // Update button text
        const selectAllBtn = document.getElementById('selectAllBtn');
        selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
    });

    // Add this after other event listeners
    document.getElementById('duplicateSelectedBtn').addEventListener('click', () => {
        const selectedItems = document.querySelectorAll('#galleryGrid input[type="checkbox"]:checked');
        
        if (selectedItems.length === 0) {
            showNotification('No items selected');
            return;
        }
        
        // Get gallery items
        let galleryItems = JSON.parse(localStorage.getItem('pixelGallery') || '[]');
        const selectedIds = Array.from(selectedItems).map(checkbox => parseInt(checkbox.dataset.itemId));
        
        // Find selected items and create duplicates
        const itemsToDuplicate = galleryItems.filter(item => selectedIds.includes(item.id));
        const duplicates = itemsToDuplicate.map(item => {
            // Generate new random name using nameGenerator
            const newName = nameGenerator.generate();
            
            return {
                ...item,
                id: Math.floor(Date.now() + Math.random() * 1000), // Ensure unique integer ID
                name: newName,
                timestamp: new Date().toISOString()
            };
        });
        
        // Add duplicates to gallery
        galleryItems = [...galleryItems, ...duplicates];
        
        // Save updated gallery
        localStorage.setItem('pixelGallery', JSON.stringify(galleryItems));
        
        // Reload gallery display
        loadGallery();
        
        showNotification(`Duplicated ${duplicates.length} item(s)`);
    });

    // Add close handler for save modal
    document.getElementById('closeSaveModal').addEventListener('click', () => {
        hideModals(); // Use the existing hideModals function
    });

    // Function to convert image to 1-bit monochrome format
    function convertTo1Bit(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const bytes = [];
        
        for (let i = 0; i < data.length; i += 4) {
            // Calculate brightness (simple average)
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // Use threshold of 128 for binary decision
            bytes.push(brightness >= 128 ? 1 : 0);
        }
        
        return bytes;
    }

    // Function to generate Arduino code
    function generateArduinoCode(bytes, width, height) {
        const currentFilename = document.querySelector('.filename-display').textContent;
        const variableName = currentFilename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        let code = `// Generated by Pixel Maker\n`;
        code += `const uint8_t ${variableName}[] PROGMEM = {\n`;
        code += `  ${width}, ${height},  // Width, Height\n  `;
        
        // Convert bits to bytes
        for (let i = 0; i < bytes.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                if (i + j < bytes.length) {
                    byte |= (bytes[i + j] << (7 - j));
                }
            }
            code += `0x${byte.toString(16).padStart(2, '0')}, `;
            if ((i + 8) % 64 === 0) code += '\n  ';
        }
        
        code += '\n};';
        return code;
    }

    // Function to generate Adafruit GFX format
    function generateAdafruitGFX(bytes, width, height) {
        const currentFilename = document.querySelector('.filename-display').textContent;
        const variableName = currentFilename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        let code = `// Generated by Pixel Maker for Adafruit GFX\n`;
        code += `static const uint8_t ${variableName}Bitmaps[] PROGMEM = {\n`;
        code += generateArduinoCode(bytes, width, height);
        code += `\n\nstatic const GFXbitmapFont ${variableName} = {\n`;
        code += `  ${variableName}Bitmaps,\n`;
        code += `  ${width}, ${height},  // Width, Height\n`;
        code += `  1  // Bytes per column\n};`;
        return code;
    }

    // Add click handlers for new export formats
    document.getElementById('saveArduino').addEventListener('click', () => {
        const canvas = saveImage(1); // Use 1:1 scale for embedded formats
        const bytes = convertTo1Bit(canvas);
        const code = generateArduinoCode(bytes, currentResolution, currentResolution);
        
        // Create and trigger download
        const blob = new Blob([code], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${document.querySelector('.filename-display').textContent}.ino`;
        link.click();
        hideModals();
    });

    document.getElementById('saveAdafruit').addEventListener('click', () => {
        const canvas = saveImage(1);
        const bytes = convertTo1Bit(canvas);
        const code = generateAdafruitGFX(bytes, currentResolution, currentResolution);
        
        const blob = new Blob([code], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${document.querySelector('.filename-display').textContent}_gfx.h`;
        link.click();
        hideModals();
    });

    // Add click handler for ICO export (also inside DOMContentLoaded)
    document.getElementById('saveICO').addEventListener('click', () => {
        // Create canvas at 32x32 resolution
        const canvas = saveImage(1); 
        
        // Convert to ICO format using existing function
        const icoData = canvasToICO(canvas);
        
        // Create and trigger download
        const blob = new Blob([icoData], { type: 'image/x-icon' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const currentFilename = document.querySelector('.filename-display').textContent;
        link.download = `${currentFilename}.ico`;
        link.click();
        
        // Hide modal after download
        hideModals();
    });


    document.getElementById('saveBinary').addEventListener('click', () => {
        const canvas = saveImage(1);
        const bytes = convertTo1Bit(canvas);
        
        // Convert to binary format
        const buffer = new Uint8Array(Math.ceil(bytes.length / 8));
        for (let i = 0; i < bytes.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                if (i + j < bytes.length) {
                    byte |= (bytes[i + j] << (7 - j));
                }
            }
            buffer[i / 8] = byte;
        }
        
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${document.querySelector('.filename-display').textContent}.bin`;
        link.click();
        hideModals();
    });

    // Add this function to your DOMContentLoaded event listener
    function disableDragging() {
        // Disable dragging on all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.setAttribute('draggable', 'false');
            
            // Also disable dragging on button contents (like images)
            const images = button.getElementsByTagName('img');
            Array.from(images).forEach(img => {
                img.setAttribute('draggable', 'false');
            });
        });
    }

    // Call this function when the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // ... existing DOMContentLoaded code ...
        disableDragging();
    });

    // Also add this CSS to prevent any default drag behaviors
});

// Add this function to convert canvas to ICO format
function canvasToICO(canvas) {
    // ICO header (6 bytes)
    const header = new Uint8Array([
        0, 0,             // Reserved (0)
        1, 0,             // Image type (1 = ICO)
        1, 0              // Number of images (1)
    ]);

    // ICO directory entry (16 bytes)
    const size = canvas.width;
    const directory = new Uint8Array([
        size,            // Width
        size,            // Height
        0,               // Color palette size (0 = no palette)
        0,               // Reserved (0)
        1, 0,            // Color planes (1)
        32, 0,           // Bits per pixel (32)
        // Image size (will be filled later)
        0, 0, 0, 0,
        // Image offset (22 = header + directory size)
        22, 0, 0, 0
    ]);

    // Get image data
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, size, size);
    const pixels = imageData.data;

    // Create BITMAPINFOHEADER (40 bytes)
    const infoHeader = new Uint8Array([
        40, 0, 0, 0,     // Header size (40 bytes)
        size, 0, 0, 0,   // Width
        size * 2, 0, 0, 0, // Height (*2 because ICO format needs height doubled)
        1, 0,            // Planes (1)
        32, 0,           // Bits per pixel (32)
        0, 0, 0, 0,      // Compression (0 = none)
        0, 0, 0, 0,      // Image size (0 for uncompressed)
        0, 0, 0, 0,      // X pixels per meter (unused)
        0, 0, 0, 0,      // Y pixels per meter (unused)
        0, 0, 0, 0,      // Colors in color table (0 = none)
        0, 0, 0, 0       // Important color count (0 = all)
    ]);

    // Create pixel data array (BGRA format)
    const pixelData = new Uint8Array(size * size * 4);
    for (let i = 0; i < pixels.length; i += 4) {
        const pos = i;
        pixelData[pos] = pixels[i + 2];     // Blue
        pixelData[pos + 1] = pixels[i + 1];  // Green
        pixelData[pos + 2] = pixels[i];      // Red
        pixelData[pos + 3] = pixels[i + 3];  // Alpha
    }

    // Combine all parts
    const totalSize = header.length + directory.length + infoHeader.length + pixelData.length;
    const ico = new Uint8Array(totalSize);
    
    // Update image size in directory
    const imageSize = infoHeader.length + pixelData.length;
    directory[8] = imageSize & 0xFF;
    directory[9] = (imageSize >> 8) & 0xFF;
    directory[10] = (imageSize >> 16) & 0xFF;
    directory[11] = (imageSize >> 24) & 0xFF;

    // Combine all parts
    ico.set(header, 0);
    ico.set(directory, header.length);
    ico.set(infoHeader, header.length + directory.length);
    ico.set(pixelData, header.length + directory.length + infoHeader.length);

    return ico;
}



