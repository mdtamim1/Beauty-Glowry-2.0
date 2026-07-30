import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ChevronRight } from 'lucide-react';

const Blog = () => {
  const posts = [
    {
      id: 1,
      title: "How to Build a Skincare Routine for Dhaka's Climate",
      excerpt: "Living in a humid city like Dhaka requires a specific approach to skincare. Learn how to manage oil and sweat...",
      image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1000&auto=format&fit=crop",
      date: "Oct 15, 2023",
      author: "Farhana Ahmed",
      category: "Skincare Guide"
    },
    {
      id: 2,
      title: "5 Ingredients to Look for in Your Serum",
      excerpt: "Not all serums are created equal. Discover the powerhouse ingredients that actually make a difference...",
      image: "https://images.unsplash.com/photo-1601049541289-9b1b7abe71a9?q=80&w=1000&auto=format&fit=crop",
      date: "Oct 12, 2023",
      author: "Adnan Chowdhury",
      category: "Ingredient Spotlight"
    },
    {
      id: 3,
      title: "The Importance of Sunscreen Even Indoors",
      excerpt: "Think you don't need SPF inside? Think again. UV rays can penetrate windows and cause premature aging...",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop",
      date: "Oct 10, 2023",
      author: "Sumi Khan",
      category: "Tips & Tricks"
    }
  ];

  return (
    <div className="blog-page">
      <div className="blog-header animate-fade">
        <div className="container">
          <h1>BEAUTY GLOWRY <br /> Beauty Blog</h1>
          <p>Expert advice, skincare guides, and the latest trends from the beauty world.</p>
        </div>
      </div>

      <div className="container section-padding">
        <div className="blog-grid animate-fade">
          {posts.map(post => (
            <article key={post.id} className="blog-card">
              <div className="blog-img">
                <img src={post.image} alt={post.title} />
                <span className="blog-cat">{post.category}</span>
              </div>
              <div className="blog-content">
                <div className="blog-meta">
                  <span><Clock size={14} /> {post.date}</span>
                  <span><User size={14} /> By {post.author}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="read-more">
                   Read Full Story <ChevronRight size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="newsletter-section">
         <div className="container">
            <div className="newsletter-card">
               <h2>Never Miss a Post</h2>
               <p>Get weekly beauty tips and exclusive discounts delivered to your inbox.</p>
               <div className="newsletter-input">
                  <input type="email" placeholder="Email address" />
                  <button className="btn btn-primary">Subscribe</button>
               </div>
            </div>
         </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .blog-header { background: var(--secondary); padding: 100px 0; text-align: center; border-bottom: 1px solid var(--border); }
        .blog-header h1 { font-size: 48px; line-height: 1.1; margin-bottom: 24px; color: var(--text-main); }
        .blog-header p { font-size: 18px; color: var(--text-muted); max-width: 600px; margin: 0 auto; }

        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 40px; }
        .blog-card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; transition: var(--transition); }
        .blog-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); border-color: var(--primary-light); }
        
        .blog-img { position: relative; aspect-ratio: 16/9; overflow: hidden; }
        .blog-img img { width: 100%; height: 100%; object-fit: cover; }
        .blog-cat { position: absolute; bottom: 16px; left: 16px; background: white; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; color: var(--primary-dark); }

        .blog-content { padding: 32px; }
        .blog-meta { display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
        .blog-meta span { display: flex; align-items: center; gap: 6px; }
        
        .blog-content h3 { font-size: 22px; margin-bottom: 12px; line-height: 1.4; color: var(--text-main); }
        .blog-content p { color: var(--text-muted); font-size: 15px; margin-bottom: 24px; line-height: 1.6; }
        
        .read-more { display: flex; align-items: center; gap: 4px; font-weight: 700; color: var(--primary-dark); }
        .read-more:hover { gap: 8px; }

        .newsletter-section { padding: 80px 0; background: #fcfcfc; }
        .newsletter-card { background: var(--primary-dark); color: white; border-radius: var(--radius-lg); padding: 80px; text-align: center; }
        .newsletter-card h2 { font-size: 42px; margin-bottom: 12px; }
        .newsletter-card p { opacity: 0.9; margin-bottom: 40px; font-size: 18px; }
        .newsletter-input { display: flex; max-width: 500px; margin: 0 auto; gap: 12px; }
        .newsletter-input input { flex: 1; border-radius: 12px; padding: 0 24px; border: none; height: 56px; color: var(--text-main); font-size: 16px; }
        .newsletter-input .btn-primary { background: var(--text-main); color: white; border: none; }
        .newsletter-input .btn-primary:hover { background: #000; }

        @media (max-width: 768px) {
           .blog-header h1 { font-size: 32px; }
           .blog-grid { grid-template-columns: 1fr; }
           .newsletter-card { padding: 40px 24px; }
           .newsletter-input { flex-direction: column; }
        }
      ` }} />
    </div>
  );
};

export default Blog;
