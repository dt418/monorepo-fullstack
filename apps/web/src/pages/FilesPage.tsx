import type { File as FileRecord } from '@myorg/types';
import { FilesHeader, FileUploadSection, FileList } from '../components';
import { useFiles, useFileActions, useFileUpload } from '../hooks';

// Extended file type with optional user info for admin views
type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function FilesPage() {
  // Custom hooks for data and logic
  const {
    files,
    totalFiles,
    isLoading,
    uploadingFiles,
    setUploadingFiles,
    uploadMutation,
    deleteMutation,
  } = useFiles();

  const { handleFileView, handleFileDownload } = useFileActions();

  const { handleFileSelect, isUploading } = useFileUpload({
    uploadingFiles,
    setUploadingFiles,
    uploadMutation,
  });

  // Event handlers
  const handleDelete = (fileId: string) => {
    deleteMutation.mutate(fileId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render
  return (
    <div className="space-y-6">
      <FilesHeader totalFiles={totalFiles} />

      <FileUploadSection
        onFileSelect={handleFileSelect}
        uploadingFiles={uploadingFiles}
        isUploading={isUploading}
      />

      <FileList
        files={files as FileWithUser[]}
        totalFiles={totalFiles}
        onView={handleFileView}
        onDownload={handleFileDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
