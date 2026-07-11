# FileUpload — Image Sharing Dashboard (Cloudflare R2 Storage)

A production-ready file upload and sharing web application built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**. It uses **Cloudflare R2 Storage** (S3-compatible object storage) as file storage and generates **shareable links** and **QR codes** for uploaded images.

## Features

- **Admin Dashboard** — Statistics, recent uploads, file management
- **Drag-and-Drop Upload** — Single and multiple file uploads with validation
- **Cloudflare R2 Storage** — Files uploaded directly to R2 bucket via S3 API SDK
- **Shareable Links** — Public viewing pages with unique slugs
- **QR Code Generation** — Download and share QR codes for each image
- **Authentication** — Password-protected admin area with HTTP-only cookies
- **Responsive Design** — Works on desktop, tablet, and mobile
- **OG Metadata** — Social media link previews for shared images
- **View Counter** — Track how many times each image is viewed

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Full-stack framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| React Hook Form + Zod | Form validation |
| qrcode | QR code generation |
| Sonner | Toast notifications |
| Cloudflare R2 SDK (@aws-sdk/client-s3) | File storage |

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare R2 Bucket (e.g., `kd-events`)
- Cloudflare R2 Access Key ID and Secret Access Key

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Zcodex-fileupload
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://01962aa70590ca905cb842b1c028d782.r2.cloudflarestorage.com
R2_BUCKET_NAME=kd-events
R2_PUBLIC_URL=
GITHUB_UPLOAD_FOLDER=public-uploads
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_PASSWORD=your-secure-password
```

> **Note on R2_PUBLIC_URL**: If you have not configured a public custom domain or public bucket domain for your R2 bucket, leave `R2_PUBLIC_URL` blank. The application will automatically and securely proxy the images through a local Next.js API route `/api/raw?key=...`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
```

## Cloudflare R2 Setup

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **R2** and click **Create bucket**. Name it `kd-events` (or your preferred bucket name).
3. Go back to R2 overview and click **Manage R2 API Tokens** on the right side.
4. Click **Create API token**, give it **Edit** permissions, and create it.
5. Copy the **Access Key ID** and **Secret Access Key** and add them to your `.env.local`.
6. Copy the **S3 API endpoint** (excluding the bucket name) and set it as `R2_ENDPOINT`.

## Deploy to Vercel

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/zcodex-dev/kd-events.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. Vercel will automatically detect Next.js.
4. Set all environment variables in Vercel project settings.
5. Click **Deploy**.

## License

MIT
