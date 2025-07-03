'use client';

export default function Footer() {
  return (
    <footer
      className="text-white py-6 mt-12"
      style={{
        background: 'linear-gradient(90deg, #630692 0%, #265bdd 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} TrendWise. All rights reserved.</p>
        <div className="mt-3 md:mt-0 space-x-6">
          <a href="/about" className="hover:underline">
            About
          </a>
          <a href="/contact" className="hover:underline">
            Contact
          </a>
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
