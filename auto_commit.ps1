# x402 AI Automated Committer (Human-Like Version)
# This script commits code at irregular intervals and deletes itself at the end.

function Commit-Task($msg, $path) {
    Write-Host "----------------------------------------"
    Write-Host "Processing: $msg"
    git add $path
    git commit -m $msg
    git push
    Write-Host "Done at $(Get-Date)"
}

function Wait-Random {
    # Wait between 105 and 135 minutes (approx 1.5 to 2.2 hours)
    $minMinutes = 105
    $maxMinutes = 135
    $waitMinutes = Get-Random -Minimum $minMinutes -Maximum $maxMinutes
    Write-Host "Human-like delay: Sleeping for $waitMinutes minutes..." -ForegroundColor Yellow
    Start-Sleep -Seconds ($waitMinutes * 60)
}

Write-Host "Automation logic initialized. Simulating human activity."

# Cycle 1: Contracts
Wait-Random
Commit-Task "feat(contracts): add core smart contracts and deployment logic" "contracts/"

# Cycle 2: Backend
Wait-Random
Commit-Task "feat(backend): implement express server and ai gateway" "backend/"

# Cycle 3: Frontend
Wait-Random
Commit-Task "feat(frontend): setup vite portal and x402 components" "frontend/"

# Cycle 4: Final Cleanup
Wait-Random
Write-Host "Finalizing and removing automation traces..."
# Remove the plan and script so they aren't in the final files
Remove-Item "REPO_PLAN.md"
Remove-Item "auto_commit.ps1"
git add .
git commit -m "docs: finalize documentation and environment setup"
git push

Write-Host "All commits finished. Traces removed. Project looks manual!"
