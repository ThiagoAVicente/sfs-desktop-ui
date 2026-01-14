#!/bin/bash

# SFS - Semantic File Search Installation Script

set -e

APP_NAME="sfs-desktop"
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
BINARY="$SCRIPT_DIR/src-tauri/target/release/tauri-app"
ICON="$SCRIPT_DIR/src-tauri/icons/128x128.png"

# User directories
BIN_DIR="$HOME/.local/bin"
APPS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons/hicolor/128x128/apps"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Semantic File Search - User Installation${NC}"
echo "=============================================="

echo "Building Tauri app..."
npm install
npm run tauri build -- --no-bundle

# Create directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p "$BIN_DIR"
mkdir -p "$APPS_DIR"
mkdir -p "$ICONS_DIR"

# Install binary
echo -e "${GREEN}Installing binary to $BIN_DIR...${NC}"
cp "$BINARY" "$BIN_DIR/$APP_NAME"
chmod +x "$BIN_DIR/$APP_NAME"

# Install icon
echo -e "${GREEN}Installing icon...${NC}"
cp "$ICON" "$ICONS_DIR/$APP_NAME.png"

# Create desktop entry
echo -e "${GREEN}Creating desktop entry...${NC}"
cat >"$APPS_DIR/$APP_NAME.desktop" <<EOF
[Desktop Entry]
Name=Semantic File Search
Comment=Desktop UI for semantic file search
Exec=$BIN_DIR/$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;FileTools;
StartupNotify=true
EOF

# Update desktop database
echo -e "${GREEN}Updating desktop database...${NC}"
update-desktop-database "$APPS_DIR" &>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" &>/dev/null || true

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo -e "Run with: ${YELLOW}$APP_NAME${NC}"
echo "Or find 'Semantic File Search' in your application menu"
echo ""
echo -e "${YELLOW}Note: Make sure $BIN_DIR is in your PATH${NC}"
echo "Add this to your ~/.bashrc or ~/.zshrc if not already:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
