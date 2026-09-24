import Link from 'next/link';
import { NETWORK_LABEL } from '@/lib/network';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top-grid">
        {/* Brand & Overview */}
        <div className="footer-brand-col">
          <Link href="/" className="brand" aria-label="AfterHours home">
            <img
              src="/logo.png"
              alt="AfterHours logo"
              width={34}
              height={34}
              style={{ borderRadius: '6px', objectFit: 'cover' }}
            />
            <span>
              <strong>AfterHours</strong>
              <small>Tokenized stock intelligence on Solana</small>
            </span>
          </Link>
          <p className="footer-desc">
            24/7 intelligent market monitoring and risk governor for tokenized equities on Solana.
            Detecting price divergence, explaining market regimes, enforcing risk bounds, and executing on-chain actions.
          </p>
          <div className="footer-status">
            <span className="source-badge source-live">{NETWORK_LABEL}</span>
            <span className="pyth-badge pyth-live">⬡ Pyth Oracles Active</span>
          </div>
        </div>

        {/* Product Navigation */}
        <div className="footer-links-col">
          <div className="footer-col-title">PRODUCT</div>
          <Link href="/">Dashboard</Link>
          <Link href="/gaps">Gap Radar</Link>
          <Link href="/markets">PreStocks Markets</Link>
          <Link href="/proof">Solana Proofs</Link>
          <Link href="/activity">Activity Audit Trail</Link>
        </div>

        {/* Pre-IPO Markets */}
        <div className="footer-links-col">
          <div className="footer-col-title">PRE-IPO MARKETS</div>
          <Link href="/assets/ANTHROPIC">Anthropic (ANTHROPIC)</Link>
          <Link href="/assets/SPACEX">SpaceX (SPACEX)</Link>
          <Link href="/assets/OPENAI">OpenAI (OPENAI)</Link>
          <Link href="/assets/ANDURIL">Anduril (ANDURIL)</Link>
          <Link href="/assets/NEURALINK">Neuralink (NEURALINK)</Link>
        </div>

        {/* Protocol & Developers */}
        <div className="footer-links-col">
          <div className="footer-col-title">GOVERNANCE & DATA</div>
          <a href="https://github.com/Tajudeeen/afterhour" target="_blank" rel="noreferrer">
            GitHub Repository ↗
          </a>
          <a href="https://pyth.network" target="_blank" rel="noreferrer">
            Pyth Network Oracles ↗
          </a>
          <a href="https://prestocks.com" target="_blank" rel="noreferrer">
            PreStocks API ↗
          </a>
          <a href="https://solana.com" target="_blank" rel="noreferrer">
            Solana Mainnet ↗
          </a>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div>
          <strong style={{ color: 'var(--ink-heading)', fontFamily: 'var(--mono)', fontSize: '1rem' }}>
            Discover. Compare. Validate. Execute.
          </strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            Market Intelligence explains. The Risk Governor enforces. The human approves. Solana settles.
          </p>
        </div>
        <div className="footer-copyright">
          <span>© 2026 AfterHours Protocol · Stocklana_ Edition</span>
          <div className="sponsor-bar">
            <span className="sponsor-item">
              <span className="sponsor-dot" style={{ background: '#7B61FF' }} />
              Pyth Oracles
            </span>
            <span className="sponsor-item">
              <span className="sponsor-dot" style={{ background: '#9945FF' }} />
              Solana Mainnet
            </span>
            <span className="sponsor-item">
              <span className="sponsor-dot" style={{ background: '#56c0aa' }} />
              PreStocks DEX
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
