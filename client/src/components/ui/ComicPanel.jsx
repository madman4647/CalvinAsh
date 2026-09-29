const VARIANT_CLASS = {
  default: '',
  highlight: 'comic-panel--highlight',
  quiet: 'comic-panel--quiet',
};

export default function ComicPanel({ variant = 'default', className = '', children, ...props }) {
  return (
    <div className={`comic-panel p-6 ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
