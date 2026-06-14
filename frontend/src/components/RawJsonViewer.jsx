function RawJsonViewer({ title, data }) {
  if (!data) return null;

  return (
    <details className="mt-5">
      <summary className="cursor-pointer text-sm font-bold text-slate-600 transition hover:text-slate-950">
        {title}
      </summary>

      <pre className="mt-3 max-h-96 overflow-x-auto rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-xs leading-5 text-emerald-200 shadow-inner backdrop-blur-2xl">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export default RawJsonViewer;