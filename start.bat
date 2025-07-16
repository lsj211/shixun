@echo off
REM 启动 Node.js 服务（端口3000）
start cmd /k "npm install && npm start"

REM 启动 Python FastAPI 后端（端口8000）
REM 自动安装依赖（如未安装）
pip show fastapi >nul 2>nul || pip install fastapi uvicorn python-dotenv langchain-community langchain-core

REM 启动 Python 服务
start cmd /k "python app.py"

echo 所有服务已启动！
pause