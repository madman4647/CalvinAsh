export default function ProgressMap({ steps }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={`h-4 w-4 rounded-full border-2 border-ink ${
              step.done ? 'bg-pine' : step.current ? 'bg-mustard' : 'bg-paper-light'
            }`}
            aria-hidden="true"
          />
          <span className={`text-sm ${step.current ? 'font-bold' : ''}`}>{step.label}</span>
          {i < steps.length - 1 && <span className="squiggle w-8" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
