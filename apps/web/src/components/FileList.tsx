import type { File as FileRecord } from '@myorg/types';
import { Card, CardHeader, CardTitle, CardContent, Icon } from '@myorg/ui';
import { FileItem } from './FileItem';

type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface FileListProps {
  files: FileWithUser[];
  totalFiles: number;
  onView: (file: FileWithUser) => void;
  onDownload: (file: FileWithUser) => void;
  onDelete: (fileId: string) => void;
}

export function FileList({ files, totalFiles, onView, onDownload, onDelete }: FileListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="file" size={20} />
            Your Files
          </div>
          <span className="text-sm font-normal text-gray-500">{totalFiles} total</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Icon name="file" size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No files uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onView={onView}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
