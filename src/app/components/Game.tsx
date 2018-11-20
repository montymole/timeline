
import * as React from 'react';
import { observer } from 'mobx-react';
import { World, Dungeon, Hud, CSSActor } from './';

@observer
export class Game extends React.Component<any, any> {
  tiles: any;
  async componentWillMount () {
    const seed = window.location.href.split('#')[1];
    const { gameState } = this.props;
    await gameState.createDungeonArea(seed);
    gameState.bindKeyboardEvents();
  }

  async componentWillUnmount () {
    const { gameState } = this.props;
    gameState.unbindKeyboardEvents();
  }

  saveWorld (world) {
    this.props.gameState.saveWorld(world);
  }

  render () {
    const { gameState } = this.props;
    const { world, dungeonMap, tiles, cameraPosition } = gameState;
    return (
      <div>
        <World
          onInit={world => this.saveWorld(world)}
          gravity={{ x: 0, y: 0, z: -9.8 }}
          camera={cameraPosition}
          width={1024}
          height={800}>
          {tiles && tiles.length && <Dungeon world={world} tiles={tiles} />}
          <CSSActor world={world} position={{ x: 0, y: 0, z: 0 }}>
            <div className="compass">
              <div className="n">N</div>
              <div className="e">E</div>
              <div className="w">W</div>
              <div className="s">S</div>
              <h1>{dungeonMap && dungeonMap.seed}</h1>
            </div>
          </CSSActor>
          <Hud>

            <div className="miniMap"><div>
              {tiles && tiles.map((tile) => <div className="tile" key={tile.key} style={{ left: tile.x * 8 + 'px', top: tile.y * 8 + 'px' }}>{tile.symbol}</div>)}
            </div></div>
          </Hud>
        </World>
      </div >
    );
  }
}
