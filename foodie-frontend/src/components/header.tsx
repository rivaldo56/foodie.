import Link from "next/link"

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900">Foodie</span>
      </div>
      <Link href="/auth" className="text-gray-900 font-medium hover:text-gray-700 transition-colors">
        Sign In
      </Link>
    </header>
  )
}
