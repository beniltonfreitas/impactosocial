import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Eye, MousePointer, TrendingUp, DollarSign, Download, ArrowUpDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type Period = 'today' | '7days' | '30days';
type SortColumn = 'name' | 'impressions' | 'clicks' | 'ctr' | 'revenue';
type SortDirection = 'asc' | 'desc';

interface DailyStat {
  date: string;
  impressions: number;
  clicks: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  revenue: number;
}

interface SlotPerformance {
  slot: string;
  clicks: number;
}

export function AdsAnalytics() {
  const [period, setPeriod] = useState<Period>('7days');
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [slotPerformance, setSlotPerformance] = useState<SlotPerformance[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('ctr');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start: Date;

    switch (period) {
      case 'today':
        start = startOfDay(new Date());
        break;
      case '7days':
        start = startOfDay(subDays(new Date(), 6));
        break;
      case '30days':
        start = startOfDay(subDays(new Date(), 29));
        break;
      default:
        start = startOfDay(subDays(new Date(), 6));
    }

    return { start, end };
  };

  async function loadAnalytics() {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Buscar stats
      const { data: stats, error: statsError } = await supabase
        .from('ad_stats')
        .select('event, created_at, campaign_id, slot')
        .eq('tenant_id', TENANT_NAME)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (statsError) throw statsError;

      // Buscar campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('id, name, cpc, cpm')
        .eq('tenant_id', TENANT_NAME);

      if (campaignsError) throw campaignsError;

      // Processar dados diários
      const dailyMap: Record<string, DailyStat> = {};
      stats?.forEach(stat => {
        const date = stat.created_at.split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { date, impressions: 0, clicks: 0 };
        }
        if (stat.event === 'impression') dailyMap[date].impressions++;
        if (stat.event === 'click') dailyMap[date].clicks++;
      });
      setDailyStats(Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)));

      // Processar performance por campanha
      const campaignMap: Record<string, CampaignPerformance> = {};
      stats?.forEach(stat => {
        if (!campaignMap[stat.campaign_id]) {
          const campaign = campaigns?.find(c => c.id === stat.campaign_id);
          campaignMap[stat.campaign_id] = {
            id: stat.campaign_id,
            name: campaign?.name || 'Desconhecida',
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: campaign?.cpc || 0,
            cpm: campaign?.cpm || 0,
            revenue: 0,
          };
        }
        if (stat.event === 'impression') campaignMap[stat.campaign_id].impressions++;
        if (stat.event === 'click') campaignMap[stat.campaign_id].clicks++;
      });

      const performanceData = Object.values(campaignMap).map(campaign => ({
        ...campaign,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100) : 0,
        revenue: (campaign.clicks * campaign.cpc) + ((campaign.impressions / 1000) * campaign.cpm),
      }));
      setCampaignPerformance(performanceData);

      // Processar performance por slot
      const slotMap: Record<string, number> = {};
      stats?.forEach(stat => {
        if (stat.event === 'click') {
          const slot = stat.slot || 'unknown';
          slotMap[slot] = (slotMap[slot] || 0) + 1;
        }
      });
      setSlotPerformance(
        Object.entries(slotMap)
          .map(([slot, clicks]) => ({ slot, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
      );

    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados analíticos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const totalImpressions = campaignPerformance.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaignPerformance.reduce((sum, c) => sum + c.clicks, 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const estimatedRevenue = campaignPerformance.reduce((sum, c) => sum + c.revenue, 0);

  const sortBy = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedCampaigns = [...campaignPerformance].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const direction = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? direction : -direction;
  });

  function exportToCSV() {
    const headers = ['Campanha', 'Impressões', 'Cliques', 'CTR (%)', 'CPC', 'CPM', 'Receita (R$)'];
    const rows = campaignPerformance.map(c => [
      c.name,
      c.impressions,
      c.clicks,
      c.ctr.toFixed(2),
      c.cpc.toFixed(2),
      c.cpm.toFixed(2),
      c.revenue.toFixed(2),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ads-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Exportado",
      description: "Relatório baixado com sucesso.",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
          <CardDescription>Selecione o período para visualizar as métricas</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today" className="cursor-pointer">Hoje</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7days" id="7days" />
                <Label htmlFor="7days" className="cursor-pointer">7 dias</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30days" id="30days" />
                <Label htmlFor="30days" className="cursor-pointer">30 dias</Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalImpressions.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Taxa de cliques</p>
            <Badge variant={ctr > 1 ? "default" : "secondary"} className="mt-2">
              {ctr > 1 ? "Ótimo" : "Melhorar"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Baseado em CPC/CPM</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência Diária */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Performance</CardTitle>
          <CardDescription>Impressões e cliques por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: ptBR })}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                formatter={(value: number) => value.toLocaleString('pt-BR')}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="impressions" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Impressões"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="clicks" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Cliques"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico Top Campanhas por CTR */}
        <Card>
          <CardHeader>
            <CardTitle>Top Campanhas por CTR</CardTitle>
            <CardDescription>As 5 campanhas mais eficientes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sortedCampaigns.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tickFormatter={(name) => name.length > 20 ? name.substring(0, 20) + '...' : name}
                />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Bar dataKey="ctr" fill="hsl(var(--primary))" name="CTR (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Performance por Slot */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Posição</CardTitle>
            <CardDescription>Cliques distribuídos por slot</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={slotPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.slot}: ${entry.clicks}`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="clicks"
                >
                  {slotPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhamento por Campanha</CardTitle>
              <CardDescription>Métricas completas de cada campanha</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => sortBy('name')}>
                  <div className="flex items-center gap-1">
                    Campanha
                    {sortColumn === 'name' && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => sortBy('impressions')}>
                  <div className="flex items-center justify-end gap-1">
                    Impressões
                    {sortColumn === 'impressions' && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => sortBy('clicks')}>
                  <div className="flex items-center justify-end gap-1">
                    Cliques
                    {sortColumn === 'clicks' && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => sortBy('ctr')}>
                  <div className="flex items-center justify-end gap-1">
                    CTR
                    {sortColumn === 'ctr' && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">CPC/CPM</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => sortBy('revenue')}>
                  <div className="flex items-center justify-end gap-1">
                    Receita
                    {sortColumn === 'revenue' && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-right">{campaign.impressions.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{campaign.clicks.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={campaign.ctr > 1 ? "default" : "secondary"}>
                      {campaign.ctr.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {campaign.cpc > 0 && `R$ ${campaign.cpc.toFixed(2)}`}
                    {campaign.cpm > 0 && ` / R$ ${campaign.cpm.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    R$ {campaign.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
