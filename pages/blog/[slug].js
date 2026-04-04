import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { PublicNav } from '../../components/layout/PublicNav';
import { PublicFooter } from '../../components/layout/PublicFooter';
import PassThroughChart from '../../components/blog/PassThroughChart';
import MarginLeakageChart from '../../components/blog/MarginLeakageChart';
import RRPFloorChart from '../../components/blog/RRPFloorChart';
import RepricingGapChart from '../../components/blog/RepricingGapChart';
import DieselCostChart from '../../components/blog/DieselCostChart';
import LaneCostFloorChart from '../../components/blog/LaneCostFloorChart';
import FleetGapChart from '../../components/blog/FleetGapChart';
import ArticleActions from '../../components/blog/ArticleActions';
import PassThroughBenchmarkChart from '../../components/blog/PassThroughBenchmarkChart';
import PortfolioDistributionChart from '../../components/blog/PortfolioDistributionChart';
import BoardPresentationChart from '../../components/blog/BoardPresentationChart';

export async function getStaticPaths() {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  const paths = files.map(filename => {
    const raw = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data } = matter(raw);
    return { params: { slug: data.slug || filename.replace(/\.mdx$/, '') } };
  });

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  let matchedFile = null;
  for (const filename of files) {
    const raw = fs.readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data } = matter(raw);
    const slug = data.slug || filename.replace(/\.mdx$/, '');
    if (slug === params.slug) {
      matchedFile = { raw, data };
      break;
    }
  }

  if (!matchedFile) return { notFound: true };

  const { raw, data } = matchedFile;
  const { content } = matter(raw);
  const mdxSource = await serialize(content);

  return {
    props: {
      frontmatter: {
        title:       data.title       || '',
        description: data.description || '',
        excerpt:     data.excerpt     || data.description || '',
        date:        data.date        || '',
        author:      data.author      || '',
        category:    data.category    || '',
        readTime:    data.readTime    || '',
        slug:        data.slug        || params.slug,
      },
      mdxSource,
    },
  };
}

