export default function Loading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
      <p className="text-sm text-white/40 font-mono uppercase tracking-widest">{text}</p>
    </div>
  );
}
