import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './homepage.css';
import { Calendar, PenTool, ClipboardList, User, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function Homepage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="new-hp-page">
      {/* Navbar */}
      <nav className={`new-hp-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="new-hp-nav-container">
          <div className="new-hp-brand">
            <div className="new-hp-logo">
              <span className="logo-text1">SLIIT</span>
              <span className="logo-text2">UNI</span>
            </div>
            <span className="new-hp-brand-name">SmartCampus</span>
          </div>

          <div className="new-hp-nav-links">
            <a href="#" className="active">Home</a>
            <a href="#">Resources</a>
            <a href="#">Bookings</a>
            <a href="#">Tickets</a>
            <a href="#">About</a>
          </div>

          <div className="new-hp-nav-actions">
            <Link to="/login" className="new-hp-btn new-hp-btn-glass">
              Login/Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="new-hp-hero">
        <div className="new-hp-hero-overlay"></div>
        <div className="new-hp-hero-content">
          <h1>Your Campus, Redefined</h1>
          <p>
            Experience seamless campus operations with the new smart hub.<br/>
            Book resources, report issues, and stay connected effortlessly.
          </p>
          <div className="new-hp-hero-buttons">
            <Link to="/login" className="new-hp-btn new-hp-btn-orange new-hp-btn-large">
              Book a Resource <ArrowUpRight size={18} />
            </Link>
            <Link to="/login" className="new-hp-btn new-hp-btn-glass new-hp-btn-large">
              Report an Issue <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="new-hp-hero-features">
            <span><CheckCircle size={16} /> Free for all students</span>
            <span><CheckCircle size={16} /> AI-powered assistance</span>
            <span><CheckCircle size={16} /> Secure and verified</span>
          </div>
        </div>
      </header>

      {/* Quick Features Section */}
      <section className="new-hp-features">
        <h2>Quick Features</h2>
        <div className="new-hp-features-grid">
          <div className="new-hp-feature-card">
            <div className="new-hp-icon-wrapper">
              <Calendar size={32} />
            </div>
            <h3>Bookings</h3>
            <p>Reserve study rooms, labs, and equipment quickly.</p>
          </div>
          
          <div className="new-hp-feature-card">
            <div className="new-hp-icon-wrapper">
              <PenTool size={32} />
            </div>
            <h3>Maintenance</h3>
            <p>Report and track campus issues instantly.</p>
          </div>
          
          <div className="new-hp-feature-card">
            <div className="new-hp-icon-wrapper">
              <ClipboardList size={32} />
            </div>
            <h3>Resources</h3>
            <p>Access essential student materials and guides.</p>
          </div>
          
          <div className="new-hp-feature-card">
            <div className="new-hp-icon-wrapper">
              <User size={32} />
            </div>
            <h3>Profile</h3>
            <p>Manage your account and preferences easily.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="new-hp-footer">
        <p>© 2024 SmartCampus. All rights reserved.</p>
      </footer>
    </div>
  );
}
