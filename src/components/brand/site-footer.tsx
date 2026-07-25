import { Link } from "@tanstack/react-router";
import { WordMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <WordMark />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Your personal AI career coach. Navigate your future with confidence.
            </p>
            <p className="mt-4 font-display text-sm italic text-foreground">
              "Success Delayed Is Not Success Denied."
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/about" className="text-foreground hover:text-primary">About</Link></li>
              <li><Link to="/soaria" className="text-foreground hover:text-primary">Meet Soaria</Link></li>
              <li><Link to="/features" className="text-foreground hover:text-primary">Features</Link></li>
              <li><Link to="/reflection" className="text-foreground hover:text-primary">Reflection Corner</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/faq" className="text-foreground hover:text-primary">FAQ</Link></li>
              <li><Link to="/contact" className="text-foreground hover:text-primary">Contact</Link></li>
              <li><Link to="/privacy" className="text-foreground hover:text-primary">Privacy</Link></li>
              <li><Link to="/terms" className="text-foreground hover:text-primary">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} CareerPilot AI. All rights reserved.</p>
          <p>
            Designed, developed & owned by{" "}
            <span className="font-medium text-foreground">Akhona Pacwana</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
