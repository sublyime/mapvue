# MapVue Database Setup Helper - Secure Password Input
# This script demonstrates how to run the setup script with secure password input

Write-Host "MapVue Database Setup - Secure Password Input" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Prompt for database password securely
$DbPassword = Read-Host "Enter database password for mapvue_user" -AsSecureString

Write-Host ""
Write-Host "Running database setup with secure password..." -ForegroundColor Yellow

# Run the setup script with the secure password
& (Join-Path $PSScriptRoot "setup.ps1") -DbPassword $DbPassword

# Clear the secure string
$DbPassword = $null
[System.GC]::Collect()

Write-Host "Setup completed securely!" -ForegroundColor Green