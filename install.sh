#!/bin/bash

# Business Dashboard — Installer
# By @tenfoldmarc

SKILL_DIR="$HOME/.claude/skills/business-dashboard"

echo ""
echo "Installing Business Dashboard..."
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed."
    echo ""
    echo "On Mac, run this first: xcode-select --install"
    echo "Then re-run this installer."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo ""
    echo "Install it from: https://nodejs.org"
    echo "Then re-run this installer."
    exit 1
fi

# Remove existing install if present
if [ -d "$SKILL_DIR" ]; then
    echo "Updating existing install..."
    rm -rf "$SKILL_DIR"
fi

# Create skills directory if it doesn't exist
mkdir -p "$HOME/.claude/skills"

# Clone the skill
git clone https://github.com/tenfoldmarc/business-dashboard "$SKILL_DIR" --quiet

if [ $? -eq 0 ]; then
    echo "Done. Business Dashboard installed to $SKILL_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Claude Code (or open a new session)"
    echo "  2. Say: 'Set up my business dashboard'"
    echo "  3. The skill will walk you through connecting your data"
    echo ""
else
    echo "Install failed. Check your internet connection and try again."
    exit 1
fi
