'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, User, Calendar, Tag, ChevronLeft, AlertCircle } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

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

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params || !params.slug) return;
    
    fetch(`/api/blog/${params.slug}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Article not found');
          throw new Error('Failed to load article');
        }
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching blog detail:', err);
        setError(err.message || 'Failed to load the article.');
        setLoading(false);
      });
  }, [params]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ background: 'var(--bg-base, #0F0F0D)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid rgba(201,149,109,0.1)', borderTopColor: 'var(--accent, #C9956D)', animation: 'spin 1s infinite linear' }} />
        </div>
        <Footer />
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navbar />
        <div style={{ background: 'var(--bg-base, #0F0F0D)', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', color: 'var(--text-muted, #B0A8A0)' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger, #E05A5A)', marginBottom: 16 }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: 'var(--text-primary, #F0EBE3)', marginBottom: 10 }}>Article Not Found</h2>
          <p style={{ fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>{error || 'The article you are looking for does not exist or has been removed.'}</p>
          <Link
            href="/blog"
            style={{
              padding: '10px 24px',
              background: 'var(--accent, #C9956D)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ArrowLeft size={16} /> Back to Journal
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const words = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <>
      <Navbar />

      <div style={{ background: 'var(--bg-base, #0F0F0D)', color: 'var(--text-primary, #F0EBE3)', minHeight: '100vh', paddingBottom: 100 }}>
        {/* ── Breadcrumbs / Back button ──────────────────────────────────── */}
        <div className="container-lg" style={{ paddingTop: 40, paddingBottom: 20 }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted, #B0A8A0)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent, #C9956D)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #B0A8A0)')}
          >
            <ChevronLeft size={16} /> Back to Journal
          </Link>
        </div>

        {/* ── Article Header ─────────────────────────────────────────────── */}
        <header className="container-lg" style={{ maxWidth: 840, marginBottom: 40 }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(201,149,109,0.08)',
                  border: '1px solid rgba(201,149,109,0.2)',
                  padding: '3px 10px',
                  borderRadius: 4,
                  color: 'var(--accent, #C9956D)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(28px, 5vw, 46px)',
              fontWeight: 400,
              lineHeight: 1.15,
              color: 'var(--text-primary, #F0EBE3)',
              marginBottom: 20,
            }}
          >
            {post.title}
          </h1>

          {/* Summary / Sub-headline */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--text-muted, #B0A8A0)',
              marginBottom: 24,
              fontStyle: 'italic',
              borderLeft: '2px solid var(--accent, #C9956D)',
              paddingLeft: 16,
            }}
          >
            {post.summary}
          </p>

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              fontSize: 12,
              color: 'var(--text-muted, #B0A8A0)',
              borderTop: '1px solid var(--border-default, rgba(255,255,255,0.07))',
              borderBottom: '1px solid var(--border-default, rgba(255,255,255,0.07))',
              padding: '16px 0',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} style={{ color: 'var(--accent, #C9956D)' }} />
              <span>By <strong style={{ color: 'var(--text-primary, #F0EBE3)' }}>{post.author}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} style={{ color: 'var(--accent, #C9956D)' }} />
              <span>Published on {formattedDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ color: 'var(--accent, #C9956D)' }} />
              <span>{readTime} minute read</span>
            </div>
          </div>
        </header>

        {/* ── Cover Image ────────────────────────────────────────────────── */}
        <div
          className="container-lg"
          style={{
            maxWidth: 840,
            height: 'clamp(240px, 45vh, 480px)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 50,
          }}
        >
          <img
            src={post.cover_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800'}
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* ── Article Content ────────────────────────────────────────────── */}
        <article className="container-lg" style={{ maxWidth: 720 }}>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.85,
              color: 'var(--text-primary, #F0EBE3)',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.01em',
            }}
          >
            {/* Simple paragraph formatting */}
            {post.content.split('\n\n').map((paragraph, index) => {
              if (!paragraph.trim()) return null;
              return (
                <p key={index} style={{ marginBottom: 24 }}>
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Author Callout Box */}
          <div
            style={{
              marginTop: 60,
              padding: '30px 32px',
              background: 'var(--bg-surface, #1A1A17)',
              border: '1px solid var(--border-default, rgba(255,255,255,0.07))',
              borderRadius: 12,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--accent, #C9956D)25',
                color: 'var(--accent, #C9956D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {post.author.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent, #C9956D)', marginBottom: 4 }}>About The Author</p>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #F0EBE3)', marginBottom: 6 }}>{post.author}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted, #B0A8A0)', lineHeight: 1.5 }}>
                Clinical contributor to Beauty Glowry. Dedicated to simplifying dermatological research and active ingredient sciences.
              </p>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </>
  );
}
