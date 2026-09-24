'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch {
    pathname = '';
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/gaps', label: 'Gap Radar' },
    { href: '/markets', label: 'Markets' },
    { href: '/proof', label: 'Solana Proof' },
    { href: '/activity', label: 'Activity' },
    { href: 'https://github.com/Tajudeeen/afterhour', label: 'Documentation', external: true },
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="AfterHours home">
        <img
          src="/logo.png"
          alt="AfterHours logo"
          width={36}
          height={36}
          style={{ borderRadius: '8px', objectFit: 'cover' }}
        />
        <span>
          <strong>AfterHours</strong>
          <small>Tokenized stock intelligence on Solana</small>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="site-nav desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) =>
          item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
              {item.label} ↗
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active-nav-link' : ''}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        <ThemeToggle />

        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Collapsible Navigation Menu Bar / Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-nav-drawer"
            onClick={(e) => e.stopPropagation()}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">MENU</span>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="mobile-nav-links">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    <span className="external-arrow">↗</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    {pathname === item.href && <span className="active-dot">●</span>}
                  </Link>
                )
              )}
            </div>
            <div className="mobile-nav-footer">
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
