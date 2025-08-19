export interface Post {
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
}

const posts: Post[] = [
  {
    slug: 'understanding-your-meesho-payments',
    title: 'Understanding Your Meesho Payments: A Deep Dive',
    author: 'The SellerAnalytics Team',
    date: '2024-07-15',
    excerpt: 'Settlement values, return costs, and claims can be confusing. We break down the key components of your Meesho payment report so you can understand exactly where your money is going.',
    content: `
      <p>The Meesho payment report is the most critical document for understanding your business's financial health. However, its many columns can be daunting. Let's break down the most important ones:</p>
      <ul>
        <li><strong>Settlement Value:</strong> This is the final amount Meesho credits to you for an order after all their fees are deducted. It's your gross earning for that order.</li>
        <li><strong>Return Cost:</strong> When a product is returned by a customer or fails delivery (RTO), Meesho charges various fees for reverse shipping and processing. This column captures that cost.</li>
        <li><strong>Claim Amount:</strong> If you file a claim for a lost or damaged product and it's approved, this is the amount Meesho reimburses you. It's a credit back to your account.</li>
        <li><strong>GST, TDS, TCS:</strong> These are tax-related deductions and collections that are crucial for your financial accounting.</li>
      </ul>
      <p>Our tool automatically aggregates these values to calculate your net profit: (Total Settlement + Total Claims) - (Total Return Costs) - (Your Product Costs). This gives you a clear picture of your bottom line.</p>
    `,
  },
  {
    slug: 'top-3-reasons-for-high-returns',
    title: 'The Top 3 Reasons for High Returns on Meesho and How to Fix Them',
    author: 'The SellerAnalytics Team',
    date: '2024-07-10',
    excerpt: 'High return rates can destroy your profitability. We analyze the most common return reasons and offer actionable strategies to reduce them.',
    content: `
      <p>Returns are a part of e-commerce, but high return rates are a silent profit killer. By analyzing thousands of orders, we've identified the top 3 culprits:</p>
      <ol>
        <li><strong>Quality Issues:</strong> This is the most damaging reason. It not only costs you money but also hurts your brand reputation. <strong>Fix:</strong> Implement a strict quality check before dispatching any product. Source from reliable manufacturers and be transparent about material quality in your descriptions.</li>
        <li><strong>Incorrect Size/Fit:</strong> Particularly common in fashion categories. <strong>Fix:</strong> Provide a detailed, accurate size chart with measurements in inches or centimeters. Use model photos showing the item on different body types if possible.</li>
        <li><strong>Product Not as Described:</strong> Mismatched colors or features lead to disappointed customers. <strong>Fix:</strong> Use high-quality, true-to-life product photos under good lighting. Write clear, honest descriptions of features, materials, and what's included.</li>
      </ol>
      <p>Use the "Returns" dashboard in our tool to identify which of your products suffer from these issues and take corrective action.</p>
    `,
  },
   {
    slug: '5-common-mistakes-new-sellers-make',
    title: '5 Common Mistakes New Meesho Sellers Make (And How to Avoid Them)',
    author: 'The SellerAnalytics Team',
    date: '2024-06-28',
    excerpt: 'Starting on Meesho is exciting, but pitfalls are common. Learn to avoid these five frequent mistakes to set your business up for success from day one.',
    content: `
      <p>Every successful seller has a learning curve. Here are five common mistakes to watch out for:</p>
      <ol>
        <li><strong>Ignoring Product Costs:</strong> Selling products without knowing your exact cost price is a recipe for disaster. You might be losing money on every sale! <strong>Fix:</strong> Always calculate your Cost of Goods Sold (COGS) before setting a price.</li>
        <li><strong>Not Analyzing Return Data:</strong> Simply accepting returns isn't enough. You need to know WHY products are coming back. <strong>Fix:</strong> Regularly check your return reasons in our dashboard. A product with a 40% return rate for "poor quality" needs to be re-evaluated or delisted.</li>
        <li><strong>Competing Only on Price:</strong> Being the cheapest isn't always the best strategy. It can lead to razor-thin margins and attract price-sensitive customers who are more likely to return items. <strong>Fix:</strong> Focus on quality, good photos, and clear descriptions to build value.</li>
        <li><strong>Poor Inventory Management:</strong> Stocking out of your best-selling items means leaving money on the table. Overstocking slow-movers ties up your capital. <strong>Fix:</strong> Use sales data to forecast demand for your top products.</li>
        <li><strong>Neglecting Packaging:</strong> Flimsy packaging can lead to in-transit damage, resulting in returns and negative reviews. <strong>Fix:</strong> Invest in sturdy, appropriate packaging for your items. It's a small cost that protects your profit and reputation.</li>
      </ol>
    `,
  },
  {
    slug: 'is-your-packaging-costing-you-sales',
    title: 'Is Your Packaging Costing You Sales? A Guide to Smart Packaging',
    author: 'The SellerAnalytics Team',
    date: '2024-06-15',
    excerpt: 'Packaging is more than just a box. It protects your product, represents your brand, and impacts your bottom line. Are you getting it right?',
    content: `
      <p>Many sellers see packaging as a pure cost center, but smart packaging is an investment that pays off. Here's what to consider:</p>
      <h3>1. Protection vs. Cost</h3>
      <p>The primary job of packaging is to get the product to the customer safely. Damaged items lead to returns, negative reviews, and financial loss. Find the sweet spot between durable materials and cost-effectiveness. A slightly more expensive, sturdy mailer bag can be cheaper than one returned product.</p>
      <h3>2. Weight and Dimensions</h3>
      <p>Shipping costs are often calculated based on volumetric weight. Over-sized packaging can significantly increase your shipping fees, eating directly into your profit margin. Use packaging that fits your product snugly without being too tight.</p>
      <h3>3. Unboxing Experience</h3>
      <p>While not essential for every product, a positive unboxing experience can lead to better reviews and repeat customers. Even a simple 'Thank You' note or a branded sticker can make a difference and elevate your store above the competition.</p>
      <h3>4. Calculating Packaging Costs</h3>
      <p>Don't forget to include all packaging costs in your product's COGS. This includes the box/mailer, tape, bubble wrap, labels, and any inserts. Our tool allows you to input a 'Packaging Cost' per SKU for precise profit calculation.</p>
    `,
  },
];

export function getAllPosts(): Post[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find(post => post.slug === slug);
}
