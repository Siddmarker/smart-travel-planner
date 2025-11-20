@echo off
echo ==========================================
echo   Smart Travel Planner - GitHub Setup
echo ==========================================
echo.

:: Check for Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/downloads and try again.
    echo After installing, close this window and run this script again.
    pause
    exit /b
)

echo [SUCCESS] Git is installed.
echo.

:: Initialize Repo
if exist .git (
    echo [INFO] Git repository already initialized.
) else (
    echo [ACTION] Initializing Git repository...
    git init
)

:: Add Files
echo [ACTION] Adding files to staging...
git add .

:: Commit
echo [ACTION] Committing files...
git commit -m "Initial commit: Smart Travel Planner"

:: Remote Setup
echo.
echo ==========================================
echo   IMPORTANT: Create a NEW repository on GitHub
echo   1. Go to https://github.com/new
echo   2. Name your repository (e.g., smart-travel-planner)
echo   3. Do NOT check "Initialize with README", .gitignore, or License
echo   4. Click "Create repository"
echo   5. Copy the HTTPS URL provided
echo ==========================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL provided. Exiting.
    pause
    exit /b
)

echo [ACTION] Adding remote origin...
:: Remove origin if it exists to avoid errors on re-run
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

:: Push
echo [ACTION] Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. 
    echo Please check if:
    echo 1. The repository URL is correct
    echo 2. You have permission to push to this repository
    echo 3. The repository is empty (no README/License created during setup)
) else (
    echo.
    echo [SUCCESS] Code pushed successfully!
)

echo.
echo ==========================================
echo   DONE!
echo ==========================================
pause
