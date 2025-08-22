#!/bin/bash

echo "Starting build process..."

# Установка зависимостей сервера
echo "Installing server dependencies..."
npm install

# Установка зависимостей клиента
echo "Installing client dependencies..."
cd client
npm install

# Сборка клиента
echo "Building client..."
npm run build

# Возврат в корневую папку
cd ..

echo "Build completed successfully!"
echo "Client build output:"
ls -la client/out/ 