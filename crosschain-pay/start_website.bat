@echo off
title CrossChain Pay - Blockchain Payments System
echo ========================================================
echo   Starting CrossChain Pay Website...
echo ========================================================
cd /d "%~dp0backend"
echo Connected to MongoDB...
echo Starting server on http://localhost:5000...
start http://localhost:5000
node server.js
pause
