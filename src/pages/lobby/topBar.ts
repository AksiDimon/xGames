import {
  Assets,
  Container,
  Sprite,
  type Application,
  type Texture,
} from 'pixi.js';
import { createProvidersCarousel } from './providersCarousel';

const topBarImg = '/raw-assets/common/top-bar.png';
const buttonImg = '/raw-assets/common/button-primary_pressed.png';
const arrowImg = '/raw-assets/common/provider-icon-arrow-highlight.png';

const arrProviders = [
  '/raw-assets/providers/-1.png',
  '/raw-assets/providers/Aviatrix.png',
  '/raw-assets/providers/amatic.png',
  '/raw-assets/providers/apollo.png',
  '/raw-assets/providers/aristocrat.png',
  '/raw-assets/providers/austria.png',
  '/raw-assets/providers/betsoft.png',
  '/raw-assets/providers/booongo.png',
  '/raw-assets/providers/cq9gaming.png',
  '/raw-assets/providers/crash_games.png',
  '/raw-assets/providers/egt.png',
  '/raw-assets/providers/evoplay.png',
  '/raw-assets/providers/fishing.png',
  '/raw-assets/providers/gaminator.png',
  '/raw-assets/providers/hacksaw.png',
  '/raw-assets/providers/igrosoft.png',
  '/raw-assets/providers/igt.png',
  '/raw-assets/providers/kajot.png',
  '/raw-assets/providers/konami.png',
  '/raw-assets/providers/mascot.png',
  '/raw-assets/providers/mga_games.png',
  '/raw-assets/providers/microgaming.png',
  '/raw-assets/providers/netent.png',
  '/raw-assets/providers/nolimit_city.png',
  '/raw-assets/providers/novoline.png',
  '/raw-assets/providers/novomatic.png',
  '/raw-assets/providers/play_and_go.png',
  '/raw-assets/providers/playson.png',
  '/raw-assets/providers/playtech.png',
  '/raw-assets/providers/pragmatic.png',
  '/raw-assets/providers/push_gaming.png',
  '/raw-assets/providers/quickspin.png',
  '/raw-assets/providers/red_rake.png',
  '/raw-assets/providers/relax_gaming.png',
  '/raw-assets/providers/spadegaming.png',
  '/raw-assets/providers/wazdan.png',
  '/raw-assets/providers/wmg.png',
];

export type TopBarSpriteSystem = {
  init(app: Application): Promise<void>;
  resize(): void;
  destroy(): void;
};

type Config = {
  yOffsetPx?: number; // насколько опустить вниз (высота jackpots)
  btnPaddingPx?: number; // отступ кнопок от краёв бара (в “пикселях текстуры бара”)
  btnHeightRatio?: number;
  barHeightPx?: number;
  designWidth?: number;
  parent?: Container;
};

export function createTopBarSprite(config: Config = {}): TopBarSpriteSystem {
  let app: Application | null = null;
  let root: Container | null = null;
  let bar: Sprite | null = null;
  let btnLeft: Sprite | null = null;
  let btnRight: Sprite | null = null;
  let arrowLeft: Sprite | null = null;
  let arrowRight: Sprite | null = null;
  let parent: Container | null = null;

  const providersCarousel = createProvidersCarousel({
    providers: arrProviders,
    gapPx: 12,
    logoHeightRatio: 0.8,
    sideInsetPx: 10,
    stepRatio: 0.4,
    ease: 0.12,
  });

  const yOffsetPx = config.yOffsetPx ?? 75;
  const barHeightPx = config.barHeightPx ?? 75;
  const designWidth = config.designWidth ?? 2560;

  const btnPaddingPx = config.btnPaddingPx ?? 2;
  const layout = () => {
    if (
      !app ||
      !root ||
      !bar ||
      !btnLeft ||
      !btnRight ||
      !arrowLeft ||
      !arrowRight
    ) {
      return;
    }
    const sw = designWidth;

    // 1) bar — как раньше
    root.position.set(0, yOffsetPx);
    root.scale.set(1);

    bar.anchor.set(0, 0);
    bar.position.set(0, 0);
    bar.width = sw;
    bar.height = barHeightPx;

    // 2) кнопки — фиксированный масштаб в координатах дизайна
    btnLeft.scale.set(1, 0.6);
    btnRight.scale.set(1, 0.6);

    // 3) якоря/позиции
    btnLeft.anchor.set(0, 0.55);
    btnRight.anchor.set(1, 0.55);

    const centerY = barHeightPx / 2;
    btnLeft.position.set(btnPaddingPx, centerY);
    btnRight.position.set(bar.width - btnPaddingPx, centerY);

    arrowLeft.anchor.set(0.5, 1.1);
    arrowRight.anchor.set(1.6, 1.1);

    const centerBtnX = btnLeft.texture.width / 2;
    const centerBtnY = btnLeft.texture.height / 2;

    arrowLeft.position.set(centerBtnX, centerBtnY);
    arrowRight.position.set(centerBtnX, centerBtnY);
    const arrowWidthRatio = 0.9;
    const arrowScale =
      (btnLeft.texture.width * arrowWidthRatio) / arrowLeft.texture.width;

    arrowLeft.scale.set(arrowScale);
    arrowRight.scale.set(arrowScale);
    arrowLeft.scale.x *= -1;

    providersCarousel.layout({ barWidthPx: bar.width, barHeightPx });
  };

  return {
    async init(nextApp: Application) {
      try {
        app = nextApp;
        parent = config.parent ?? app.stage;
        const [barTex, btnTex, arrowTex] = await Promise.all([
          Assets.load(topBarImg),
          Assets.load(buttonImg),
          Assets.load(arrowImg),
        ]);
        root = new Container();

        bar = new Sprite(barTex);
        btnLeft = new Sprite(btnTex);
        btnRight = new Sprite(btnTex);
        arrowLeft = new Sprite(arrowTex);
        arrowRight = new Sprite(arrowTex);

        // Добавляем на сцену (после фона), чтобы было видно

        root.addChild(bar);
        root.addChild(btnLeft);
        root.addChild(btnRight);
        btnLeft.addChild(arrowLeft);
        btnRight.addChild(arrowRight);
        parent.addChild(root);

        await providersCarousel.init({
          app,
          parent: root,
          btnLeft,
          btnRight,
          barHeightPx,
        });

        layout();
      } catch (e) {
        console.error('topBar init failed', e);
      }
    },

    resize() {
      layout();
    },

    destroy() {
      if (root) {
        root.destroy({ children: true, texture: false });
        root = null;
      }
      bar = null;
      btnLeft = null;
      btnRight = null;
      arrowLeft = null;
      arrowRight = null;
      app = null;
      providersCarousel.destroy();
    },
  };
}
