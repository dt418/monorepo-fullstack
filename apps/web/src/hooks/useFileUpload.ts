import type { FileUploadResponse } from '@myorg/types';
import type { UploadingFile } from '@myorg/ui';
import type { UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';

interface UseFileUploadProps {
  uploadingFiles: UploadingFile[];
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>;
  uploadMutation: UseMutationResult<
    FileUploadResponse,
    Error,
    { file: File; onProgress: (progress: number) => void }
  >;
}

export function useFileUpload({
  uploadingFiles,
  setUploadingFiles,
  uploadMutation,
}: UseFileUploadProps) {
  const handleFileSelect = useCallback(
    async (files: File[]) => {
      // Add files to uploading state
      const newUploads = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploads]);

      // Process uploads sequentially (or could be parallel)
      for (const upload of newUploads) {
        try {
          await uploadMutation.mutateAsync({
            file: upload.file,
            onProgress: (progress) => {
              setUploadingFiles((prev) =>
                prev.map((item) => (item.id === upload.id ? { ...item, progress } : item))
              );
            },
          });

          // Remove from uploading list on success
          setUploadingFiles((prev) => prev.filter((item) => item.id !== upload.id));
        } catch (error) {
          // Mark as error
          setUploadingFiles((prev) =>
            prev.map((item) => (item.id === upload.id ? { ...item, error: 'Upload failed' } : item))
          );
        }
      }
    },
    [setUploadingFiles, uploadMutation]
  );

  const isUploading = uploadingFiles.some((f) => f.progress < 100 && !f.error);

  return {
    handleFileSelect,
    isUploading,
  };
}
