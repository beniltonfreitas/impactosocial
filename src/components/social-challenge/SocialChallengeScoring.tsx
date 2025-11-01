import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function SocialChallengeScoring() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Sistema de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ação</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
              <TableHead className="text-right">Códigos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Pagamento via Pix</TableCell>
              <TableCell className="text-right">40 pts</TableCell>
              <TableCell className="text-right text-primary font-bold">
                40 códigos
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Cada indicação confirmada
              </TableCell>
              <TableCell className="text-right">20 pts</TableCell>
              <TableCell className="text-right text-primary font-bold">
                20 códigos
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Cada desafio concluído
              </TableCell>
              <TableCell className="text-right">12 pts</TableCell>
              <TableCell className="text-right text-primary font-bold">
                12 códigos
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          Cada ponto representa 1 Código Social de Impacto. Esses códigos são
          reconhecimentos de engajamento, não sorteios.
        </p>
      </CardContent>
    </Card>
  );
}
