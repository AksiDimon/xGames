import {
  Assets,
  Container,
  Sprite,
  type Application,
  type Texture,
} from 'pixi.js';

const arrowImg = '/raw-assets/common/arrow.png';
const cardImg = '/raw-assets/common/game-border.png';

type LayoutArgs = {
  width: number;
  height: number;
};

type GamesCarouselConfig = {
  cols?: number;
  rows?: number;
  gapX?: number;
  gapY?: number;
  sideInsetPx?: number;
  arrowInsetPx?: number;
  arrowHeightRatio?: number;
  maxScale?: number;
  onPrev?: () => void;
  onNext?: () => void;
};

export type GamesCarouselSystem = {
  container: Container;
  init(): Promise<void>;
  layout(args: LayoutArgs): void;
  destroy(): void;
};

export function createGamesCarousel(
  config: GamesCarouselConfig = {}
): GamesCarouselSystem {
  const container = new Container();
  const gridContainer = new Container();

  let leftArrow: Sprite | null = null;
  let rightArrow: Sprite | null = null;
  let cards: Sprite[] = [];
  let arrowTex: Texture | null = null;
  let cardTex: Texture | null = null;

  const cols = config.cols ?? 3;
  const rows = config.rows ?? 4;
  const gapX = config.gapX ?? 16;
  const gapY = config.gapY ?? 16;
  const sideInsetPx = config.sideInsetPx ?? 24;
  const arrowInsetPx = config.arrowInsetPx ?? 0;
  const arrowHeightRatio = config.arrowHeightRatio ?? 0.5;
  const maxScale = config.maxScale ?? 1;

  const onPrev = config.onPrev ?? (() => console.log('prev'));
  const onNext = config.onNext ?? (() => console.log('next'));

  const buildGrid = () => {
    if (!cardTex) return;
    cards = [];
    gridContainer.removeChildren();

    const cardW = cardTex.width;
    const cardH = cardTex.height;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const card = new Sprite(cardTex);
        card.anchor.set(0, 0);
        card.position.set(c * (cardW + gapX), r * (cardH + gapY));
        cards.push(card);
        gridContainer.addChild(card);
      }
    }
  };

  const ensureInteractivity = () => {
    if (!leftArrow || !rightArrow) return;
    leftArrow.eventMode = 'static';
    rightArrow.eventMode = 'static';
    leftArrow.cursor = 'pointer';
    rightArrow.cursor = 'pointer';
    leftArrow.on('pointerdown', onPrev);
    rightArrow.on('pointerdown', onNext);
  };

  const removeInteractivity = () => {
    if (!leftArrow || !rightArrow) return;
    leftArrow.off('pointerdown', onPrev);
    rightArrow.off('pointerdown', onNext);
  };

  const layout = ({ width, height }: LayoutArgs) => {
    if (!leftArrow || !rightArrow || !cardTex || !arrowTex) return;

    const cardW = cardTex.width;
    const cardH = cardTex.height;
    const gridW = cols * cardW + gapX * (cols - 1);
    const gridH = rows * cardH + gapY * (rows - 1);

    const arrowScaleRaw = (height * arrowHeightRatio) / arrowTex.height;
    const arrowScale = Math.min(maxScale, arrowScaleRaw);

    leftArrow.scale.set(-arrowScale, arrowScale);
    rightArrow.scale.set(arrowScale, arrowScale);

    leftArrow.anchor.set(0.5, 0.5);
    rightArrow.anchor.set(0.5, 0.5);

    const leftArrowW = Math.abs(leftArrow.width);
    const rightArrowW = Math.abs(rightArrow.width);

    leftArrow.position.set(arrowInsetPx + leftArrowW / 2, height / 2);
    rightArrow.position.set(width - arrowInsetPx - rightArrowW / 2, height / 2);
    const leftEdge = leftArrow.x + leftArrowW / 2 + sideInsetPx;
    const rightEdge = rightArrow.x - rightArrowW / 2 - sideInsetPx;
    const availableW = Math.max(0, rightEdge - leftEdge);

    const scaleX = Math.min(maxScale, availableW > 0 ? availableW / gridW : 0);
    const scaleY = Math.min(1, (height / gridH) * 1.3);
    gridContainer.scale.set(scaleX, scaleY);
    const gridLeft = leftEdge + (availableW - gridW * scaleX) / 2;
    const gridTop = (height - gridH * scaleY) / 2;
    gridContainer.position.set(gridLeft, gridTop);
  };

  return {
    container,
    async init() {
      const [loadedArrow, loadedCard] = await Promise.all([
        Assets.load(arrowImg),
        Assets.load(cardImg),
      ]);
      arrowTex = loadedArrow;
      cardTex = loadedCard;

      leftArrow = new Sprite(arrowTex);
      rightArrow = new Sprite(arrowTex);

      container.addChild(leftArrow);
      container.addChild(gridContainer);
      container.addChild(rightArrow);

      buildGrid();
      ensureInteractivity();
    },

    layout,

    destroy() {
      removeInteractivity();
      container.destroy({ children: true, texture: false });
      cards = [];
      leftArrow = null;
      rightArrow = null;
      arrowTex = null;
      cardTex = null;
    },
  };
}

type GamesCarouselSystemConfig = GamesCarouselConfig & {
  yOffsetPx?: number | ((app: Application) => number);
  heightPx?: number;
};

export type GamesCarouselSceneSystem = {
  init(app: Application): Promise<void>;
  resize(): void;
  destroy(): void;
};

export function createGamesCarouselSystem(
  config: GamesCarouselSystemConfig = {}
): GamesCarouselSceneSystem {
  let app: Application | null = null;
  let carousel: GamesCarouselSystem | null = null;

  const yOffsetPx = config.yOffsetPx ?? 320;
  const heightPx = config.heightPx ?? 420;

  const layout = () => {
    if (!app || !carousel) return;
    const y = typeof yOffsetPx === 'function' ? yOffsetPx(app) : yOffsetPx;
    carousel.layout({ width: app.screen.width, height: heightPx });
    carousel.container.position.set(0, y);
  };

  return {
    async init(nextApp) {
      app = nextApp;
      carousel = createGamesCarousel(config);
      await carousel.init();
      app.stage.addChild(carousel.container);
      layout();
    },

    resize() {
      layout();
    },

    destroy() {
      if (carousel) {
        carousel.destroy();
        carousel = null;
      }
      app = null;
    },
  };
}
