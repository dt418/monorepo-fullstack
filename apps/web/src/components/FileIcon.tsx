import { Icon } from '@myorg/ui';

interface FileIconProps {
  mimeType: string;
  onClick?: () => void;
  className?: string;
}

export function FileIcon({ mimeType, onClick, className = '' }: FileIconProps) {
  const getFileIconConfig = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return {
        icon: 'file-image' as const,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        hoverColor: 'hover:bg-blue-100',
        clickable: true,
      };
    }

    if (mimeType === 'application/pdf') {
      return {
        icon: 'file-type' as const,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        hoverColor: '',
        clickable: false,
      };
    }

    if (mimeType.startsWith('text/')) {
      return {
        icon: 'file-text' as const,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        hoverColor: '',
        clickable: false,
      };
    }

    return {
      icon: 'file' as const,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      iconColor: 'text-gray-600',
      hoverColor: '',
      clickable: false,
    };
  };

  const config = getFileIconConfig(mimeType);
  const isClickable = config.clickable && onClick;

  return (
    <div
      className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 border-dashed ${config.bgColor} ${config.borderColor} ${
        isClickable ? `cursor-pointer ${config.hoverColor} transition-colors` : ''
      } ${className}`}
      onClick={isClickable ? onClick : undefined}
      title={isClickable ? 'Click to preview image' : undefined}
    >
      <Icon name={config.icon} size={20} className={config.iconColor} />
    </div>
  );
}
