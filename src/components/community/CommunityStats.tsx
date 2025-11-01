import { Card, CardContent } from '@/components/ui/card';

interface CommunityStatsProps {
  clicks: number;
  shares: number;
  conversions: number;
}

export function CommunityStats({ clicks, shares, conversions }: CommunityStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Cliques nos seus links</p>
          <p className="mt-1 text-3xl font-bold">{clicks}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Compartilhamentos</p>
          <p className="mt-1 text-3xl font-bold">{shares}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Convites convertidos</p>
          <p className="mt-1 text-3xl font-bold">{conversions}</p>
        </CardContent>
      </Card>
    </div>
  );
}
