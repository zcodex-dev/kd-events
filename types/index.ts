export type AdditionalImage = {
  id: string;
  originalName: string;
  storedName: string;
  githubPath: string;
  imageUrl: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
};

export type UploadedFile = {
  id: string;
  slug: string;
  originalName: string;
  storedName: string;
  githubPath: string;
  imageUrl: string;
  shareUrl: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  viewCount: number;
  additionalImages?: AdditionalImage[];
};

// ─── API Response ────────────────────────────────────────────────────────────

export type ApiResponse<T = undefined> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

// ─── Upload Types ────────────────────────────────────────────────────────────

export type UploadResult = {
  file: UploadedFile;
  shareUrl: string;
  imageUrl: string;
};

export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export type FileUploadItem = {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  result?: UploadResult;
};

// ─── GitHub Types ────────────────────────────────────────────────────────────

export type GitHubFileContent = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
};

export type GitHubCreateUpdateResponse = {
  content: GitHubFileContent;
  commit: {
    sha: string;
    message: string;
  };
};

// ─── Metadata Index ──────────────────────────────────────────────────────────

export type AppConfig = {
  allowedTypes: string[];
};

export type MetadataIndex = {
  files: UploadedFile[];
  config?: AppConfig;
  lastUpdated: string;
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export type DashboardStats = {
  totalFiles: number;
  totalViews: number;
  todayUploads: number;
  storageUsed: number;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export type LoginCredentials = {
  password: string;
};

export type SessionData = {
  authenticated: boolean;
  expiresAt: number;
};
