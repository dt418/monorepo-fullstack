import type { File as FileRecord } from '@myorg/types';
import { formatBytes } from '../utils/formatBytes';

type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface FileInfoProps {
  file: FileWithUser;
}

export function FileInfo({ file }: FileInfoProps) {
  return (
    <div>
      <p className="font-medium text-gray-900">{file.originalName}</p>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{formatBytes(file.size)}</span>
        <span>•</span>
        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        {file.user && (
          <>
            <span>•</span>
            <span className="text-blue-600">
              by {file.user.name} ({file.user.email})
            </span>
          </>
        )}
      </div>
    </div>
  );
}
