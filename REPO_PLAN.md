# New Repository Commit Plan

This plan outlines how to push the project to a new GitHub repository with a clean, staged history spread over approximately 5 hours.

## Preparation

1.  **Remove Deployment Files**: (Completed) `railway.json` and `render.yaml` have been deleted.
2.  **Reset Git History**: To start fresh, you may want to delete the current `.git` folder:
    ```powershell
    Remove-Item -Recurse -Force .git
    git init
    ```

## Commit Schedule

| Step  | Commit Message                                                     | Content to Add                           | Timing       |
| :---- | :----------------------------------------------------------------- | :--------------------------------------- | :----------- |
| **1** | `chore: initial project structure and base configuration`          | `.gitignore`, `README.md`                | **T + 0h**   |
| **2** | `feat(contracts): add core smart contracts and deployment scripts` | `contracts/` (excluding cache/out/lib)   | **T + 1h**   |
| **3** | `feat(backend): implement express server and api routes`           | `backend/` (excluding node_modules/logs) | **T + 2.5h** |
| **4** | `feat(frontend): setup vite-based portal and components`           | `frontend/` (excluding node_modules)     | **T + 4h**   |
| **5** | `docs: finalize documentation and environment setup`               | `.env.example` templates, final polish   | **T + 5h**   |

## Automation Script

If you want to automate this (using backdated timestamps to simulate work over 5 hours), you can run the following script:

```powershell
# Get Current Date
$now = Get-Date

# Commit 1 (5 hours ago)
git add .gitignore README.md
$env:GIT_AUTHOR_DATE = $now.AddHours(-5).ToString("o")
$env:GIT_COMMITTER_DATE = $now.AddHours(-5).ToString("o")
git commit -m "chore: initial project structure and base configuration"

# Commit 2 (4 hours ago)
git add contracts/
$env:GIT_AUTHOR_DATE = $now.AddHours(-4).ToString("o")
$env:GIT_COMMITTER_DATE = $now.AddHours(-4).ToString("o")
git commit -m "feat(contracts): add core smart contracts and deployment scripts"

# Commit 3 (2.5 hours ago)
git add backend/
$env:GIT_AUTHOR_DATE = $now.AddHours(-2.5).ToString("o")
$env:GIT_COMMITTER_DATE = $now.AddHours(-2.5).ToString("o")
git commit -m "feat(backend): implement express server and api routes"

# Commit 4 (1 hour ago)
git add frontend/
$env:GIT_AUTHOR_DATE = $now.AddHours(-1).ToString("o")
$env:GIT_COMMITTER_DATE = $now.AddHours(-1).ToString("o")
git commit -m "feat(frontend): setup vite-based portal and components"

# Commit 5 (Now)
git add .
$env:GIT_AUTHOR_DATE = $now.ToString("o")
$env:GIT_COMMITTER_DATE = $now.ToString("o")
git commit -m "docs: finalize documentation and environment setup"

# Reset env vars
$env:GIT_AUTHOR_DATE = ""
$env:GIT_COMMITTER_DATE = ""
```

## Option B: Real-Time Automation (Wait & Commit)

Run this if you want the computer to actually wait and commit every hour. **Note:** Keep this terminal window open.

```powershell
# Function to commit and wait
function Commit-And-Wait($msg, $path, $waitHours) {
    Write-Host "Committing: $msg..." -ForegroundColor Cyan
    git add $path
    git commit -m $msg
    if ($waitHours -gt 0) {
        Write-Host "Waiting $waitHours hour(s) for next commit..." -ForegroundColor Yellow
        Start-Sleep -Seconds ($waitHours * 3600)
    }
}

# START THE 5 HOUR PROCESS
Commit-And-Wait "chore: initial project structure" ".gitignore README.md REPO_PLAN.md" 1
Commit-And-Wait "feat(contracts): add core smart contracts" "contracts/" 1.5
Commit-And-Wait "feat(backend): implement express server" "backend/" 1.5
Commit-And-Wait "feat(frontend): setup vite-based portal" "frontend/" 1
Commit-And-Wait "docs: finalize documentation" "." 0

Write-Host "All commits finished! You can now push to GitHub." -ForegroundColor Green
```

Once committed, follow these steps to push to your new repo:

1.  `git remote add origin <YOUR_NEW_REPO_URL>`
2.  `git branch -M main`
3.  `git push -u origin main`
