import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
        <h2 className="text-3xl font-bold text-slate-100">404 - Page Not Found</h2>
        <p className="text-slate-400 text-sm">
          The requested page could not be found. Please check the URL or return home.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
        >
          Return to Estimator Home
        </Link>
      </div>
    </div>
  );
}
