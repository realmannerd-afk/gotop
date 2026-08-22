export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">How It Works</h1>
      <div className="space-y-6 text-gray-600 leading-relaxed text-[17px]">
        
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            ?? 1. The Ranking System
          </h2>
          <p>The leaderboard is simply a ranked list based on who is paying the most money. Whoever has the highest bid sits at the #1 spot at the top of the page. If two people have the exact same bid amount, whoever paid for that amount first wins the tiebreaker and gets the higher spot.</p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            ?? 2. A New Challenger
          </h2>
          <p>Let's say the person currently at the #1 spot paid <strong>$10</strong>. A brand new user visits the homepage, wants that top spot, and enters their own website URL with a bid of <strong>$11</strong>. They pay the $11, and instantly their website is placed at the #1 spot. The person who used to be #1 gets pushed down to #2.</p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            ??? 3. Fighting Back (Increasing a Bid)
          </h2>
          <p>The person who just got pushed to #2 doesn't have to start over and pay a full $12 to get their spot back!</p>
          <p className="mt-3">Instead, they open their secret <strong>Management Link</strong> (which is provided securely on the success page when they first buy their spot). From there, they can choose to increase their bid to <strong>$12</strong>.</p>
          <p className="mt-3">Because they already paid $10 earlier, the system will only charge them the <strong>difference ($2)</strong>. Once they pay that $2, their total bid is upgraded to $12, and they shoot right back up to the #1 spot!</p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            ?? 4. Content Guidelines
          </h2>
          <p>We accept SaaS apps, developer tools, newsletters, portfolios, and social links. The minimum bid to enter the board is $1. We reserve the right to remove any illegal, malicious, or highly inappropriate links without refund.</p>
        </section>

      </div>
    </div>
  );
}

