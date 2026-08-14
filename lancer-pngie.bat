@echo off
title PNGIE-RDC - Serveur
cd /d C:\pngie-rdc\pngie-backend
start "" http://localhost:4000
node src\server.js
pause
