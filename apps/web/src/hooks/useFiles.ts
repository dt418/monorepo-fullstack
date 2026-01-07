import type { UploadingFile } from '@myorg/ui';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../api';

export function useFiles() {
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: () => apiClient.getFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (variables: { file: File; onProgress: (progress: number) => void }) =>
      apiClient.uploadFile(variables.file, variables.onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  return {
    files: data?.files || [],
    totalFiles: data?.total || 0,
    isLoading,
    error,
    uploadingFiles,
    setUploadingFiles,
    uploadMutation,
    deleteMutation,
  };
}
