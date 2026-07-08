"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { POSTS } from "./posts-data";
import { AppIcon } from "@/components/shared/app-icon";

const CATEGORIES = [
  "All",
  "Ads & Growth",
  "Finance",
  "Operations",
  "Customer Analytics",
  "WhatsApp & CRM",
  "AI & Automation",
];

type Post = (typeof POSTS)[0];

function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="rounded-3xl border border-white/10 bg-[#0f1729] overflow-hidden hover:border-[#c0c1ff]/30 transition-all duration-300 hover:-translate-y-1">
        <div className="h-52 relative overflow-hidden">
          <Image
            src={post.image}
            alt={post.image_alt}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/35 to-transparent" />
          <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1326]/75 backdrop-blur-md">
            <AppIcon name={post.icon ?? "blog"} size={22} style={{ color: post.icon_color ?? "#c0c1ff" }} />
          </div>
          <div className="absolute top-4 left-4">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
              style={{ backgroundColor: post.tag_color + "20", color: post.tag_color }}
            >
              {post.category}
            </span>
          </div>
          <div className="absolute top-4 right-4 text-[#464554] text-xs">{post.read_time}</div>
        </div>

        <div className="p-7">
          <p className="text-[#464554] text-xs mb-2">{post.date}</p>
          <h2 className="text-[#dbe2fd] text-xl font-bold leading-snug mb-3 group-hover:text-white transition-colors">
            {post.title}
          </h2>
          <p className="text-[#c7c4d7] text-sm leading-relaxed mb-5">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-[10px] font-bold text-[#0b1326]">
                {post.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-[#dbe2fd] text-xs font-medium">{post.author}</p>
                <p className="text-[#464554] text-[10px]">{post.author_role}</p>
              </div>
            </div>
            <span className="text-[#c0c1ff] text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
              Read →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6 hover:border-[#c0c1ff]/30 transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col overflow-hidden">
        <div className="-mx-6 -mt-6 mb-5 h-32 relative overflow-hidden">
          <Image
            src={post.image}
            alt={post.image_alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/20 to-transparent" />
          <div
            className="absolute bottom-3 left-4 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-[#0b1326]/75 backdrop-blur-md"
          >
            <AppIcon name={post.icon ?? "blog"} size={18} style={{ color: post.icon_color ?? "#c0c1ff" }} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ backgroundColor: post.tag_color + "15", color: post.tag_color }}
          >
            {post.category}
          </span>
          <span className="text-[#464554] text-[10px]">{post.read_time}</span>
        </div>

        <h3 className="text-[#dbe2fd] font-bold text-sm leading-snug mb-2 group-hover:text-white transition-colors flex-1">
          {post.title}
        </h3>
        <p className="text-[#c7c4d7] text-xs leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-[8px] font-bold text-[#0b1326]">
              {post.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <span className="text-[#c7c4d7] text-[10px]">{post.author}</span>
          </div>
          <span className="text-[#464554] text-[10px]">{post.date}</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-[#0b1326]">
      {/* Hero */}
      <section className="pt-24 pb-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 text-[#c0c1ff] text-sm font-medium mb-6">
              <AppIcon name="menu_book" size={15} />
              The GrowthOS Blog
            </div>
            <h1 className="text-5xl font-black text-[#dbe2fd] mb-4">
              Grow your D2C brand{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 50%, #7bd0ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                profitably
              </span>
            </h1>
            <p className="text-[#c7c4d7] text-lg max-w-xl mx-auto">
              Tactics, frameworks, and case studies for India&apos;s ambitious D2C founders. No fluff.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="relative">
              <AppIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464554]" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/40 transition-colors"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-[#c0c1ff] text-[#0b1326]"
                    : "bg-white/[0.05] text-[#c7c4d7] hover:bg-white/[0.08] hover:text-[#dbe2fd]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-4">Featured</p>
            <div className="grid lg:grid-cols-2 gap-6">
              {featured.map((post) => <FeaturedPost key={post.slug} post={post} />)}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {featured.length > 0 && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-4">
                {activeCategory === "All" ? "All Articles" : activeCategory}
              </p>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => <PostCard key={post.slug} post={post} />)}
            </div>
          </div>
        </section>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-24 text-center py-20">
          <AppIcon name="search_off" size={48} className="mx-auto mb-3 text-[#464554]" />
          <p className="text-[#c7c4d7]">No articles found.</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
            className="mt-4 text-[#c0c1ff] text-sm hover:underline"
          >
            Clear filters →
          </button>
        </div>
      )}

      {/* Newsletter */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(192,193,255,0.07) 0%, rgba(221,183,255,0.07) 50%, rgba(123,208,255,0.07) 100%)",
              border: "1px solid rgba(192,193,255,0.15)",
            }}
          >
            <AppIcon name="mark_email_read" size={40} className="mx-auto mb-3 text-[#c0c1ff]" />
            <h2 className="text-2xl font-black text-[#dbe2fd] mb-2">Get the weekly D2C growth brief</h2>
            <p className="text-[#c7c4d7] text-sm mb-6 max-w-md mx-auto">
              One email. The best tactics, case studies, and benchmarks for scaling D2C brands in India.
            </p>
            <div className="flex gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@brand.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-[#dbe2fd] placeholder-[#464554] text-sm focus:outline-none focus:border-[#c0c1ff]/40 transition-colors"
              />
              <button
                className="px-5 py-3 rounded-xl font-semibold text-[#0b1326] text-sm whitespace-nowrap hover:opacity-90 transition-opacity"
                                style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
              >
                Subscribe
              </button>
            </div>
            <p className="text-[#464554] text-[10px] mt-3">No spam. Unsubscribe any time.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
