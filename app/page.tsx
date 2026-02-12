export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          eBay Kleinanzeigen
          <span className="block text-indigo-600 dark:text-indigo-400">Multi-Account Messenger</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Manage all your eBay Kleinanzeigen accounts in one unified inbox.
          Never miss a message again.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/docs"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-md hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Learn More
          </a>
        </div>
      </main>
    </div>
  );
}
