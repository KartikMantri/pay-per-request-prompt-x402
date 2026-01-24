# x402 AI Access Marketplace - Automated Committer
# This script will run every 2 hours and commit sections of the code.

function Commit-Progress($message, $folderPath) {
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host "📦 Starting Commit: $message" -ForegroundColor Cyan
    
    if ($folderPath -eq ".") {
        git add .
    } else {
        git add $folderPath
    }
    
    git commit -m $message
    Write-Host "✅ Committed at $(Get-Date)" -ForegroundColor Green
    
    # Try to push if remote is set
    try {
        git push origin main
        Write-Host "🚀 Pushed to GitHub!" -ForegroundColor Blue
    } catch {
        Write-Host "⚠️  Push failed (is the repo empty?). You may need to push manually once code is staged." -ForegroundColor Yellow
    }
}

# 1. Initial Setup
Commit-Progress "chore: initial project structure and base configuration" ".gitignore README.md REPO_PLAN.md"
Write-Host "⏳ Waiting 2 hours for next commit..." -ForegroundColor Yellow
Start-Sleep -Seconds 7200

# 2. Contracts
Commit-Progress "feat(contracts): add core smart contracts and deployment scripts" "contracts/"
Write-Host "⏳ Waiting 2 hours for next commit..." -ForegroundColor Yellow
Start-Sleep -Seconds 7200

# 3. Backend
Commit-Progress "feat(backend): implement express server and mock ai gateway" "backend/"
Write-Host "⏳ Waiting 2 hours for next commit..." -ForegroundColor Yellow
Start-Sleep -Seconds 7200

# 4. Frontend
Commit-Progress "feat(frontend): setup vite-based portal and x402 components" "frontend/"
Write-Host "⏳ Waiting 2 hours for next commit..." -ForegroundColor Yellow
Start-Sleep -Seconds 7200

# 5. Final Polish
Commit-Progress "docs: finalize documentation and environment setup" "."

Write-Host "🎉 ALL COMMITS FINISHED!" -ForegroundColor Green
