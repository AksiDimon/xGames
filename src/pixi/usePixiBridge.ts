import { Application } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

export type PixiBridgeOptions<TReactToPixi, TPixiToReact> = {
  background?: string;
  initialData?: TReactToPixi;
  onMessage?: (message: TPixiToReact) => void;
  createScene: (context: {
    app: Application;
    onReactData: (listener: (payload: TReactToPixi) => void) => () => void;
    sendToReact: (message: TPixiToReact) => void;
  }) => void | (() => void) | Promise<void | (() => void)>;
};

type PixiBridgeReturn<TReactToPixi> = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  sendToPixi: (payload: TReactToPixi) => void;
  app: Application | null;
  ready: boolean;
};

/**
 * Хук-адаптер для обмена данными между React и Pixi.
 * React -> Pixi: sendToPixi(payload) отправляет данные всем слушателям в сцене.
 * Pixi -> React: внутри createScene вызывайте sendToReact(message).
 */
export function usePixiBridge<TReactToPixi = unknown, TPixiToReact = unknown>(
  options: PixiBridgeOptions<TReactToPixi, TPixiToReact>
): PixiBridgeReturn<TReactToPixi> {
  const {
    background = '#0b1221',
    createScene,
    initialData,
    onMessage,
  } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const listenersRef = useRef<Set<(payload: TReactToPixi) => void>>(new Set());
  const lastPayloadRef = useRef<TReactToPixi | undefined>(initialData);
  const [ready, setReady] = useState(false);

  const sendToPixi = useCallback((payload: TReactToPixi) => {
    lastPayloadRef.current = payload;
    listenersRef.current.forEach((listener) => listener(payload));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const app = new Application();
    appRef.current = app;

    let destroyScene: void | (() => void);
    let initialized = false;
    let canvas: HTMLCanvasElement | null = null;

    const bootstrap = async () => {
      try {
        await app.init({
          background,
          resizeTo: container,
        });
        if (disposed) return;

        // Вставляем canvas, не трогая сам контейнер, чтобы React не ломал дерево
        canvas = app.canvas ?? null;
        if (canvas && !container.contains(canvas)) {
          container.appendChild(canvas);
        }

        const onReactData = (listener: (payload: TReactToPixi) => void) => {
          listenersRef.current.add(listener);
          if (lastPayloadRef.current !== undefined) {
            listener(lastPayloadRef.current);
          }
          return () => listenersRef.current.delete(listener);
        };

        const sendToReact = (message: TPixiToReact) => {
          onMessage?.(message);
        };

        destroyScene = await createScene({ app, onReactData, sendToReact });
        setReady(true);
        initialized = true;
      } catch (error) {
        console.error('Pixi bootstrap failed', error);
        setReady(false);
      }
    };

    bootstrap();

    return () => {
      disposed = true;
      setReady(false);
      destroyScene?.();
      listenersRef.current.clear();
      if (appRef.current === app) {
        const current = appRef.current;
        appRef.current = null;
        if (initialized && current && typeof current.destroy === 'function') {
          try {
            current.destroy(true);
          } catch (err) {
            console.error('Pixi destroy failed', err);
          }
        }
      }
      // Не трогаем DOM, React сам удалит контейнер; если canvas ещё в контейнере, его удалит GC.
    };
  }, [background, createScene, onMessage]);

  return { containerRef, sendToPixi, app: appRef.current, ready };
}
