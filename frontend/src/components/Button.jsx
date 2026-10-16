import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Button({ children, href = '#animals', variant = 'primary', arrow = true }) {
  return <a className={`button button--${variant}`} href={href}>{children}{arrow && <ArrowUpRight size={18} strokeWidth={2.1} />}</a>;
}
