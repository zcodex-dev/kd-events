# Project Setup & GitHub Deployment Plan for CloudPanel

Setup the **Zcodex FileUpload / Event Registration** project on the CloudPanel server (`register.kompongdewa.win`) using **pnpm** and a **GitHub pull-based deployment workflow**, ensuring existing data (QR codes, member registrations, database records, and Cloudflare R2 files) are 100% preserved.

## User Review Required

> [!IMPORTANT]
> **Data Safety Guarantee**: Existing database records (QR codes, member details, events) and uploaded files stored in Cloudflare R2 (`kd-events`) will **NOT** be overwritten or deleted. We will use schema sync (`prisma db push`) without reset flags and maintain the existing database credentials.

> [!NOTE]
> **GitHub Workflow**: Once configured, future updates only require running `git push` locally and running `./deploy.sh` (or `git pull && pnpm build`) on the server to deploy new features without touching server configurations.

## Open Questions

> [!IMPORTANT]
> 1. **CloudPanel Site Configuration**: Is `register.kompongdewa.win` already created as a **Node.js Site** or a **Reverse Proxy Site** in CloudPanel?
> 2. **Database Details**: Will the server use an existing external PostgreSQL database (e.g., Supabase / Neon / CloudPanel PostgreSQL) or a local PostgreSQL instance on the server?
> 3. **SSH Access & Credentials**: We will use the SSH credentials provided (`kompongdewa@43.134.129.74`) to execute setup steps non-interactively via deployment scripts.

---

## Proposed Changes

### Component 1: CloudPanel Server Setup & Path Structure

We will deploy two separate sites on CloudPanel pointing to the same repository but running on different ports. They will share the exact same database.

**Site 1: Registration App (`register.kompongdewa.win`)**
- Destination directory: `/home/kompongdewa/htdocs/register.kompongdewa.win`
- SSH User: `kompongdewa`
- Git repository setup: Clone `https://github.com/zcodex-dev/kd-events.git`
- Environment setup: Create `.env` file with production database URL and R2 credentials.

**Site 2: Admin Dashboard (`kompongdewa.win`)**
- Destination directory: `/home/kompongdewaadmin/htdocs/kompongdewa.win`
- SSH User: `kompongdewaadmin`
- Git repository setup: Clone `https://github.com/zcodex-dev/kd-events.git`
- Environment setup: Create `.env` file with the **exact same** database URL and R2 credentials as Site 1 to ensure seamless data sharing.

### Component 2: Node.js & pnpm Application Deployment

- Install dependencies using `pnpm install`.
- Run Prisma Client generation (`npx prisma generate`).
- Safely update Prisma schema using `npx prisma db push` (preserves all existing table rows and QR code data).
- Build production Next.js assets (`pnpm build`).
- Process Management: Configure PM2 process manager or CloudPanel's default Node runner to start `pnpm start` (or `next start`) on the configured port.

### Component 3: One-Click Update Scripts (`deploy.sh`)

Create a `deploy.sh` script inside each site's root directory.

**For `register.kompongdewa.win` (Port 3004):**
```bash
#!/bin/bash
git pull origin main
pnpm install
npx prisma generate
pnpm build
PORT=3004 pm2 restart register-app || PORT=3004 pnpm start
```

**For `kompongdewa.win` (Port 3005):**
```bash
#!/bin/bash
git pull origin main
pnpm install
npx prisma generate
pnpm build
PORT=3005 pm2 restart admin-app || PORT=3005 pnpm start
```
- This allows instant updates whenever you push code changes to GitHub without manual file uploads.

---

## Verification Plan

### Automated Tests
- Server connectivity & environment checks (`node -v`, `pnpm -v`, `git --version`).
- Next.js build verification (`pnpm build`).

### Manual Verification
- Test accessing `https://register.kompongdewa.win` via browser.
- Verify existing QR code generation, registration list, member data, and Cloudflare R2 file uploads.
