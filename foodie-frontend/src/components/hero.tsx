import Link from "next/link"

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-20">
      {/* Status Badge */}
      <div className="mb-12 inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700">Now connecting chefs with food lovers</span>
      </div>

      {/* Main Headline */}
      <div className="text-center max-w-4xl mb-8">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Discover Your Perfect</h1>
        <h2 className="text-6xl font-bold text-orange-500 mb-8">Personal Chef</h2>
      </div>

      {/* Subheading */}
      <p className="text-center text-lg text-gray-600 max-w-2xl mb-12">
        Connect with talented freelance chefs for personalized home dining, events, and unforgettable culinary
        experiences.
      </p>

      {/* CTA Buttons */}
      <div className="flex gap-4">
        <Link
          href="/auth?role=client"
          className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          Find a Chef
        </Link>
        <Link
          href="/auth?role=chef"
          className="px-8 py-3 border-2 border-green-500 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Become a Chef
        </Link>
      </div>
    </section>
  )
}
