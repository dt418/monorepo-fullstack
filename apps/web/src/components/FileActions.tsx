import type { File as FileRecord } from '@myorg/types';
import { Button, Icon } from '@myorg/ui';

type FileWithUser = FileRecord & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface FileActionsProps {
  file: FileWithUser;
  onView: (file: FileWithUser) => void;
  onDownload: (file: FileWithUser) => void;
  onDelete: (fileId: string) => void;
}

export function FileActions({ file, onView, onDownload, onDelete }: FileActionsProps) {
  const isImage = file.mimeType.startsWith('image/');

  return (
    <div className="flex items-center gap-2">
      {isImage ? (
        <>
          <Button
            variant="outline"
            onClick={() => onView(file)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Icon name="eye" size={16} className="mr-1 inline" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => onDownload(file)}
            className="text-green-600 hover:text-green-700"
          >
            <Icon name="download" size={16} className="mr-1 inline" />
            Download
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          onClick={() => onDownload(file)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Icon name="download" size={16} className="mr-1 inline" />
          Download
        </Button>
      )}
      <Button
        variant="outline"
        onClick={() => onDelete(file.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Icon name="trash" size={16} className="mr-1 inline" />
        Delete
      </Button>
    </div>
  );
}
