interface Props {
  show: boolean;
}

export default function StarkWarningBanner({ show }: Props) {
  if (!show) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <span aria-hidden="true">⚠</span>
      <span>STARK backend selected but <code>STARK_ENDPOINT</code> is not configured. Saving will succeed — configure the endpoint in the Credentials page to use STARK routing.</span>
    </div>
  );
}
