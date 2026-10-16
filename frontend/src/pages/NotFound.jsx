import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
export default function NotFound(){return <main className="page-shell section-wrap not-found"><PawPrint size={46}/><p className="eyebrow">404 · ПОТЕРЯЛАСЬ ТРОПИНКА</p><h1>Кажется, эта страница<br/>убежала гулять.</h1><p>Но мы всегда можем вернуться туда, где начинается дружба.</p><Link className="button button--primary" to="/">На главную</Link><Link className="text-link" to="/catalog">Посмотреть питомцев →</Link></main>}
