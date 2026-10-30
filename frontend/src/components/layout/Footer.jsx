import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200/70 bg-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-ink-500">
            Multimodal material identification and EcoImpact intelligence. Results are AI estimates with explicit uncertainty; disposal advice is general guidance — always check local rules.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link className="hover:text-brand-700" to="/analyze">New analysis</Link></li>
            <li><Link className="hover:text-brand-700" to="/materials">Material library</Link></li>
            <li><Link className="hover:text-brand-700" to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Project</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link className="hover:text-brand-700" to="/about">About & methodology</Link></li>
            <li><a className="hover:text-brand-700" href="https://www.epa.gov/recycle" target="_blank" rel="noreferrer">EPA recycling basics</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">© {new Date().getFullYear()} MaterialTruth AI</div>
    </footer>
  );
}
