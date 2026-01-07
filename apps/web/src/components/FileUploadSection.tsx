import { Card, CardHeader, CardTitle, CardContent, Icon, FileUpload } from '@myorg/ui';
import type { UploadingFile } from '@myorg/ui';

interface FileUploadSectionProps {
  onFileSelect: (files: File[]) => void;
  uploadingFiles: UploadingFile[];
  isUploading: boolean;
}

export function FileUploadSection({
  onFileSelect,
  uploadingFiles,
  isUploading,
}: FileUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="upload" size={20} />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FileUpload
          onFileSelect={onFileSelect}
          multiple
          accept="image/*,application/pdf,text/plain"
          maxSize={10 * 1024 * 1024}
          disabled={isUploading}
          uploadingFiles={uploadingFiles}
        />
      </CardContent>
    </Card>
  );
}
