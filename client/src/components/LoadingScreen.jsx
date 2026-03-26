function LoadingScreen({ message = "Loading secure workspace..." }) {
  return (
    <div className="min-h-[40vh] rounded-2xl border border-slate-200 bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
