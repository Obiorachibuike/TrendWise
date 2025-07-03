'use client';

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 sm:p-12 prose prose-indigo">
      {/* Hero / Intro */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">About TrendWise</h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto">
          Welcome to <strong>TrendWise</strong>, your go-to blog for AI-generated trending content.
          We leverage cutting-edge AI technology to bring you insightful, up-to-date articles on
          the latest topics and trends.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          Our mission is to empower readers with high-quality content that is both informative and engaging.
          Whether you're a tech enthusiast, a professional, or just curious, TrendWise has something for you.
        </p>
      </section>

      {/* Team */}
      <section className="mb-10 bg-indigo-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-3 text-indigo-700">Our Team</h2>
        <p className="text-indigo-900 leading-relaxed">
          We are a passionate group of AI developers, content creators, and designers dedicated to
          delivering the best reading experience.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
        <p className="text-gray-700 leading-relaxed">
          Got questions or suggestions? Feel free to reach out to us at{' '}
          <a
            href="mailto:support@trendwise.com"
            className="text-indigo-600 underline hover:text-indigo-800 transition"
          >
            support@trendwise.com
          </a>.
        </p>
      </section>
    </main>
  );
}
