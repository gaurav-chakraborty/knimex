import Image from 'next/image';
import Link from 'next/link';
import { appPath } from '@/lib/app-path';

interface FileXLogoProps {
  variant?: 'full' | 'standard' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linkToHome?: boolean;
  className?: string;
}

const sizeMap = {
  full: { xs: 150, sm: 200, md: 300, lg: 400, xl: 650 },
  standard: { xs: 100, sm: 120, md: 180, lg: 240, xl: 400 },
  icon: { xs: 24, sm: 32, md: 48, lg: 64, xl: 128 }
};

export default function FileXLogo({ 
  variant = 'standard', 
  size = 'md',
  linkToHome = true,
  className = ''
}: FileXLogoProps) {
  // Using the full logo for now as we only have one file. 
  // In a real scenario we would have separate files for variants.
  // We can use object-fit and overflow-hidden to simulate variants if needed.
  const logoSrc = '/brand/logos/filex-logo-full.png';
  
  const width = sizeMap[variant][size];
  const height = variant === 'icon' ? width : width * (450/650); // Maintain aspect ratio from 650x450
  
  const logoImage = (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={logoSrc}
        alt="FileX - Beyond the File. Your Metadata, Your Control."
        fill
        priority={variant === 'standard'}
        className="object-contain"
      />
    </div>
  );
  
  if (linkToHome) {
    return (
      <Link href={appPath("/")} className="inline-block hover:opacity-80 transition-opacity">
        {logoImage}
      </Link>
    );
  }
  
  return logoImage;
}
