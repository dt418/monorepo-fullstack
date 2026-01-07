import type { File as FileRecord } from '@myorg/types';
import { FileActions } from './FileActions';
import { FileIcon } from './FileIcon';
import { FileInfo } from './FileInfo';

type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface FileItemProps {
  file: FileWithUser;
  onView: (file: FileWithUser) => void;
  onDownload: (file: FileWithUser) => void;
  onDelete: (fileId: string) => void;
}

export function FileItem({ file, onView, onDownload, onDelete }: FileItemProps) {
  const handleIconClick = () => {
    if (file.mimeType.startsWith('image/')) {
      onView(file);
    }
  };

  return (
    <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <FileIcon mimeType={file.mimeType} onClick={handleIconClick} />
        <FileInfo file={file} />
      </div>
      <FileActions file={file} onView={onView} onDownload={onDownload} onDelete={onDelete} />
    </div>
  );
}
