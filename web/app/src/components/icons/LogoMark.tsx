import icon from '@/assets/lqmusic-icon.png';

export function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <img
      src={icon}
      alt=""
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block', flexShrink: 0, objectFit: 'contain' }}
    />
  );
}
