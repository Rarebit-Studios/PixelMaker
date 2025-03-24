const APP_VERSION = '1.0.4'; // Match this with meta tag and title

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

    // Define saveToLocalStorage first
    function saveToLocalStorage() {
        try {
            const pixels = document.querySelectorAll('.pixel');
            const pixelData = Array.from(pixels).map(pixel => pixel.style.backgroundColor || 'transparent');
            const currentPaletteName = paletteSelector.value;
            
            // Save pixel data, resolution, and palette
            localStorage.setItem('pixelArtData', JSON.stringify(pixelData));
            localStorage.setItem('pixelArtResolution', currentResolution.toString());
            localStorage.setItem('pixelArtPalette', currentPaletteName);
            
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

    // Handle palette changes
    paletteSelector.addEventListener('change', (e) => {
        currentPalette = palettes[e.target.value];
        updateColorSwatches();
        
        // Show/hide MakeCode export button based on palette selection
        exportMakeCodeBtn.style.display = e.target.value === 'makecode' ? 'inline-block' : 'none';
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

    function saveImage(scale = 10) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentResolution * scale;
        canvas.height = currentResolution * scale;

        // Make canvas transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Update save button handler
    saveBtn.addEventListener('click', () => {
        saveToLocalStorage();
        const canvas = saveImage(10);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `pixel-art-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
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

    // Update the loadFromLocalStorage function
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
        
        // Tools tooltips
        penBtn.title = "Pen (P) - Draw with selected color";
        eraserBtn.title = "Eraser (E) - Erase pixels";
        colorPickerBtn.title = "Color Picker (I) - Pick a color from the canvas";
        undoBtn.title = "Undo (Ctrl+Z) - Undo last action";
        redoBtn.title = "Redo (Ctrl+Y/Ctrl+Shift+Z) - Redo last undone action";
        
        // Color tools tooltips
        colorPicker.title = "Choose any color";
        paletteSelector.title = "Choose a color palette";
        
        // File operation tooltips
        saveBtn.title = "Save - Save your artwork as PNG";
        importBtn.title = "Import - Import an image (will be resized)";
        clearBtn.title = "Clear - Clear the canvas";
        exportMakeCodeBtn.title = "Export MakeCode - Export for MakeCode Arcade";
        
        // Coordinates display tooltip
        coordinatesDisplay.title = "Pixel Coordinates";
    }

    // Call this function after DOM content is loaded
    addTooltips();

    // Update logo button handler
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            window.open('https://realityboffins.com', '_blank', 'noopener,noreferrer');
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
        const modals = ['modalOverlay', 'clearModal', 'resolutionModal', 'copyModal'];
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

    // Update the shareArtwork function to use the new getPixelData function
    function shareArtwork() {
        // Get the current pixel data
        const pixelData = getPixelData();
        const currentPalette = document.getElementById('paletteSelector').value;
        
        // Create a compressed data string
        const artworkData = btoa(JSON.stringify({
            pixels: pixelData,
            palette: currentPalette,
            resolution: currentResolution // Also save the resolution
        }));
        
        // Generate the share URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?art=${artworkData}`;
        
        // Show the share modal
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('shareModal').style.display = 'block';
        document.getElementById('shareUrl').value = shareUrl;
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

    // Update the load handler to handle resolution
    window.addEventListener('load', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const artData = urlParams.get('art');
        
        if (artData) {
            try {
                const decodedData = JSON.parse(atob(artData));
                
                // Set the resolution first if it exists
                if (decodedData.resolution) {
                    currentResolution = decodedData.resolution;
                    document.getElementById('resolutionSelector').value = decodedData.resolution.toString();
                    createGridWithoutSave(decodedData.resolution);
                }
                
                // Set the palette
                document.getElementById('paletteSelector').value = decodedData.palette;
                currentPalette = palettes[decodedData.palette];
                updateColorSwatches();
                
                // Load the pixel data
                loadPixelData(decodedData.pixels);
                
                showNotification('Shared artwork loaded!', 2000);
            } catch (error) {
                console.error('Failed to load shared artwork:', error);
                showNotification('Failed to load shared artwork', 3000);
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
});
