import { BitmapText, Container, Sprite, type Texture } from 'pixi.js';

type LeftNavGroup = {
  group: Container;
  layout(): void;
};

export function createLeftNavGroup(args: {
  navTex: Texture;
  flagTex: Texture;
  gridTex: Texture;
  pressedTex: Texture;
}): LeftNavGroup {
  const { navTex, flagTex, gridTex, pressedTex } = args;

  const group = new Container();
  const bg = new Sprite(navTex);
  const content = new Container();

  const balanceLabel = new BitmapText({
    text: 'BALANCE',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 28,
      fill: 'orange',
    },
  });
  const balanceValue = new BitmapText({
    text: '9925',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 34,
    },
  });
  const flagSprite = new Sprite(flagTex);
  const gridSprite = new Sprite(gridTex);
  const cashbackGroup = new Container();
  const cashbackButton = new Sprite(pressedTex);
  cashbackButton.tint = '#c8a6eaff';
  const cashbackText = new BitmapText({
    text: 'CASHBACKBONUSE\n1300',
    style: {
      fontFamily: 'Impact-Regular-White',
      fontSize: 18,
      align: 'center',
    },
  });

  bg.anchor.set(0.5, 0.5);
  content.position.set(-navTex.width / 2, -navTex.height / 2);

  cashbackGroup.addChild(cashbackButton);
  cashbackGroup.addChild(cashbackText);

  content.addChild(balanceLabel);
  content.addChild(flagSprite);
  content.addChild(gridSprite);
  content.addChild(balanceValue);
  content.addChild(cashbackGroup);

  group.addChild(bg);
  group.addChild(content);

  const layout = () => {
    const P = 14;
    const GAP = 10;
    const iconScale = 0.2;
    const btnScale = 0.55;

    flagSprite.scale.set(iconScale);
    gridSprite.scale.set(0.4);
    cashbackButton.scale.set(btnScale);
    cashbackText.scale.set(1.23);
    balanceValue.scale.set(1.4);
    balanceLabel.scale.set(1.8);

    balanceLabel.position.set(P, P - 10);
    flagSprite.position.set(balanceLabel.x + balanceLabel.width + GAP + 40, P);
    gridSprite.position.set(flagSprite.x + flagSprite.width + GAP + 10, P);

    balanceValue.position.set(P + 45, navTex.height - P - balanceValue.height);
    const btnW = pressedTex.width * btnScale;
    const btnH = pressedTex.height * btnScale;
    cashbackGroup.position.set(
      navTex.width - P - btnW + 6,
      navTex.height - P - btnH + 25
    );
    cashbackButton.position.set(0, 0);
    cashbackText.position.set(
      Math.max(0, (btnW - cashbackText.width) / 2),
      Math.max(0, (btnH - cashbackText.height) / 2)
    );
  };

  return { group, layout };
}
