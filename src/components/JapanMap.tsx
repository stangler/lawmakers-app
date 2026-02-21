import { useRef, useEffect, useState as useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { SingleSeatMember, ProportionalMember } from '../types/member';
import type { NewsItem } from '../types/news';
import { PREFECTURE_MAP, type Prefecture } from '../lib/prefectures';
import { PARTY_COLORS } from '../lib/parseMembers';
import { ZoomControls } from './ZoomControls';
import { MapNewsCard } from './MapNewsCard';
import { useMapZoom } from '../hooks/useMapZoom';

interface JapanMapProps {
  members: SingleSeatMember[];
  proportionalMembers: ProportionalMember[];
  selectedPrefecture: string | null;
  onSelectPrefecture: (code: string | null) => void;
  selectedBlock: string | null;
  onSelectBlock: (block: string | null) => void;
  mode: 'single-seat' | 'proportional';
  news?: NewsItem[];
}

interface PrefectureProperties {
  nam: string;
  nam_ja: string;
  id: number;
}

const WIDTH = 800;
const HEIGHT = 800;

// ブロックに含まれる都道府県コード
const BLOCK_PREFECTURES: Record<string, string[]> = {
  '北海道ブロック': ['01'],
  '東北ブロック': ['02', '03', '04', '05', '06', '07'],
  '北関東ブロック': ['08', '09', '10', '11'],
  '南関東ブロック': ['12', '14', '19'],  // 千葉、神奈川、山梨
  '東京ブロック': ['13'], // 東京
  '北陸信越ブロック': ['15', '16', '17', '18', '20'],  // 新潟、富山、石川、福井、長野
  '東海ブロック': ['21', '22', '23', '24'],
  '近畿ブロック': ['25', '26', '27', '28', '29', '30'],
  '中国ブロック': ['31', '32', '33', '34', '35'],
  '四国ブロック': ['36', '37', '38', '39'],
  '九州ブロック': ['40', '41', '42', '43', '44', '45', '46', '47'],
};

function createProjection() {
  return d3.geoMercator()
    .center([138, 35])
    .scale(1500)
    .translate([WIDTH / 2, HEIGHT / 2]);
}

export function JapanMap({
  members,
  proportionalMembers,
  selectedPrefecture,
  onSelectPrefecture,
  selectedBlock,
  onSelectBlock,
  mode,
  news = [],
}: JapanMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const [topology, setTopology] = useState<Topology | null>(null);
  const [showNewsOnMap, setShowNewsOnMap] = useState(true);

  const projection = useMemo(() => createProjection(), []);
  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const { zoomState, zoomIn, zoomOut, resetZoom, zoomToPoint } = useMapZoom(svgRef, {
    width: WIDTH,
    height: HEIGHT,
  });

  // Load topology
  useEffect(() => {
    fetch('/japan-topo.json')
      .then((res) => res.json())
      .then((data) => setTopology(data));
  }, []);

  // Members by prefecture
  const membersByPrefecture = useMemo(() => {
    const map = new Map<string, SingleSeatMember[]>();
    for (const member of members) {
      const existing = map.get(member.prefectureCode) || [];
      map.set(member.prefectureCode, [...existing, member]);
    }
    return map;
  }, [members]);

  // Members by block
  const membersByBlock = useMemo(() => {
    const map = new Map<string, ProportionalMember[]>();
    for (const member of proportionalMembers) {
      const existing = map.get(member.block) || [];
      map.set(member.block, [...existing, member]);
    }
    return map;
  }, [proportionalMembers]);

  // Get dominant party for a prefecture
  const getDominantParty = useCallback((prefCode: string): string | null => {
    const prefMembers = membersByPrefecture.get(prefCode);
    if (!prefMembers || prefMembers.length === 0) return null;
    
    const partyCounts: Record<string, number> = {};
    for (const m of prefMembers) {
      partyCounts[m.party] = (partyCounts[m.party] || 0) + 1;
    }
    
    return Object.entries(partyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [membersByPrefecture]);

  // Get dominant party for a block
  const getDominantPartyForBlock = useCallback((block: string): string | null => {
    const blockMembers = membersByBlock.get(block);
    if (!blockMembers || blockMembers.length === 0) return null;
    
    const partyCounts: Record<string, number> = {};
    for (const m of blockMembers) {
      partyCounts[m.party] = (partyCounts[m.party] || 0) + 1;
    }
    
    return Object.entries(partyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [membersByBlock]);

  // Get block center coordinates
  const getBlockCenter = useCallback((blockPrefectures: string[]) => {
    const centers = blockPrefectures
      .map(code => PREFECTURE_MAP.get(code))
      .filter((pref): pref is Prefecture => pref !== undefined)
      .map(pref => projection([pref.lng, pref.lat]))
      .filter((coords): coords is [number, number] => coords !== null);
    
    if (centers.length === 0) return null;
    
    const avgX = centers.reduce((sum, [x]) => sum + x, 0) / centers.length;
    const avgY = centers.reduce((sum, [, y]) => sum + y, 0) / centers.length;
    
    return [avgX, avgY] as [number, number];
  }, [projection]);

  // Handle prefecture click
  const handleClick = useCallback(
    (code: string) => {
      if (mode === 'single-seat') {
        if (selectedPrefecture === code) {
          onSelectPrefecture(null);
          resetZoom();
        } else {
          onSelectPrefecture(code);
          const pref = PREFECTURE_MAP.get(code);
          if (pref) {
            const coords = projection([pref.lng, pref.lat]);
            if (coords) {
              zoomToPoint(coords[0], coords[1], 4);
            }
          }
        }
      }
    },
    [mode, selectedPrefecture, onSelectPrefecture, resetZoom, zoomToPoint, projection]
  );

  // Handle background click
  const handleBackgroundClick = useCallback(() => {
    if (mode === 'single-seat' && selectedPrefecture) {
      onSelectPrefecture(null);
      resetZoom();
    } else if (mode === 'proportional' && selectedBlock) {
      onSelectBlock(null);
      resetZoom();
    }
  }, [mode, selectedPrefecture, selectedBlock, onSelectPrefecture, onSelectBlock, resetZoom]);

  // D3 rendering
  useEffect(() => {
    if (!topology || !mapGroupRef.current) return;

    const g = d3.select(mapGroupRef.current);
    g.selectAll('*').remove();

    const geojson = topojson.feature(
      topology,
      topology.objects.japan as GeometryCollection<PrefectureProperties>
    );

    const features = geojson.features;

    // Prefecture paths
    g.selectAll<SVGPathElement, typeof features[number]>('path')
      .data(features)
      .join('path')
      .attr('d', pathGenerator as never)
      .attr('fill', (d) => {
        const code = String(d.properties.id).padStart(2, '0');
        
        if (mode === 'single-seat') {
          if (code === selectedPrefecture) return 'rgba(0, 255, 255, 0.25)';
          const party = getDominantParty(code);
          if (party && PARTY_COLORS[party]) {
            return PARTY_COLORS[party] + '80'; // 50% opacity
          }
          return 'rgba(0, 255, 255, 0.06)';
        } else {
          // Proportional mode - color by block
          for (const [block, prefCodes] of Object.entries(BLOCK_PREFECTURES)) {
            if (prefCodes.includes(code)) {
              if (selectedBlock === block) {
                return 'rgba(0, 255, 255, 0.35)';
              }
              const party = getDominantPartyForBlock(block);
              if (party && PARTY_COLORS[party]) {
                return PARTY_COLORS[party] + '60';
              }
            }
          }
          return 'rgba(0, 255, 255, 0.06)';
        }
      })
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .style('transition', 'fill 0.3s ease')
      .on('mouseenter', function (_, d) {
        const code = String(d.properties.id).padStart(2, '0');
        if (mode === 'single-seat' && code !== selectedPrefecture) {
          d3.select(this).attr('fill', 'rgba(0, 255, 255, 0.20)');
        } else if (mode === 'proportional') {
          d3.select(this).attr('fill', 'rgba(0, 255, 255, 0.25)');
        }
      })
      .on('mouseleave', function (_, d) {
        const code = String(d.properties.id).padStart(2, '0');
        
        if (mode === 'single-seat') {
          if (code === selectedPrefecture) {
            d3.select(this).attr('fill', 'rgba(0, 255, 255, 0.25)');
          } else {
            const party = getDominantParty(code);
            if (party && PARTY_COLORS[party]) {
              d3.select(this).attr('fill', PARTY_COLORS[party] + '80');
            } else {
              d3.select(this).attr('fill', 'rgba(0, 255, 255, 0.06)');
            }
          }
        } else {
          for (const [block, prefCodes] of Object.entries(BLOCK_PREFECTURES)) {
            if (prefCodes.includes(code)) {
              if (selectedBlock === block) {
                d3.select(this).attr('fill', 'rgba(0, 255, 255, 0.35)');
              } else {
                const party = getDominantPartyForBlock(block);
                if (party && PARTY_COLORS[party]) {
                  d3.select(this).attr('fill', PARTY_COLORS[party] + '60');
                }
              }
              break;
            }
          }
        }
      })
      .on('click', (event: MouseEvent, d) => {
        event.stopPropagation();
        const code = String(d.properties.id).padStart(2, '0');
        
        if (mode === 'single-seat') {
          handleClick(code);
        } else {
          // Find block for this prefecture
          for (const [block, prefCodes] of Object.entries(BLOCK_PREFECTURES)) {
            if (prefCodes.includes(code)) {
              if (selectedBlock === block) {
                onSelectBlock(null);
                resetZoom();
              } else {
                onSelectBlock(block);
                const pref = PREFECTURE_MAP.get(code);
                if (pref) {
                  const coords = projection([pref.lng, pref.lat]);
                  if (coords) {
                    zoomToPoint(coords[0], coords[1], 3);
                  }
                }
              }
              break;
            }
          }
        }
      });

    // Member count labels
    const labelsGroup = g.append('g').attr('class', 'labels');
    
    if (mode === 'single-seat') {
      for (const [code, prefMembers] of membersByPrefecture) {
        const pref = PREFECTURE_MAP.get(code);
        if (!pref) continue;
        
        const [x, y] = projection([pref.lng, pref.lat]) ?? [0, 0];
        
        labelsGroup
          .append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', 12)
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('pointer-events', 'none')
          .attr('opacity', 0.8)
          .text(prefMembers.length);
      }
    } else if (mode === 'proportional') {
      for (const [block, blockMembers] of membersByBlock) {
        const blockPrefectures = BLOCK_PREFECTURES[block];
        if (!blockPrefectures) continue;

        const center = getBlockCenter(blockPrefectures);
        if (!center) continue;
        
        const [x, y] = center;
        
        labelsGroup
          .append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', 14)
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('pointer-events', 'none')
          .attr('opacity', 0.9)
          .text(blockMembers.length);
      }
    }
  }, [topology, membersByPrefecture, selectedPrefecture, selectedBlock, mode, handleClick, projection, pathGenerator, getDominantParty, getDominantPartyForBlock, onSelectBlock, resetZoom, zoomToPoint]);

  // Toggle news visibility
  const toggleNewsVisibility = useCallback(() => {
    setShowNewsOnMap((prev) => !prev);
  }, []);

  // Group news by prefecture
  const newsByPrefecture = useMemo(() => {
    const map = new Map<string, NewsItem[]>();
    for (const item of news) {
      const codes = item.prefectureCodes || [];
      if (codes.length === 0) {
        // News without prefecture - show on Tokyo (13) by default
        const defaultCode = '13';
        const existing = map.get(defaultCode) || [];
        map.set(defaultCode, [...existing, item]);
      } else {
        for (const code of codes) {
          const existing = map.get(code) || [];
          map.set(code, [...existing, item]);
        }
      }
    }
    return map;
  }, [news]);

  // Convert map coordinates to screen coordinates
  const getScreenCoords = useCallback((prefCode: string): { x: number; y: number } | null => {
    const pref = PREFECTURE_MAP.get(prefCode);
    if (!pref) return null;
    const coords = projection([pref.lng, pref.lat]);
    if (!coords) return null;
    
    // Apply zoom transform
    const x = zoomState.x + coords[0] * zoomState.k;
    const y = zoomState.y + coords[1] * zoomState.k;
    return { x, y };
  }, [projection, zoomState]);

  const transformStr = `translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* News cards overlay */}
      {showNewsOnMap && news.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'hidden' }}
        >
          {Array.from(newsByPrefecture.entries()).map(([prefCode, prefNews]) => {
            const coords = getScreenCoords(prefCode);
            if (!coords) return null;
            
            // Limit to latest 2 news per prefecture
            const displayNews = prefNews.slice(0, 2);
            
            return displayNews.map((item, index) => (
              <div
                key={item.id}
                className="pointer-events-auto absolute"
                style={{
                  left: coords.x - 128, // Half of card width (w-64 = 256px)
                  top: coords.y - 100 + index * 180, // Offset for multiple cards
                  transform: 'scale(0.6)',
                  transformOrigin: 'top left',
                }}
              >
                <MapNewsCard item={item} />
              </div>
            ));
          })}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full"
        style={{ maxHeight: 'calc(100vh - 120px)', touchAction: 'none', overflow: 'hidden' }}
      >
        <g transform={transformStr}>
          <rect
            x={-WIDTH}
            y={-HEIGHT}
            width={WIDTH * 3}
            height={HEIGHT * 3}
            fill="transparent"
            onClick={handleBackgroundClick}
          />
          <g ref={mapGroupRef} />
        </g>
      </svg>

      {/* News toggle button */}
      <button
        onClick={toggleNewsVisibility}
        className="absolute bottom-4 right-20 px-3 py-2 bg-slate-800/90 backdrop-blur-sm text-white text-sm rounded-lg border border-cyan-500/30 hover:bg-slate-700 transition-colors z-10"
        style={{ minWidth: '100px' }}
        title={showNewsOnMap ? 'ニュースカードを非表示にする' : 'ニュースカードを表示する'}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          {showNewsOnMap ? 'ON' : 'OFF'}
        </span>
      </button>

      <ZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
      />
    </div>
  );
}
