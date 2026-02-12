'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to accounts page
    router.push('/dashboard/accounts');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-pulse text-indigo-600 dark:text-indigo-400 text-xl">
          Loading...
        </div>
      </div>
    </div>
  );
}
