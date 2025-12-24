import { useCallback, useState, useEffect, useRef } from 'react';

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  uploadingFiles?: UploadingFile[];
}

/**
 * Drag-and-drop file upload component
 */
export function FileUpload({
  onFileSelect,
  accept = '*/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className = '',
  uploadingFiles = [],
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // Generate previews for uploading files
  // Keep track of previews in a ref for cleanup
  const previewsRef = useRef<Record<string, string>>({});

  // Sync previews with uploadingFiles
  useEffect(() => {
    const currentIds = new Set(uploadingFiles.map((u) => u.id));
    const nextPreviews = { ...previewsRef.current };
    let changed = false;

    // Create previews for new files
    uploadingFiles.forEach((item) => {
      if (item.file.type.startsWith('image/') && !nextPreviews[item.id]) {
        const url = URL.createObjectURL(item.file);
        nextPreviews[item.id] = url;
        changed = true;
      }
    });

    // Cleanup previews for removed files
    Object.keys(nextPreviews).forEach((id) => {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(nextPreviews[id]);
        delete nextPreviews[id];
        changed = true;
      }
    });

    if (changed) {
      previewsRef.current = nextPreviews;
      setPreviews(nextPreviews);
    }
  }, [uploadingFiles]);

  // Cleanup all previews on unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const validateFiles = useCallback(
    (files: FileList | null): File[] => {
      if (!files || files.length === 0) return [];

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`${file.name} exceeds the ${formatBytes(maxSize)} limit`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
      } else {
        setError(null);
      }

      return validFiles;
    },
    [maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    },
    [disabled, onFileSelect, validateFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
      e.target.value = ''; // Reset input
    },
    [onFileSelect, validateFiles]
  );

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {uploadingFiles && (
          <div className="grid grid-cols-2 gap-4">
            {uploadingFiles.map((preview) => (
              <img
                key={preview.id}
                src={URL.createObjectURL(preview.file)}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {accept === '*/*' ? 'Any file type' : accept} up to {formatBytes(maxSize)}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Upload Progress Section */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploadingFiles.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
              <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                {previews[item.id] ? (
                  <img
                    src={previews[item.id]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-500">FILE</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                  <span className="text-xs text-gray-700">{Math.round(item.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${item.error ? 'bg-red-500' : 'bg-primary-600'}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                {item.error && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
