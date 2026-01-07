import {
  File,
  FileText,
  Image,
  Download,
  Eye,
  Trash2,
  Upload,
  FileImage,
  FileType,
  type LucideIcon,
} from 'lucide-react';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export type IconName =
  | 'file'
  | 'file-text'
  | 'image'
  | 'download'
  | 'eye'
  | 'trash'
  | 'upload'
  | 'file-image'
  | 'file-type';

const iconMap: Record<IconName, LucideIcon> = {
  file: File,
  'file-text': FileText,
  image: Image,
  download: Download,
  eye: Eye,
  trash: Trash2,
  upload: Upload,
  'file-image': FileImage,
  'file-type': FileType,
};

/**
 * Icon component using Lucide React icons
 */
export function Icon({ name, size = 16, className = '' }: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} className={className} />;
}

// Export individual icons for direct use
export { File, FileText, Image, Download, Eye, Trash2, Upload, FileImage, FileType };
