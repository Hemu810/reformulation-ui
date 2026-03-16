import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-logo">Reform<span>AI</span> — US Reformulation & ANDA Engine</div>
          <div className="footer-copy">© 2025 ReformAI Inc. For research use only. Not legal or regulatory advice.</div>
        </div>
        <div className="footer-links">
          <button className="footer-link">Documentation</button>
          <button className="footer-link">FDA Guidance</button>
          <button className="footer-link">Disclaimer</button>
          <button className="footer-link">Privacy</button>
        </div>
        <div className="footer-right">
          <div className="footer-dot"></div>
          All systems operational
        </div>
      </div>
    </footer>
  );
}