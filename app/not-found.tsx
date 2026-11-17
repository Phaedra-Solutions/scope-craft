import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#082A1C] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#F4F7F9] border border-[#DDE3E7] rounded-2xl p-8 max-w-md w-full shadow-sm space-y-4">
        <h2 className="text-3xl font-semibold text-[#082A1C] lb-heading">404 - Page Not Found</h2>
        <p className="text-[#64707A] text-sm">
          The requested page could not be found. Please check the URL or return home.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl lb-btn-primary font-semibold text-sm active:scale-[0.98]"
        >
          Return to Estimator Home
        </Link>
      </div>
    </div>
  );
}
