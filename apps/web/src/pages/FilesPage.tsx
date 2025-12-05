import type { File as FileType } from '@myorg/types';
import { FileUpload } from '@myorg/ui';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function FilesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => apiClient.getFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadFile(file),
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

  const handleFileSelect = async (files: File[]) => {
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Files</h1>

      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-4">Upload Files</h2>
        <FileUpload
          onFileSelect={handleFileSelect}
          multiple
          accept="image/*,application/pdf,text/plain"
          maxSize={10 * 1024 * 1024}
          disabled={uploadMutation.isPending}
        />
        {uploadMutation.isPending && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Your Files ({data?.total ?? 0})</h2>
        </div>
        {data?.files?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No files uploaded yet.</div>
        ) : (
          <ul className="divide-y">
            {data?.files?.map((file: FileType) => (
              <li key={file.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    {file.mimeType.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-gray-500">
                      {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(file.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
