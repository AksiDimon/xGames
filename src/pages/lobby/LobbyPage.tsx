// src/pages/lobby/LobbyPage.tsx
import styles from './lobby.module.css';
import { useCallback, useState } from 'react';
import { usePixiBridge } from '../../pixi/usePixiBridge';
import type { PixiBridgeOptions } from '../../pixi/usePixiBridge';
import { createBackground } from './background';
import { createTopBarSprite } from './topBar';
import { Jeckpots } from './Jackpots';
import { Container, type Ticker } from 'pixi.js';
import { createLogoSpriteSystem } from './LogoAnimateSprite';
import { createGamesCarouselSystem } from './GamesCarousel';
import { createFooterSystem } from './footer/createFooterContainer';
import { fitToViewport } from '../../pixi/fitToViewport';

const DESIGN_WIDTH = 2560;
const DESIGN_HEIGHT = 1440;
function LobbyPage() {
  const [uiTransform, setUiTransform] = useState({
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const createScene = useCallback<
    PixiBridgeOptions<unknown, typeof uiTransform>['createScene']
  >(async ({ app, sendToReact }) => {
    const root = new Container();
    app.stage.addChild(root);

    const bgSystem = createBackground({
      moveSpeed: 0.0006,
      offsetXRatio: 0.15,
      offsetYRatio: 0.2,
      minScale: 1,
      maxScale: 1.65,
    });
    const topBar = createTopBarSprite({
      barHeightPx: 120,
      yOffsetPx: 75,
      designWidth: DESIGN_WIDTH,
      parent: root,
    });

    const logoYRatio = 0.17;
    const logo = createLogoSpriteSystem({
      xRatio: 0.47,
      yRatio: logoYRatio,
      scale: 0.9,
      sprite: { fps: 12 },
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
      parent: root,
    });

    const games = createGamesCarouselSystem({
      yOffsetPx: DESIGN_HEIGHT * logoYRatio + 220,
      heightPx: 580,
      onPrev: () => console.log('prev'),
      onNext: () => console.log('next'),
      cols: 4,
      rows: 3,
      gapX: 98,
      gapY: 28,
      sideInsetPx: 64,
      designWidth: DESIGN_WIDTH,
      parent: root,
    });
    const footer = createFooterSystem({
      heightPx: 160,
      onButton1: () => console.log('button1'),
      onButton2: () => console.log('button2'),
      gap: 6,
      padding: 0,
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
      parent: root,
    });

    await bgSystem.init(app);
    await topBar.init(app);
    await logo.init(app);
    await games.init(app);
    await footer.init(app);

    const disposeFit = fitToViewport({
      app,
      root,
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
      container: app.canvas.parentElement ?? document.body,
      onResize: ({ scaleX, scaleY, offsetX, offsetY }) => {
        sendToReact({ scaleX, scaleY, offsetX, offsetY });
        bgSystem.resize();
      },
    });

    const handleTick = (ticker: Ticker) => {
      const delta = typeof ticker === 'number' ? ticker : ticker?.delta ?? 1;
      bgSystem.update(delta);
    };
    app.ticker.add(handleTick);

    return () => {
      disposeFit();
      app.ticker.remove(handleTick);
      bgSystem.destroy();
      topBar.destroy();
      logo.destroy();
      games.destroy();
      footer.destroy();
      root.destroy({ children: true });
    };
  }, []);

  const { containerRef } = usePixiBridge<unknown, typeof uiTransform>({
    background: '#000',
    createScene,
    onMessage: setUiTransform,
  });

  return (
    <section className={styles.wrapper}>
      <Jeckpots transform={uiTransform} designWidth={DESIGN_WIDTH} />

      <div ref={containerRef} className={styles.lobbyContainer} />
    </section>
  );
}

export default LobbyPage;
