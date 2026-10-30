import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center px-4">
      <div className="animate-fadeUp">
        <p className="font-display text-8xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-ink-500">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex" id="notfound-home"><ArrowLeft size={16} /> Go home</Link>
      </div>
    </div>
  );
}