export default function BlogPost({ frontmatter, mdxSource }) {
  const { title, description, excerpt, date, author, category, readTime, slug } = frontmatter;
  const metaDescription = excerpt || description;

  const mdxComponents = { PassThroughChart, MarginLeakageChart, RRPFloorChart, RepricingGapChart, DieselCostChart, LaneCostFloorChart, FleetGapChart, PassThroughBenchmarkChart, PortfolioDistributionChart, BoardPresentationChart };

  return (
    <>
      <Head>
        <title>{title} — MarginCOS</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://margincos.com/blog/${slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://margincos.com/blog/${slug}`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`https://margincos.com/blog/${slug}-og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={`https://margincos.com/blog/${slug}-og.png`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "description": metaDescription,
          "datePublished": date,
          "author": { "@type": "Organization", "name": "Carthena Advisory", "url": "https://carthenaadvisory.com" },
          "publisher": { "@type": "Organization", "name": "MarginCOS", "url": "https://margincos.com" },
          "mainEntityOfPage": `https://margincos.com/blog/${slug}`,
          "image": `https://margincos.com/blog/${slug}-og.png`,
        }) }} />
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { font-size: 12pt; color: #000; background: #fff; }
            .hero-mesh { background: #fff !important; padding-top: 2rem !important; }
            h1 { color: #000 !important; font-size: 22pt !important; }
            .rounded-2xl { border-radius: 0 !important; box-shadow: none !important; }
          }
        `}</style>
      </Head>

      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-mesh pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center text-sm text-white/60 hover:text-white mb-6 transition-colors no-print">
            ← Back to Insights
          </Link>
          <div className="flex items-center gap-3 text-xs text-white/60 mb-4">
            {category && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-medium text-[11px]">
                {category}
              </span>
            )}
            <span>{date}</span>
            {readTime && <span>{readTime}</span>}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-snug md:leading-[1.15]">
            {title}
          </h1>
        </div>
      </section>

      {/* ── Byline + Actions bar (hidden in print) ────────────── */}
      <div className="no-print px-6 border-b" style={{ borderColor: '#E8ECF0', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-6 py-5">

          {/* Author byline */}
          <div style={{ lineHeight: 1.4 }}>
            {author ? (
              <>
                <p className="text-sm" style={{ color: '#2A3A4A' }}>
                  By{' '}
                  <span
                    className="font-semibold"
                    style={{
                      textDecoration: 'underline',
                      textDecorationColor: '#C8D0D8',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    {author}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#8896A7' }}>
                  Founder &middot; Carthena Advisory &amp; MarginCOS
                </p>
              </>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8896A7' }}>
                MarginCOS
              </p>
            )}
          </div>

          {/* Share / Download / Save */}
          <ArticleActions title={title} slug={slug} />
        </div>
      </div>

      {/* ── Article content ───────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-3 md:px-6 py-12">
        <div id="article-content" className="bg-white rounded-2xl px-5 md:px-14 py-12">

          {/* McKinsey-style editorial lede */}
          {excerpt && (
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.2rem',
              lineHeight: 1.75,
              color: '#1B2A4A',
              borderLeft: '3px solid #0D8F8F',
              paddingLeft: '1.25rem',
              marginBottom: '2.5rem',
              fontWeight: 400,
            }}>
              {excerpt}
            </p>
          )}

          <style global jsx>{`
            .article-body > * + * { margin-top: 1.5rem; }
            .article-body p {
              font-size: 17px;
              line-height: 1.85;
              color: #2A3A4A;
              margin-bottom: 1.5rem;
            }
            .article-body h2 {
              font-family: 'Playfair Display', Georgia, serif !important;
              font-size: 1.6rem !important;
              font-weight: 700 !important;
              color: #1B2A4A !important;
              margin-top: 3rem !important;
              margin-bottom: 1rem !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .article-body h3 {
              font-size: 1.15rem !important;
              font-weight: 600 !important;
              color: #1B2A4A !important;
              margin-top: 2rem !important;
              margin-bottom: 0.75rem !important;
              display: block !important;
            }
            .article-body ul {
              list-style: disc !important;
              margin-left: 1.75rem !important;
              margin-bottom: 1.5rem !important;
            }
            .article-body li {
              font-size: 17px;
              line-height: 1.85;
              color: #2A3A4A;
              margin-bottom: 0.6rem !important;
            }
            .article-body strong { color: #1B2A4A; font-weight: 600; }
            .article-body em { color: #5A6B80; }
            .article-body a { color: #C0392B; font-weight: 600; text-decoration: none; }
            .article-body a:hover { text-decoration: underline; }
            .article-body hr {
              border: none !important;
              border-top: 1px solid #E5E8EC !important;
              margin: 2.5rem 0 !important;
            }
            .article-body blockquote {
              border-left: 3px solid #0D8F8F;
              padding: 0.75rem 1.25rem;
              margin: 1.5rem 0;
              background: #F4F6F8;
              border-radius: 0 8px 8px 0;
              color: #3A5068;
              font-style: italic;
            }
            .stat-card {
              background: #1B2A4A;
              border-radius: 16px;
              padding: 32px;
              margin: 2.5rem 0;
            }
            .stat-bar-label { font-size: 14px; color: #A8B8CC; margin-bottom: 6px; }
            .stat-bar-track {
              background: rgba(255,255,255,0.1);
              border-radius: 6px;
              height: 12px;
              margin-bottom: 20px;
              overflow: hidden;
            }
            .stat-bar-fill { height: 12px; border-radius: 6px; transition: width 0.6s ease; }
          `}</style>

          <div className="article-body">
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </div>
        </div>

        {/* CTA — hidden in print */}
        <div className="no-print mt-16 p-8 bg-navy rounded-xl text-center">
          <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to close the margin gap?
          </h3>
          <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
            Get a free diagnostic of your portfolio&apos;s cost pass-through rate and pricing opportunities.
          </p>
          <Link href="/contact"
            className="inline-block px-6 py-3 bg-red-brand text-white text-sm font-semibold rounded-lg hover:bg-red-light transition-all">
            Request a Diagnostic →
          </Link>
        </div>
      </article>

      <PublicFooter />
    </>
  );
}
