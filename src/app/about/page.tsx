export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About Gotop</h1>
      <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
        <p>Gotop is the ultimate competitive leaderboard for products, startups, and creators.</p>
        <p>Instead of relying on algorithms or upvotes, Gotop is a pure, transparent bidding system. You decide exactly how much attention your product deserves.</p>
        <p>Our mission is to create the most direct, unfiltered discovery platform on the internet. Whether you are launching a new SaaS, promoting a newsletter, or growing your community, Gotop puts you directly in front of thousands of eyeballs.</p>
        
        <div className="pt-8 mt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            This project is heavily inspired by <a href="https://outbid.lol" target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:underline">outbid.lol</a>, originally created by <a href="https://x.com/jonathan_wilke" target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:underline">Jonathan Wilke</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
