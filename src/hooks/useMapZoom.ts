import { useState, useCallback, useRef, useEffect } from 'react';

interface ZoomState {
  x: number;
  y: number;
  k: number;
}

interface UseMapZoomOptions {
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
}

export function useMapZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  options: UseMapZoomOptions
) {
  const { width, height, minZoom = 1, maxZoom = 8 } = options;
  
  const [zoomState, setZoomState] = useState<ZoomState>({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoomState((prev) => ({
      ...prev,
      k: Math.min(prev.k * 1.5, maxZoom),
    }));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => ({
      ...prev,
      k: Math.max(prev.k / 1.5, minZoom),
    }));
  }, [minZoom]);

  const resetZoom = useCallback(() => {
    setZoomState({ x: 0, y: 0, k: 1 });
  }, []);

  const zoomToPoint = useCallback((x: number, y: number, k: number) => {
    const newK = Math.min(Math.max(k, minZoom), maxZoom);
    const newX = width / 2 - x * newK;
    const newY = height / 2 - y * newK;
    setZoomState({ x: newX, y: newY, k: newK });
  }, [width, height, minZoom, maxZoom]);

  // Mouse wheel zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomState((prev) => ({
        ...prev,
        k: Math.min(Math.max(prev.k * delta, minZoom), maxZoom),
      }));
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [svgRef, minZoom, maxZoom]);

  // Mouse drag
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setZoomState((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    svg.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      svg.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [svgRef]);

  // Tier for different zoom levels
  const tier = zoomState.k < 2 ? 0 : zoomState.k < 4 ? 1 : 2;

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToPoint,
    tier,
  };
}