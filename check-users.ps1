$env:DATABASE_URL = "postgresql://postgres:StannelDb2026Secure@35.252.24.88/stannel"
Set-Location "C:\Users\computer\Desktop\stanel\backend"
Rename-Item ".env" ".env.bak" -ErrorAction SilentlyContinue

# Query all users
npx prisma db execute --stdin --schema=src/prisma/schema.prisma << 'EOF'
SELECT id, email, name, role, "isActive" FROM "User";
EOF

if (Test-Path ".env.bak") { Rename-Item ".env.bak" ".env" }
