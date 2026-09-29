const VARIANT_CLASS = {
  primary: 'bg-red text-white hover:bg-red-deep',
  accent: 'bg-pine text-white',
  secondary: 'bg-mustard text-ink',
  plain: 'bg-paper text-ink',
  danger: 'bg-status-critical text-white',
};

const SIZE_CLASS = {
  sm: 'px-3 py-2 text-sm min-h-[44px]',
  md: 'px-4 py-2.5 text-base min-h-[48px]',
  lg: 'px-6 py-3 text-lg min-h-[56px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  quiet = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`comic-button ${quiet ? 'comic-button--quiet' : ''} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
