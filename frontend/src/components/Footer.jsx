import React from 'react';
import { Heart, Camera, Send } from 'lucide-react';

export default function Footer() {
  return <footer className="site-footer" id="contacts">
    <div className="footer-main">
      <div className="footer-brand-block">
        <a className="brand brand--footer" href="/#top"><span className="brand-mark"><Heart size={21} fill="currentColor" /></span><span className="brand-name">доброе<span>сердце</span></span></a>
        <p>Каждому хвостику — свой человек.<br />Каждому человеку — верный друг.</p>
      </div>
      <div className="footer-column"><h4>Навигация</h4><a href="/catalog">Наши хвостики</a><a href="/#about">О приюте</a><a href="/#help">Как помочь</a></div>
      <div className="footer-column"><h4>Мы на связи</h4><a href="tel:+77001234567">+7 (700) 123-45-67</a><a href="mailto:hello@dobroeserdtse.example">hello@dobroeserdtse.example</a><span>Ежедневно, 10:00–19:00</span></div>
      <div className="footer-social"><h4>Будем на связи</h4><p>Истории наших хвостиков и новости приюта.</p><div className="social-links"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={18}/></a><a href="https://t.me" target="_blank" rel="noreferrer" aria-label="Telegram"><Send size={18}/></a></div></div>
    </div>
    <div className="footer-bottom"><span>© 2026 «Доброе Сердце»</span><span>Сделано с заботой <Heart size={13} fill="currentColor" /></span></div>
  </footer>;
}
