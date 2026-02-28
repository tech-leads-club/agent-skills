#!/usr/bin/env bash
# mermaid-studio/scripts/setup.sh
# Auto-installs rendering dependencies. Run once per environment.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
INSTALL_DIR="${MERMAID_STUDIO_DIR:-$SKILL_DIR/.deps}"

echo "=== Mermaid Studio — Dependency Setup ==="
echo "Install directory: $INSTALL_DIR"

# Ensure Node.js is available
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is required but not found."
    echo "Install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "WARNING: Node.js 18+ recommended. Found: $(node -v)"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Initialize package.json if missing
if [ ! -f package.json ]; then
    echo '{"name":"mermaid-studio-deps","version":"1.0.0","private":true,"type":"module"}' > package.json
fi

echo ""
echo "--- Installing @mermaid-js/mermaid-cli (primary renderer) ---"
npm install --save @mermaid-js/mermaid-cli 2>&1 | tail -3

echo ""
echo "--- Installing beautiful-mermaid (secondary renderer + ASCII) ---"
npm install --save beautiful-mermaid 2>&1 | tail -3

echo ""
echo "--- Installing mermaid (for validation) ---"
npm install --save mermaid 2>&1 | tail -3

echo ""
echo "--- Installing puppeteer (for icon-enabled rendering) ---"
npm install --save puppeteer 2>&1 | tail -3

# Create puppeteer config for headless rendering
cat > "$INSTALL_DIR/puppeteer-config.json" << 'PCONF'
{
  "executablePath": "",
  "args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  "headless": true
}
PCONF

# Try to install Chromium for Puppeteer
echo ""
echo "--- Installing Chromium for Puppeteer ---"
npx puppeteer browsers install chrome 2>&1 | tail -3 || {
    echo "WARNING: Chromium install failed. mmdc may not work."
    echo "  Fallback: beautiful-mermaid will be used for SVG rendering."
    echo "  Or set PUPPETEER_EXECUTABLE_PATH to your Chrome/Chromium binary."
}

# Verify installations
echo ""
echo "=== Verification ==="

if npx --prefix "$INSTALL_DIR" mmdc --version &>/dev/null 2>&1; then
    echo "✓ mermaid-cli: $(npx --prefix "$INSTALL_DIR" mmdc --version 2>&1)"
else
    echo "✗ mermaid-cli: not working (beautiful-mermaid will be used as fallback)"
fi

if node -e "import('$INSTALL_DIR/node_modules/beautiful-mermaid/index.js').then(() => console.log('ok')).catch(() => console.log('fail'))" 2>/dev/null | grep -q ok; then
    echo "✓ beautiful-mermaid: installed"
else
    # Try CommonJS require as fallback check
    if node -e "try{require('$INSTALL_DIR/node_modules/beautiful-mermaid');console.log('ok')}catch(e){console.log('fail')}" 2>/dev/null | grep -q ok; then
        echo "✓ beautiful-mermaid: installed"
    else
        echo "⚠ beautiful-mermaid: installed (module check inconclusive, may still work)"
    fi
fi

echo ""
echo "=== Setup Complete ==="
echo "Dependency directory: $INSTALL_DIR"
echo ""
echo "Usage:"
echo "  node $SKILL_DIR/scripts/render.mjs --input diagram.mmd --output diagram.svg"
echo "  node $SKILL_DIR/scripts/render-ascii.mjs --input diagram.mmd"
echo "  node $SKILL_DIR/scripts/validate.mjs diagram.mmd"
