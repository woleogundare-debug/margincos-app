import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { PublicNav } from '../../components/layout/PublicNav';
import { PublicFooter } from '../../components/layout/PublicFooter';

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
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        author: data.author || '',
        category: data.category || '',
        readTime: data.readTime || '',
        slug: data.slug || params.slug,
      },
      mdxSource,
    },
  };
}

export default function BlogPost({ frontmatter, mdxSource }) {
  const { title, description, date, author, category, readTime, slug } = frontmatter;

  return (
    <>
      <Head>
        <title>{title} — MarginCOS</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://margincos.com/blog/${slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://margincos.com/blog/${slug}`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />
      </Head>
      <PublicNav />

      {/* Article header */}
      <section className="hero-mesh pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center text-sm text-white/60 hover:text-white mb-6 transition-colors">
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
          {author && (
            <p className="mt-4 text-sm text-white/60">By {author}</p>
          )}
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-lg prose-slate max-w-none
          prose-headings:font-display prose-headings:text-navy prose-headings:font-bold
          prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-p:text-slate-600 prose-p:leading-relaxed
          prose-a:text-teal prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
          prose-strong:text-navy
          prose-li:text-slate-600
          prose-ul:my-4 prose-li:my-1
          prose-hr:border-slate-200 prose-hr:my-10">
          <MDXRemote {...mdxSource} />
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-navy rounded-xl text-center">
          <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to close the margin gap?
          </h3>
          <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
            Get a free diagnostic of your portfolio's cost pass-through rate and pricing opportunities.
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
