#!/bin/bash
set -e

APP_NAME="driver-app-prod"
APP_DIR="/var/www/driver-app-prod"
BACKUP_DIR="/var/www/backups"
LOG_DIR="$APP_DIR/logs"
BUILD_DIR="$APP_DIR/build"

echo "🚀 Starting PRODUCTION deployment for $APP_NAME..."
echo ""

if [ -f "/tmp/deployment-info.txt" ]; then
    echo "📋 Deployment Information:"
    echo "========================"
    cat /tmp/deployment-info.txt
    echo ""
    sudo cp /tmp/deployment-info.txt "$APP_DIR/deployment-info.txt" 2>/dev/null || true
else
    echo "⚠️  Warning: deployment-info.txt not found"
    echo ""
fi

echo "📁 Creating directories..."
sudo mkdir -p "$APP_DIR" "$BACKUP_DIR" "$LOG_DIR"

if [ -d "$BUILD_DIR" ]; then
    echo "💾 Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" build
    echo "✅ Backup created: $BACKUP_NAME.tar.gz"
fi

echo "📦 Extracting new build..."
sudo rm -rf "$BUILD_DIR"
sleep 1

if [ -d "$BUILD_DIR" ]; then
    sudo rm -rf "$BUILD_DIR"
    sleep 1
fi

sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "📥 Extracting build.tar.gz..."
sudo tar -xzf /tmp/build.tar.gz
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ ERROR: Build directory not found at $BUILD_DIR after extraction"
    ls -la "$APP_DIR"
    tar -tzf /tmp/build.tar.gz | head -20
    exit 1
fi

echo "📋 Build directory structure:"
ls -la "$BUILD_DIR" | head -10

if [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo "❌ ERROR: Build directory is empty"
    exit 1
fi

echo "✅ Build directory verified at $BUILD_DIR"

echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"
sudo chmod -R 755 "$LOG_DIR"

if ! command -v serve &> /dev/null; then
    echo "📥 Installing serve..."
    sudo npm install -g serve
fi

SERVE_PATH=$(which serve)
if [ -z "$SERVE_PATH" ]; then
    echo "❌ ERROR: serve command not found after installation"
    exit 1
fi
echo "✅ serve found at: $SERVE_PATH"

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp /home/$USER
fi

sudo cp /tmp/ecosystem.config.js "$APP_DIR/ecosystem.config.js"

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ ERROR: index.html not found in build directory"
    ls -la "$BUILD_DIR" | head -10
    exit 1
fi
echo "✅ Build directory contains index.html"

echo "📅 Build timestamp verification:"
echo "   index.html modified: $(stat -c %y "$BUILD_DIR/index.html" 2>/dev/null || echo "unknown")"
echo "   Build directory size: $(du -sh "$BUILD_DIR" | cut -f1)"
echo "   Number of files: $(find "$BUILD_DIR" -type f | wc -l)"

echo "🛑 Stopping existing application..."
cd "$APP_DIR"
pm2 stop "$APP_NAME" || true
pm2 delete "$APP_NAME" || true
sleep 2

echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.js

sleep 3

if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo "❌ ERROR: Application failed to start!"
    pm2 logs "$APP_NAME" --lines 20 --nostream
    exit 1
fi

pm2 save

echo "📊 Application status:"
pm2 status

echo "✅ PRODUCTION deployment completed successfully!"
echo ""
echo "📋 Deployed Version Information:"
if [ -f "$APP_DIR/deployment-info.txt" ]; then
    cat "$APP_DIR/deployment-info.txt"
fi
echo ""
echo "🌐 Application running on port 4002"
echo "📝 View logs with: pm2 logs $APP_NAME"
