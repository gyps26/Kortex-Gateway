import { NextResponse } from 'next/server';

export async function GET() {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const apiSecret = process.env.API_SECRET || 'my_super_secret_for_mac_workers';

    const script = `#!/bin/bash
echo "========================================"
echo "  RelayGate v2 - macOS Worker Installer "
echo "========================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/ and run this script again."
    exit 1
fi

# Ask for the worker name
read -p "Enter a unique name for this Mac Worker (e.g., mac-worker-1): " WORKER_ID
if [ -z "$WORKER_ID" ]; then
    WORKER_ID="mac-worker-$RANDOM"
    echo "No name provided. Using $WORKER_ID"
fi

INSTALL_DIR="$HOME/.relaygate-worker"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "[1/4] Downloading worker files..."

cat << 'EOF_PKG' > package.json
{
  "name": "mac-worker",
  "version": "1.0.0",
  "main": "worker.js",
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "sqlite3": "^5.1.0"
  }
}
EOF_PKG

curl -s "${appUrl}/api/installer/file?name=worker" -o worker.js

echo "[2/4] Configuring environment..."
echo "WORKER_ID=\"$WORKER_ID\"" > .env
echo "API_URL=\"${appUrl}/api/worker\"" >> .env
echo "API_SECRET=\"${apiSecret}\"" >> .env

echo "[3/4] Installing dependencies (this may take a minute)..."
npm install --silent

echo "[4/4] Starting background daemon..."
# Stop existing process if it exists to allow for clean update
npx pm2 delete "relaygate-worker-$WORKER_ID" &> /dev/null || true
npx pm2 start worker.js --name "relaygate-worker-$WORKER_ID"
npx pm2 save

echo ""
echo "========================================"
echo "✅ INSTALLATION COMPLETE!"
echo "Your worker '$WORKER_ID' is now running safely in the background."
echo ""
echo "⚠️  ONE LAST IMPORTANT STEP:"
echo "To allow the gateway to read incoming messages, you MUST grant Full Disk Access."
echo "1. On your Mac, go to System Settings > Privacy & Security > Full Disk Access"
echo "2. Add your 'Terminal' application to the list and toggle it ON."
echo "========================================"
`;

    return new NextResponse(script, {
        headers: { 'Content-Type': 'text/plain' }
    });
}
