export default function EmptyState({ title, message }) {
  return (
    <div className="comic-panel comic-panel--quiet flex flex-col items-center text-center gap-2 py-10">
      <p className="font-heading text-lg">{title}</p>
      {message && <p className="text-sm opacity-80">{message}</p>}
    </div>
  );
}
