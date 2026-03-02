import React, { useMemo } from 'react';

export const ACTIVITY_KEYS = ['journals', 'conferences', 'patents', 'funding'];

export const ACTIVITY_META = {
  journals: { label: 'Journals', color: 'var(--chart-journals)' },
  conferences: { label: 'Conferences', color: 'var(--chart-conferences)' },
  patents: { label: 'Patents', color: 'var(--chart-patents)' },
  funding: { label: 'Funding', color: 'var(--chart-funding)' }
};

export const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const clamp01 = (n) => Math.min(1, Math.max(0, n));

const lerp = (a, b, t) => a + (b - a) * t;

const mixRgb = (from, to, t) => {
  const tt = clamp01(t);
  const r = Math.round(lerp(from[0], to[0], tt));
  const g = Math.round(lerp(from[1], to[1], tt));
  const b = Math.round(lerp(from[2], to[2], tt));
  return `rgb(${r} ${g} ${b})`;
};

const cssVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const parseCssColorToRgb = (value, fallback) => {
  if (!value) return fallback;
  const trimmed = value.trim();
  const rgbMatch = trimmed.match(/^rgb[a]?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(/[,\s/]+/)
      .map((segment) => Number(segment))
      .filter((segment) => Number.isFinite(segment))
      .slice(0, 3);
    if (parts.length === 3) return parts;
  }

  const hex = trimmed.replace('#', '');
  if (hex.length === 6 || hex.length === 3) {
    const normalized = hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].every((part) => Number.isFinite(part))) return [r, g, b];
  }

  return fallback;
};

const buildSmoothPath = (points) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const d = [];
  d.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }

  return d.join(' ');
};

const polarToCartesian = (cx, cy, r, angleRad) => ({
  x: cx + r * Math.cos(angleRad),
  y: cy + r * Math.sin(angleRad)
});

const donutSlicePath = ({ cx, cy, rOuter, rInner, startAngle, endAngle }) => {
  const a0 = startAngle;
  const a1 = endAngle;
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;

  const p0 = polarToCartesian(cx, cy, rOuter, a0);
  const p1 = polarToCartesian(cx, cy, rOuter, a1);
  const p2 = polarToCartesian(cx, cy, rInner, a1);
  const p3 = polarToCartesian(cx, cy, rInner, a0);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    'Z'
  ].join(' ');
};

