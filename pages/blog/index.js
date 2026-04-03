import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PublicNav } from '../../components/layout/PublicNav';
import { PublicFooter } from '../../components/layout/PublicFooter';

export async function getStaticProps() {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  const posts = files.map(filename => {
    const raw = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data } = matter(raw);
    return {
      slug: data.slug || filename.replace(/\.mdx$/, ''),
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      author: data.author || '',
      category: data.category || '',
      readTime: data.readTime || '',
    };
  });

  posts.sort((a, b) => (b.date > a.date ? 1 : -1));

  return { props: { posts } };
}

export default function BlogIndex({ posts }) {
  return (
    <>
      <Head>
        <title>Insights — MarginCOS</title>
        <meta name="description" content="Articles on margin recovery, pricing intelligence, and commercial strategy for FMCG and manufacturing businesses." />
        <link rel="canonical" href="https://margincos.com/blog" />
        <meta property="og:title" content="Insights — MarginCOS" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://margincos.com/blog" />
        <meta property="og:description" content="Articles on margin recovery, pricing intelligence, and commercial strategy for FMCG and manufacturing businesses." />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Insights — MarginCOS" />
        <meta name="twitter:description" content="Articles on margin recovery, pricing intelligence, and commercial strategy for FMCG and manufacturing businesses." />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />
      </Head>
      <PublicNav />

      {/* Hero */}
      <section className="hero-mesh pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-snug md:leading-[1.15]">
            Insights
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Practical thinking on margin recovery, pricing intelligence, and commercial strategy for Nigerian businesses.
          </p>
        </div>
      </section>

      {/* Article grid */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-8">
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group block bg-white rounded-xl border border-slate-200 hover:border-teal/40 hover:shadow-lg transition-all p-6 md:p-8">
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                {post.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal font-medium text-[11px]">
                    {post.category}
                  </span>
                )}
                <span>{post.date}</span>
                {post.readTime && <span>{post.readTime}</span>}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-navy group-hover:text-teal transition-colors leading-tight">
                {post.title}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {post.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-teal group-hover:underline">
                Read article →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
