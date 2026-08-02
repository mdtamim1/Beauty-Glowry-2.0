'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, User, ArrowRight, Sparkles, Tag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image: string;
  author: string;
  tags: string[];
  created_at: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blog')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching blogs:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface, #1A1A17)',
          borderBottom: '1px solid var(--border-default, rgba(255,255,255,0.07))',
          padding: '80px 0 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background text */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(80px, 15vw, 180px)',
            fontWeight: 700,
            color: 'var(--text-primary, #F0EBE3)',
            opacity: 0.02,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            letterSpacing: '0.05em',
          }}
        >
          JOURNAL
        </div>

        <div className="container-lg" style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent, #C9956D)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={12} /> Clinical Insights
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(32px, 6vw, 54px)',
              fontWeight: 400,
              color: 'var(--text-primary, #F0EBE3)',
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            The Glowry Edit
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-muted, #B0A8A0)',
              maxWidth: 580,
              lineHeight: 1.7,
            }}
          >
            Science-backed formulations, dermatological guides, and clinical analyses of skincare active ingredients. Explore the science behind healthy, radiant skin.
          </p>
        </div>
      </div>

      {/* ── Blog Grid Section ────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-base, #0F0F0D)',
          paddingTop: 60,
          paddingBottom: 100,
          minHeight: '400px',
        }}
      >
        <div className="container-lg">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 30 }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface, #1A1A17)',
                    border: '1px solid var(--border-default, rgba(255,255,255,0.07))',
                    borderRadius: 12,
                    height: 420,
                    opacity: 0.6,
                    animation: 'pulse 1.8s infinite ease-in-out',
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #B0A8A0)' }}>
              <p style={{ fontSize: 16, marginBottom: 16 }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent, #C9956D)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted, #B0A8A0)' }}>
              <BookOpen size={48} style={{ color: 'var(--accent, #C9956D)', marginBottom: 16, opacity: 0.7 }} />
              <p style={{ fontSize: 16 }}>No clinical articles found in database.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 32 }}>
              {posts.map((post) => {
                const isHovered = hoveredId === post.id;
                const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                
                // Reading time approximation
                const words = post.content.split(/\s+/).length;
                const readTime = Math.max(1, Math.ceil(words / 200));

                return (
                  <article
                    key={post.id}
                    onMouseEnter={() => setHoveredId(post.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: 'var(--bg-surface, #1A1A17)',
                      border: `1.5px solid ${isHovered ? 'var(--accent, #C9956D)' : 'var(--border-default, rgba(255,255,255,0.07))'}`,
                      borderRadius: 14,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'translateY(-6px)' : 'none',
                      boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {/* Cover image container */}
                    <Link href={`/blog/${post.slug}`} style={{ overflow: 'hidden', position: 'relative', display: 'block', height: 210 }}>
                      <img
                        src={post.cover_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600'}
                        alt={post.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))',
                        }}
                      />
                    </Link>

                    {/* Content area */}
                    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Meta information */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: 'var(--text-muted, #B0A8A0)', marginBottom: 12, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} style={{ color: 'var(--accent, #C9956D)' }} />
                          {post.author}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} style={{ color: 'var(--accent, #C9956D)' }} />
                          {readTime} min read
                        </span>
                        <span>{formattedDate}</span>
                      </div>

                      {/* Title */}
                      <h2 style={{ marginBottom: 12, lineHeight: 1.3 }}>
                        <Link
                          href={`/blog/${post.slug}`}
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 21,
                            fontWeight: 500,
                            color: isHovered ? 'var(--accent, #C9956D)' : 'var(--text-primary, #F0EBE3)',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {post.title}
                        </Link>
                      </h2>

                      {/* Summary */}
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: 'var(--text-muted, #B0A8A0)',
                          marginBottom: 18,
                          flex: 1,
                        }}
                      >
                        {post.summary}
                      </p>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-default, rgba(255,255,255,0.07))',
                              padding: '2px 8px',
                              borderRadius: 4,
                              color: 'var(--text-muted, #B0A8A0)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Tag size={8} style={{ color: 'var(--accent, #C9956D)' }} /> {tag}
                          </span>
                        ))}
                      </div>

                      {/* Read More button */}
                      <Link
                        href={`/blog/${post.slug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--accent, #C9956D)',
                          textDecoration: 'none',
                          alignSelf: 'flex-start',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Read Article <ArrowRight size={12} style={{ transition: 'transform 0.2s', transform: isHovered ? 'translateX(4px)' : 'none' }} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
