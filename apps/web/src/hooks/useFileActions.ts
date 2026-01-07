import type { File as FileRecord } from '@myorg/types';
import { useCallback } from 'react';
import { apiClient } from '../api';

type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function useFileActions() {
  const handleFileView = useCallback(async (file: FileWithUser) => {
    try {
      const blob = await apiClient.downloadFile(file.id);

      if (file.mimeType.startsWith('image/')) {
        // For images, create a blob URL for preview in new tab
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // For other files, trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to access file:', error);
      // You might want to show a toast notification here
    }
  }, []);

  const handleFileDownload = useCallback(async (file: FileWithUser) => {
    try {
      const blob = await apiClient.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      // You might want to show a toast notification here
    }
  }, []);

  return {
    handleFileView,
    handleFileDownload,
  };
}
