import { Music2 } from 'lucide-react';
import './valleyPresentation.css';

export function ValleyTitle() {
  return <h1 className="valley-title" aria-label="VALLE DE LAS NOTAS"><Music2 aria-hidden="true"/><span>VALLE<span className="valley-title-small"> DE LAS </span>NOTAS</span><Music2 aria-hidden="true"/></h1>;
}
export function ValleyButton({ children, tone = 'green', className = '', ...props }) {
  return <button className={`valley-button valley-button-${tone} ${className}`} {...props}>{children}</button>;
}
export function ValleyPanel({ children, className = '', ...props }) {
  return <section className={`valley-panel ${className}`} {...props}>{children}</section>;
}
