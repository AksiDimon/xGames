import type { Application, Container } from 'pixi.js';

type FitToViewportOptions = {
  app: Application;
  root: Container;
  designWidth: number;
  designHeight: number;
  container: HTMLElement;
};

export function fitToViewport({
  app,
  root,
  designWidth,
  designHeight,
  container,
}: FitToViewportOptions): () => void {
  const handleResize = () => {
    const viewW = container.clientWidth;
    const viewH = container.clientHeight;
    if (!viewW || !viewH) return;

    app.renderer.resize(viewW, viewH);

    // Scale only by X to keep design Y size stable.
    const scaleX = viewW / designWidth;
    root.scale.set(scaleX, 1);

    // Anchor the design center so scaling happens from the middle (X).
    root.pivot.set(designWidth / 2, designHeight / 2);

    // Keep Y unscaled: align to top so upper UI stays visible.
    root.position.set(viewW / 2, designHeight / 2);
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
