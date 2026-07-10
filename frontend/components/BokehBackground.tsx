'use client';
import { useState, useEffect } from 'react';

export default function BokehBackground() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 1500ms baad show karo — pehle hero image load ho
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="bokeh-layer fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <span className="bokeh-orb" style={{ width: 340, height: 340, top: '8%',  left: '5%',  animationDuration: '18s', animationDelay: '0s'   }} />
      <span className="bokeh-orb" style={{ width: 200, height: 200, top: '55%', left: '80%', animationDuration: '24s', animationDelay: '-6s'  }} />
      <span className="bokeh-orb" style={{ width: 260, height: 260, top: '30%', left: '60%', animationDuration: '20s', animationDelay: '-3s'  }} />
      <span className="bokeh-orb" style={{ width: 160, height: 160, top: '75%', left: '25%', animationDuration: '28s', animationDelay: '-10s' }} />
      <span className="bokeh-orb" style={{ width: 120, height: 120, top: '15%', left: '75%', animationDuration: '22s', animationDelay: '-8s'  }} />
      <span className="bokeh-orb" style={{ width: 300, height: 300, top: '85%', left: '55%', animationDuration: '30s', animationDelay: '-14s' }} />
    </div>
  );
}
