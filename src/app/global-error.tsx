'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950 text-white">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Something went wrong!</h2>
            <p className="text-zinc-400 mb-8">
              An unexpected error occurred. We've logged the issue and are looking into it.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
