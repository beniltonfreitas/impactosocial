import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const REDE_PCD_LINKS = [
  { icon: '🏠', title: 'Início Rede PcD', path: '/rede-pcd' },
  { icon: '📰', title: 'PcD+', path: '/rede-pcd/feed' },
  { icon: '⚖️', title: 'PcD Direitos', path: '/rede-pcd/direitos' },
  { icon: '🚨', title: 'PcD Alerta', path: '/rede-pcd/alerta' },
  { icon: '▶️', title: 'PcD Play', path: '/rede-pcd/play' },
  { icon: '🏆', title: 'PcD Esportes', path: '/rede-pcd/esportes' },
  { icon: '👥', title: 'CDDPcD', path: '/rede-pcd/conselhos' },
  { icon: '🛍️', title: 'PcD Shop', path: '/rede-pcd/shop' },
  { icon: '💼', title: 'PcD Vitrine', path: '/rede-pcd/vitrine' },
  { icon: '✍️', title: 'PcD Blog', path: '/rede-pcd/blog' },
  { icon: '🎓', title: 'PcD Academy', path: '/rede-pcd/academy' },
  { icon: '🎁', title: 'PcD Clube', path: '/rede-pcd/clube' },
  { icon: '❤️', title: 'PcD Rede do Bem', path: '/rede-pcd/rede-do-bem' },
  { icon: '🏆', title: 'Desafio Social', path: '/desafio-social' },
];

export function RedePcdNavigationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {REDE_PCD_LINKS.map((item) => (
        <Link key={item.path} to={item.path}>
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
