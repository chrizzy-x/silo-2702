import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

const cardStyle: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };

type Summary = { totalVolume?: string; volume24h?: string; totalSiloPoints?: number };

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({});
  const [series, setSeries] = useState<{ date: string; volumeUsd: number; points: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ address: string; totalPoints: number }>>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sRes, serRes, lbRes] = await Promise.all([
          axios.get('/api/dashboard/summary'),
          axios.get('/api/dashboard/series?interval=day&limit=30'),
          axios.get('/api/silo/leaderboard?limit=20')
        ]);

        setSummary(sRes.data);
        setSeries(serRes.data.series ?? []);
        setLeaderboard(lbRes.data.leaderboard ?? []);
      } catch (err) { console.error(err); }
    }

    fetchAll();
    const iv = setInterval(fetchAll, 10_000);
    return () => clearInterval(iv);
  }, []);

  const chartData = { labels: series.map(s => s.date), datasets: [ { label: 'Volume USD', data: series.map(s => s.volumeUsd), borderColor: '#3b82f6', fill: false }, { label: 'Daily Points', data: series.map(s => s.points), borderColor: '#10b981', fill: false, yAxisID: 'y2' } ] };
  const chartOptions = { scales: { y: { position: 'left' }, y2: { position: 'right', grid: { drawOnChartArea: false } } } };

  return (
    <div style={{ padding: 24 }}>
      <h1>SiloPerps Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <div style={cardStyle}><h3>Total Volume</h3><div>{summary.totalVolume ?? '—'}</div></div>
        <div style={cardStyle}><h3>24h Volume</h3><div>{summary.volume24h ?? '—'}</div></div>
        <div style={cardStyle}><h3>Total Silo Points</h3><div>{summary.totalSiloPoints ?? '—'}</div></div>
      </div>

      <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
        <h2>Trends (last 30 days)</h2>
        <Line data={chartData as any} options={chartOptions as any} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
          <h3>Recent Trades</h3>
          <RecentTrades />
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
          <h3>Leaderboard</h3>
          <ol>{leaderboard.map((l, i) => (<li key={i}><strong>{l.address}</strong> — {l.totalPoints} pts</li>))}</ol>
        </div>
      </div>
    </div>
  );
}

function RecentTrades() {
  const [trades, setTrades] = useState<Array<any>>([]);
  useEffect(() => { async function load() { const res = await axios.get('/api/trades/recent?limit=20'); setTrades(res.data.trades ?? []); } load(); }, []);
  return (
    <table style={{ width: '100%' }}>
      <thead><tr><th>Time</th><th>Trader</th><th>Pair</th><th>USD</th></tr></thead>
      <tbody>{trades.map((t: any) => (<tr key={t.id}><td>{new Date(t.timestamp).toISOString()}</td><td>{t.traderAddress}</td><td>{t.pair}</td><td>{t.usd}</td></tr>))}</tbody>
    </table>
  );
}
