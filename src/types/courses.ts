export interface AttachmentSource {
  id: number;
  filename: string;
  url: string;
  group: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
