#!/bin/bash

echo "Preparing Jira Task Generator for Chrome Web Store..."

VERSION="1.0.0"
EXTENSION_DIR="chrome-extension"
OUTPUT_FILE="jira-task-generator-v${VERSION}.zip"

cd "$(dirname "$0")/.."

if [ ! -d "$EXTENSION_DIR" ]; then
    echo "Error: $EXTENSION_DIR directory not found!"
    exit 1
fi

echo "Creating ZIP archive..."
cd "$EXTENSION_DIR"

zip -r "../${OUTPUT_FILE}" . \
    -x "*.DS_Store" \
    -x "*.git*" \
    -x "*.log" \
    -x "*.zip" \
    -x ".gitignore"

cd ..

if [ -f "$OUTPUT_FILE" ]; then
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ Success! Created: $OUTPUT_FILE ($SIZE)"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://chrome.google.com/webstore/devconsole"
    echo "2. Upload $OUTPUT_FILE"
    echo "3. Fill in the store listing"
    echo "4. Submit for review"
else
    echo "❌ Error: Failed to create ZIP file"
    exit 1
fi

