import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-solar-slate mb-4">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home size={14} />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={14} className="text-gray-300" />
          {item.path ? (
            <Link to={item.path} className="hover:text-primary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-solar-navy font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
