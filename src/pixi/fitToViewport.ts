import type { Application, Container } from 'pixi.js';

type FitToViewportOptions = {
  app: Application;
  root: Container;
  designWidth: number;
  designHeight: number;
  container: HTMLElement;
  onResize?: (args: {
    viewW: number;
    viewH: number;
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
  }) => void;
};

export function fitToViewport({
  app,
  root,
  designWidth,
  designHeight,
  container,
  onResize,
}: FitToViewportOptions): () => void {
  let prevW = 0;
  let prevH = 0;

  const handleResize = () => {
    const viewW = container.clientWidth;
    const viewH = container.clientHeight;
    if (!viewW || !viewH) return;

    app.renderer.resize(viewW, viewH);

    if (viewW !== prevW) {
      root.scale.x = viewW / designWidth;
    }
    if (viewH !== prevH) {
      root.scale.y = viewH / designHeight;
    }
    prevW = viewW;
    prevH = viewH;

    root.position.set(
      (viewW - designWidth * root.scale.x) / 2,
      (viewH - designHeight * root.scale.y) / 2
    );

    onResize?.({
      viewW,
      viewH,
      scaleX: root.scale.x,
      scaleY: root.scale.y,
      offsetX: root.position.x,
      offsetY: root.position.y,
    });
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
