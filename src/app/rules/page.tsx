export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">The Rules of the Board</h1>
      <div className="space-y-8 text-gray-600 leading-relaxed text-lg">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. The Ranking System</h2>
          <p>The leaderboard is strictly ranked by Bid Amount. The highest bid takes the #1 spot. In the event of a tie, the listing that placed the bid first retains the higher rank.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. Minimum Bids</h2>
          <p>The minimum bid to enter the leaderboard is $1. All bids must be in whole dollar increments.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. Permanent Placements</h2>
          <p>Once you pay for a spot, your listing stays on the board permanently. You will slowly drift down the ranks only as other people place higher bids than you.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. Content Guidelines</h2>
          <p>We accept SaaS, tools, newsletters, portfolios, and social links. However, we reserve the right to remove any illegal, malicious, or highly inappropriate links without refund.</p>
        </section>
      </div>
    </div>
  );
}