const Legend = ({ keys, compact = false }) => (
  <div className={`flex flex-wrap gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
    {keys.map((key) => (
      <div key={key} className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: ACTIVITY_META[key]?.color || 'var(--text-muted)' }} />
        <span className="text-[var(--text-secondary)]">{ACTIVITY_META[key]?.label || key}</span>
      </div>
    ))}
  </div>
);

export const ChartCard = ({ title, subtitle, right, children }) => (
  <section className="theme-card rounded-2xl overflow-hidden">
    <div className="theme-surface-muted p-5 sm:p-6 border-b theme-border flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="theme-text-primary text-base sm:text-lg font-bold">{title}</h2>
        {subtitle ? <p className="theme-text-secondary text-xs sm:text-sm mt-1">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
);

export const StackedAreaChart = ({
  data,
  keys = ACTIVITY_KEYS,
  height = 260,
  minWidth = 520
}) => {
  const { years, layers, maxTotal } = useMemo(() => {
    const yearsList = (Array.isArray(data) ? data : []).map((row) => row?.year).filter((y) => y !== undefined && y !== null);
    const sortedYears = [...yearsList].sort((a, b) => toNumber(a) - toNumber(b));
    const rows = (Array.isArray(data) ? data : [])
      .slice()
      .sort((a, b) => toNumber(a?.year) - toNumber(b?.year));

    const totals = rows.map((row) => keys.reduce((sum, key) => sum + toNumber(row?.[key]), 0));
    const max = Math.max(1, ...totals);

    const stackedLayers = keys.map((key) => ({
      key,
      pointsTop: [],
      pointsBottom: []
    }));

    rows.forEach((row, idx) => {
      let acc = 0;
      keys.forEach((key, kIdx) => {
        const v = toNumber(row?.[key]);
        const y0 = acc;
        const y1 = acc + v;
        acc = y1;
        stackedLayers[kIdx].pointsBottom[idx] = { year: row?.year, y: y0 };
        stackedLayers[kIdx].pointsTop[idx] = { year: row?.year, y: y1 };
      });
    });

    return { years: sortedYears, layers: stackedLayers, maxTotal: max };
  }, [data, keys]);

  const width = Math.max(minWidth, years.length * 80);
  const pad = { left: 44, right: 18, top: 14, bottom: 34 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const xAt = (index) => (years.length <= 1 ? pad.left + innerW / 2 : pad.left + (innerW * index) / (years.length - 1));
  const yAt = (value) => pad.top + innerH - (innerH * toNumber(value)) / maxTotal;

  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => (maxTotal * i) / gridLines);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block" role="img" aria-label="Departmental growth trend">
        <rect x="0" y="0" width={width} height={height} fill="var(--surface)" />

        {yTicks.map((t) => {
          const y = yAt(t);
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <text x={pad.left - 10} y={y + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {years.map((year, idx) => (
          <text
            key={year}
            x={xAt(idx)}
            y={height - 12}
            fontSize="11"
            textAnchor="middle"
            fill="var(--chart-axis)"
          >
            {year}
          </text>
        ))}

        {layers.map((layer) => {
          const topPts = layer.pointsTop.map((p, idx) => ({ x: xAt(idx), y: yAt(p.y) }));
          const bottomPts = layer.pointsBottom.map((p, idx) => ({ x: xAt(idx), y: yAt(p.y) }));
          const topPath = buildSmoothPath(topPts);
          const bottomPath = buildSmoothPath([...bottomPts].reverse()).replace(/^M/, 'L');
          const d = `${topPath} L ${bottomPts[bottomPts.length - 1]?.x ?? pad.left} ${bottomPts[bottomPts.length - 1]?.y ?? (pad.top + innerH)} ${bottomPath} Z`;
          const color = ACTIVITY_META[layer.key]?.color || 'var(--text-muted)';
          return <path key={layer.key} d={d} fill={color} opacity="0.25" stroke={color} strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

export const DoughnutChart = ({
  row,
  keys = ACTIVITY_KEYS,
  size = 260
}) => {
  const values = keys.map((key) => ({ key, value: toNumber(row?.[key]) }));
  const total = values.reduce((sum, v) => sum + v.value, 0);

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.42;
  const rInner = size * 0.26;

  let angle = -Math.PI / 2;
  const slices = values
    .filter((v) => v.value > 0)
    .map((v) => {
      const portion = total ? v.value / total : 0;
      const startAngle = angle;
      const endAngle = angle + portion * Math.PI * 2;
      angle = endAngle;
      return { ...v, startAngle, endAngle };
    });

  const empty = total === 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} role="img" aria-label="Activity mix">
        <rect x="0" y="0" width={size} height={size} fill="var(--surface)" />
        {empty ? (
          <g>
            <circle cx={cx} cy={cy} r={rOuter} fill="var(--surface-muted)" />
            <circle cx={cx} cy={cy} r={rInner} fill="var(--surface)" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="var(--chart-axis)">
              No data
            </text>
          </g>
        ) : (
          slices.map((slice) => {
            const color = ACTIVITY_META[slice.key]?.color || 'var(--text-muted)';
            const d = donutSlicePath({
              cx,
              cy,
              rOuter,
              rInner,
              startAngle: slice.startAngle,
              endAngle: slice.endAngle
            });
            const label = `${ACTIVITY_META[slice.key]?.label || slice.key}: ${slice.value}`;
            return <path key={slice.key} d={d} fill={color} opacity="0.9"><title>{label}</title></path>;
          })
        )}

        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fill="var(--chart-axis)">
          Total
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">
          {total}
        </text>
      </svg>

      <Legend keys={keys} />
    </div>
  );
};

export const ClusteredBarChart = ({
  rows,
  keys = ACTIVITY_KEYS,
  height = 320,
  scale = 'sqrt',
  minBarPx = 2
}) => {
  const data = Array.isArray(rows) ? rows : [];
  const width = Math.max(700, data.length * 120);
  const pad = { left: 54, right: 22, top: 16, bottom: 62 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);

  const maxVal = Math.max(
    1,
    ...data.flatMap((row) => keys.map((key) => toNumber(row?.[key])))
  );

  const scaleFn = (v) => {
    const vv = Math.max(0, toNumber(v));
    if (scale === 'sqrt') return Math.sqrt(vv);
    return vv;
  };
  const invScaleLabel = scale === 'sqrt';
  const maxScaled = Math.max(1, scaleFn(maxVal));

  const groupW = innerW / Math.max(1, data.length);
  const gap = Math.max(4, Math.min(10, groupW * 0.12));
  const barW = Math.max(6, (groupW - gap * 2) / keys.length);

  const yAt = (v) => pad.top + innerH - (innerH * scaleFn(v)) / maxScaled;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal * i) / yTicks);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full">
        <svg width={width} height={height} className="block" role="img" aria-label="Cross-departmental volume leaderboard">
          <rect x="0" y="0" width={width} height={height} fill="var(--surface)" />

          {ticks.map((t) => {
            const y = yAt(t);
            return (
              <g key={t}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <text x={pad.left - 10} y={y + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
                  {Math.round(t)}
                </text>
              </g>
            );
          })}

          {data.map((row, idx) => {
            const x0 = pad.left + idx * groupW;
            const dept = row?.department || 'Unassigned';
            return (
              <g key={`${dept}-${idx}`}>
                {keys.map((key, kIdx) => {
                  const v = toNumber(row?.[key]);
                  const x = x0 + gap + kIdx * barW;
                  const y = yAt(v);
                  const rawH = pad.top + innerH - y;
                  const h = v > 0 ? Math.max(minBarPx, rawH) : 0;
                  const color = ACTIVITY_META[key]?.color || 'var(--text-muted)';
                  const label = `${dept} - ${ACTIVITY_META[key]?.label || key}: ${v}`;
                  return (
                    <rect
                      key={key}
                      x={x}
                      y={pad.top + innerH - h}
                      width={barW - 2}
                      height={Math.max(0, h)}
                      rx="3"
                      fill={color}
                      opacity="0.85"
                    >
                      <title>{label}</title>
                    </rect>
                  );
                })}

                <text
                  x={x0 + groupW / 2}
                  y={height - 24}
                  fontSize="11"
                  textAnchor="middle"
                  fill="var(--chart-axis)"
                >
                  {dept.length > 10 ? `${dept.slice(0, 10)}...` : dept}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Legend keys={keys} compact />
          {invScaleLabel ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Scale: <span className="font-semibold text-[var(--text-primary)]">sqrt</span> (small values emphasized)
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const LineChart = ({
  rows,
  height = 260,
  minWidth = 520
}) => {
  const data = (Array.isArray(rows) ? rows : [])
    .slice()
    .sort((a, b) => toNumber(a?.year) - toNumber(b?.year))
    .map((row) => ({ year: row?.year, total: toNumber(row?.total) }));

  const years = data.map((d) => d.year);
  const width = Math.max(minWidth, years.length * 90);
  const pad = { left: 44, right: 18, top: 14, bottom: 34 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);

  const maxY = Math.max(1, ...data.map((d) => d.total));
  const xAt = (index) => (data.length <= 1 ? pad.left + innerW / 2 : pad.left + (innerW * index) / (data.length - 1));
  const yAt = (value) => pad.top + innerH - (innerH * toNumber(value)) / maxY;

  const points = data.map((d, idx) => ({ x: xAt(idx), y: yAt(d.total) }));
  const path = buildSmoothPath(points);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block" role="img" aria-label="System adoption rate">
        <rect x="0" y="0" width={width} height={height} fill="var(--surface)" />

        {Array.from({ length: 5 }, (_, i) => (maxY * i) / 4).map((t) => {
          const y = yAt(t);
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <text x={pad.left - 10} y={y + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
        {points.map((p, idx) => (
          <circle key={data[idx]?.year ?? idx} cx={p.x} cy={p.y} r="4" fill="var(--color-primary)">
            <title>{`${data[idx]?.year}: ${data[idx]?.total}`}</title>
          </circle>
        ))}

        {years.map((year, idx) => (
          <text key={year} x={xAt(idx)} y={height - 12} fontSize="11" textAnchor="middle" fill="var(--chart-axis)">
            {year}
          </text>
        ))}
      </svg>
    </div>
  );
};

export const HeatmapMatrix = ({
  cells,
  height = 420
}) => {
  const data = Array.isArray(cells) ? cells : [];

  const years = useMemo(() => {
    const set = new Set(data.map((d) => d?.year).filter((y) => y !== undefined && y !== null));
    return [...set].sort((a, b) => toNumber(a) - toNumber(b));
  }, [data]);

  const depts = useMemo(() => {
    const set = new Set(data.map((d) => d?.dept).filter(Boolean));
    const list = [...set];
    const totals = new Map();
    data.forEach((d) => {
      const dept = d?.dept;
      if (!dept) return;
      totals.set(dept, (totals.get(dept) || 0) + toNumber(d?.count));
    });
    return list.sort((a, b) => (totals.get(b) || 0) - (totals.get(a) || 0));
  }, [data]);

  const map = useMemo(() => {
    const m = new Map();
    data.forEach((d) => {
      const dept = d?.dept;
      const year = d?.year;
      if (!dept || year === undefined || year === null) return;
      m.set(`${dept}::${year}`, toNumber(d?.count));
    });
    return m;
  }, [data]);

  const maxCount = Math.max(1, ...data.map((d) => toNumber(d?.count)));
  const cellSize = 34;
  const gap = 6;
  const left = 160;
  const top = 46;
  const width = Math.max(520, left + years.length * (cellSize + gap) + 20);
  const innerH = depts.length * (cellSize + gap);
  const svgH = Math.max(height, top + innerH + 24);

  const low = parseCssColorToRgb(cssVar('--chart-heat-low', 'rgb(239 246 255)'), [239, 246, 255]);
  const high = parseCssColorToRgb(cssVar('--chart-heat-high', 'rgb(29 78 216)'), [29, 78, 216]);
  const colorFor = (value) => mixRgb(low, high, Math.pow(clamp01(toNumber(value) / maxCount), 0.7));

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={svgH} className="block" role="img" aria-label="Research intensity heatmap">
        <rect x="0" y="0" width={width} height={svgH} fill="var(--surface)" />

        {years.map((year, idx) => (
          <text
            key={year}
            x={left + idx * (cellSize + gap) + cellSize / 2}
            y={top - 16}
            fontSize="11"
            textAnchor="middle"
            fill="var(--chart-axis)"
          >
            {year}
          </text>
        ))}

        {depts.map((dept, rIdx) => (
          <text
            key={dept}
            x={left - 10}
            y={top + rIdx * (cellSize + gap) + cellSize / 2 + 4}
            fontSize="11"
            textAnchor="end"
            fill="var(--chart-axis)"
          >
            {dept.length > 18 ? `${dept.slice(0, 18)}...` : dept}
          </text>
        ))}

        {depts.map((dept, rIdx) =>
          years.map((year, cIdx) => {
            const value = map.get(`${dept}::${year}`) || 0;
            const x = left + cIdx * (cellSize + gap);
            const y = top + rIdx * (cellSize + gap);
            const fill = value ? colorFor(value) : 'var(--surface-muted)';
            const label = `${dept} - ${year}: ${value}`;
            return (
              <rect
                key={`${dept}-${year}`}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx="6"
                fill={fill}
                stroke="var(--chart-grid)"
              >
                <title>{label}</title>
              </rect>
            );
          })
        )}

        <g transform={`translate(${left}, ${top + innerH + 10})`}>
          <text x="0" y="0" fontSize="11" fill="var(--chart-axis)">
            Low
          </text>
          {Array.from({ length: 6 }, (_, i) => i / 5).map((t) => (
            <rect
              key={t}
              x={30 + t * 34}
              y={-12}
              width="30"
              height="12"
              rx="4"
              fill={mixRgb(low, high, t)}
              stroke="var(--chart-grid)"
            />
          ))}
          <text x={30 + 5 * 34 + 36} y="0" fontSize="11" fill="var(--chart-axis)">
            High
          </text>
        </g>
      </svg>
    </div>
  );
};
