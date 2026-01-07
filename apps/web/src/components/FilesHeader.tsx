import { Icon } from '@myorg/ui';

interface FilesHeaderProps {
  totalFiles: number;
}

export function FilesHeader({ totalFiles }: FilesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Files</h1>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon name="file" size={16} />
        <span>{totalFiles} files</span>
      </div>
    </div>
  );
}
