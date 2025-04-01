#!/bin/bash

echo "Building Pixel Maker for macOS..."
echo

# Make the script executable if it isn't already
if [ ! -x "$0" ]; then
    chmod +x "$0"
fi

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

# Check if electron-builder is installed
if [ ! -d "node_modules/electron-builder" ]; then
    echo "Installing electron-builder..."
    npm install electron-builder --save-dev
    echo
fi

# Clean dist directory
if [ -d "dist" ]; then
    echo "Cleaning dist directory..."
    rm -rf dist/*
fi

# Build for macOS
echo "Building macOS package..."
npm run build -- --mac

# Check if build was successful
if [ $? -eq 0 ]; then
    echo
    echo "Build completed successfully!"
    echo "Check the dist folder for the Mac package."
else
    echo
    echo "Build failed! Check the error messages above."
fi

# Open dist folder
open dist 