Write-Host "Setting DB_PORT..."
npx vercel env add DB_PORT production --value 4000 --yes --force

Write-Host "Setting DB_USER..."
npx vercel env add DB_USER production --value "eFB3KMf2qdor1dt.root" --yes --force

Write-Host "Setting DB_PASSWORD..."
npx vercel env add DB_PASSWORD production --value "dZzUtLyDt3dIcTvP" --yes --force

Write-Host "Setting DB_NAME..."
npx vercel env add DB_NAME production --value "cargo_warehouse" --yes --force

Write-Host "Setting JWT_SECRET..."
npx vercel env add JWT_SECRET production --value "dZzUtLyDt3dIcTvP-secure-jwt-key-2026" --yes --force

Write-Host "Setting JWT_EXPIRES_IN..."
npx vercel env add JWT_EXPIRES_IN production --value "7d" --yes --force

Write-Host "Setting NODE_ENV..."
npx vercel env add NODE_ENV production --value "production" --yes --force

Write-Host "All env vars successfully updated!"
