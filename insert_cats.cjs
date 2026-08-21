const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const newCategories = [
    { name: 'Socials', slug: 'socials' },
    { name: 'Creators', slug: 'creators' },
    { name: 'Portfolios', slug: 'portfolios' },
    { name: 'Newsletters', slug: 'newsletters' },
    { name: 'Communities', slug: 'communities' },
  ];

  for (const cat of newCategories) {
    const { data, error } = await supabase.from('categories').insert(cat).select();
    if (error) console.error("Error inserting", cat.name, error.message);
    else console.log("Inserted", cat.name);
  }
}
run();
