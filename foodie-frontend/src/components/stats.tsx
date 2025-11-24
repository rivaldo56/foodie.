export default function Stats() {
  const stats = [
    {
      number: "1,000+",
      label: "Active Users",
      description: "Busy professionals and families trust Foodie",
      icon: "👥",
    },
    {
      number: "100+",
      label: "Verified Chefs",
      description: "Background-checked culinary professionals",
      icon: "Award",
    },
    {
      number: "$10K+",
      label: "Monthly Bookings",
      description: "Supporting local chefs and food communities",
      icon: "📈",
    },
    {
      number: "4.8★",
      label: "Average Rating",
      description: "Consistently exceptional experiences",
      icon: "Shield",
    },
  ]

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
              <div className="text-gray-900 font-semibold mb-2">{stat.label}</div>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
