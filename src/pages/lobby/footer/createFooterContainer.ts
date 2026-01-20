import {
  Assets,
  Container,
  Sprite,
  type Application,
  type Texture,
} from 'pixi.js';

const footerNavImg = '/raw-assets/common/footer-nav.png';
const wagerImg = '/raw-assets/common/wager-box.png';
const buttonImg = '/raw-assets/common/button-primary_default.png';

type FooterLayoutArgs = {
  width: number;
  height: number;
  gap?: number;
  padding?: number;
};

type FooterConfig = {
  gap?: number;
  padding?: number;
  onButton1?: () => void;
  onButton2?: () => void;
};

export type FooterContainerSystem = {
  container: Container;
  layout(args: FooterLayoutArgs): void;
  destroy(): void;
};

export async function createFooterContainer(
  config: FooterConfig = {}
): Promise<FooterContainerSystem> {
  const container = new Container();
  const innerGroup = new Container();

  const [navTex, wagerTex, buttonTex] = await Promise.all([
    Assets.load(footerNavImg),
    Assets.load(wagerImg),
    Assets.load(buttonImg),
  ]);

  const leftNav = new Sprite(navTex);
  const rightNav = new Sprite(navTex);
  const wagerBox = new Sprite(wagerTex);
  const button1 = new Sprite(buttonTex);
  const button2 = new Sprite(buttonTex);

  const onButton1 = config.onButton1 ?? (() => console.log('button1'));
  const onButton2 = config.onButton2 ?? (() => console.log('button2'));

  const setupButtons = () => {
    button1.eventMode = 'static';
    button2.eventMode = 'static';
    button1.cursor = 'pointer';
    button2.cursor = 'pointer';
    button1.on('pointerdown', onButton1);
    button2.on('pointerdown', onButton2);
  };

  const removeButtons = () => {
    button1.off('pointerdown', onButton1);
    button2.off('pointerdown', onButton2);
  };

  container.addChild(leftNav);
  container.addChild(innerGroup);
  container.addChild(rightNav);

  innerGroup.addChild(wagerBox);
  innerGroup.addChild(button1);
  innerGroup.addChild(button2);

  setupButtons();

  const layout = ({ width, height, gap, padding }: FooterLayoutArgs) => {
    const innerGap = gap ?? config.gap ?? 16;
    const innerPadding = padding ?? config.padding ?? 16;

    const navScaleY = Math.min(1, height / navTex.height);
    const navScaleX = navScaleY;
    leftNav.scale.set(navScaleX, navScaleY);
    rightNav.scale.set(-navScaleX, navScaleY);

    leftNav.anchor.set(0.5, 0.5);
    rightNav.anchor.set(0.5, 0.5);

    const leftNavW = Math.abs(leftNav.width);
    const rightNavW = Math.abs(rightNav.width);

    leftNav.position.set(innerPadding + leftNavW / 2, height / 2);
    rightNav.position.set(width - innerPadding - rightNavW / 2, height / 2);

    // Layout inner group at scale 1 first.
    const wagerScale = 1.15;
    const buttonScale = 1 / 1.5;

    wagerBox.scale.set(wagerScale);
    button1.scale.set(buttonScale);
    button2.scale.set(buttonScale);

    const wagerW = wagerTex.width * wagerScale;
    const wagerH = wagerTex.height * wagerScale;
    const buttonW = buttonTex.width * buttonScale;
    const buttonH = buttonTex.height * buttonScale;

    wagerBox.anchor.set(0, 0);
    button1.anchor.set(0, 0);
    button2.anchor.set(0, 0);

    const MARGIN_BUTTONS = 100;
    const MARGIN_BUTTONS_TOP = 30;
    wagerBox.position.set(0, 0);
    button1.position.set(
      wagerW + innerGap + MARGIN_BUTTONS,
      MARGIN_BUTTONS_TOP
    );
    button2.position.set(
      wagerW + innerGap + buttonW + innerGap + MARGIN_BUTTONS,
      MARGIN_BUTTONS_TOP
    );

    const innerW = wagerW + buttonW * 2 + innerGap * 2;
    const innerH = Math.max(wagerH, buttonH);

    const leftEdge = leftNav.x + leftNavW / 2 + innerGap;
    const rightEdge = rightNav.x - rightNavW / 2 - innerGap;
    const availableW = Math.max(0, rightEdge - leftEdge);

    const innerScaleX = Math.min(1, availableW > 0 ? availableW / innerW : 0);
    innerGroup.scale.set(innerScaleX, 1);
    const innerLeft = leftEdge + (availableW - innerW * innerScaleX) / 2;
    const innerTop = height - innerH;

    // innerGroup.scale.set(innerScaleX, 1);
    // const innerLeft = leftEdge + (availableW - innerW * innerScaleX) / 2;
    // const innerTop = height - innerH;
    innerGroup.position.set(innerLeft, innerTop);
  };

  return {
    container,
    layout,
    destroy() {
      removeButtons();
      container.destroy({ children: true, texture: false });
    },
  };
}

type FooterSceneConfig = FooterConfig & {
  yOffsetPx?: number | ((app: Application) => number);
  heightPx?: number;
  designWidth?: number;
  designHeight?: number;
  parent?: Container;
};

export type FooterSceneSystem = {
  init(app: Application): Promise<void>;
  resize(): void;
  destroy(): void;
};

export function createFooterSystem(
  config: FooterSceneConfig = {}
): FooterSceneSystem {
  let app: Application | null = null;
  let footer: FooterContainerSystem | null = null;
  let parent: Container | null = null;

  const designWidth = config.designWidth ?? 2560;
  const designHeight = config.designHeight ?? 1440;
  const heightPx = config.heightPx ?? 120;
  const yOffsetPx =
    config.yOffsetPx ?? ((_app: Application) => designHeight - heightPx - 5);

  const layout = () => {
    if (!app || !footer) return;
    const y = typeof yOffsetPx === 'function' ? yOffsetPx(app) : yOffsetPx;
    footer.layout({ width: designWidth, height: heightPx });
    footer.container.position.set(0, y);
  };

  return {
    async init(nextApp: Application) {
      app = nextApp;
      footer = await createFooterContainer(config);
      parent = config.parent ?? app.stage;
      parent.addChild(footer.container);
      layout();
    },

    resize() {
      layout();
    },

    destroy() {
      if (footer) {
        footer.destroy();
        footer = null;
      }
      app = null;
    },
  };
}
