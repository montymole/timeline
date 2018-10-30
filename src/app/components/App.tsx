
import * as React from 'react';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import World from './World';
import HTML3D from './HTML3D';
import GL3D from './GL3D';
import { default as FModController } from '../audio/FModController';

@observer
export class App extends React.Component<any, any> {
  fmod: FModController;
  sounds: any;
  gEventInstance: any;
  gSurfaceIndex: any;

  async componentWillMount () {
    this.sounds = {};
    this.fmod = new FModController({
      preloadFiles: [
        '/fmod/Master_Bank.bank',
        '/fmod/Master_Bank.strings.bank',
        '/fmod/Music.bank',
        '/fmod/SFX.bank'
      ],
      initApp: () => this.fmodMounted()
    });
    await this.props.appState.loadMaterials();
    await this.props.appState.loadObject(1);
  }
  fmodMounted () {
    const { fmod } = this;
    console.log('DO SOMETIN...');
    fmod.loadBank('Master_Bank.bank');
    fmod.loadBank('Master_Bank.strings.bank');
    fmod.loadBank('Music.bank');
    fmod.loadBank('SFX.bank');

    // ready music
    const musicInstance: any = {};
    const musicDescription: any = {};
    fmod.checkResult(fmod.gSystem.getEvent('event:/Music/Level 01', musicDescription));
    fmod.checkResult(musicDescription.val.createInstance(musicInstance));
    this.sounds.bgMusic = musicInstance.val;

    // get explosion
    const explosionDescription: any = {};
    fmod.checkResult(fmod.gSystem.getEvent('event:/Weapons/Explosion', explosionDescription));
    this.sounds.explosion = explosionDescription.val;
    this.sounds.explosion.loadSampleData();
    // start music
    fmod.checkResult(this.sounds.bgMusic.setParameterValue('Progression', 1.0));
    fmod.checkResult(this.sounds.bgMusic.setParameterValue('Stinger', 1.0));
    fmod.checkResult(this.sounds.bgMusic.start());
  }

  oneShot (snd, volume = 1, pitch = 1) {
    if (!snd) return;
    const inst: any = {};
    return [
      snd.createInstance(inst),
      inst.val.setPitch(pitch),
      inst.val.setVolume(volume),
      inst.val.start(),
      inst.val.release()
    ];
  }

  boxCollision (e) {
    const relativeVelocity = Math.abs(Math.round(e.contact.getImpactVelocityAlongNormal()));
    if (relativeVelocity > 0) {
      this.oneShot(this.sounds.explosion, relativeVelocity * 0.1, 3);
    }
  }

  letterCollision (e) {
    const relativeVelocity = Math.abs(Math.round(e.contact.getImpactVelocityAlongNormal()));
    if (relativeVelocity > 0) {
      this.oneShot(this.sounds.explosion, relativeVelocity * 0.01, 5);
    }
  }

  saveWorld (world) {
    this.props.appState.saveWorld(world);
  }

  render () {
    const { appState } = this.props;
    const world = appState && appState.world;
    const materials = appState && appState.materials;
    const objects3d = appState && appState.objects3d;
    if (!materials || !objects3d) return (<div style={{ margin: '25%' }}><h1>..loading</h1></div>);
    const test = 'HELLLOO WORLD JEEE JEE'.split('');
    return (
      <div>
        <World onInit={world => this.saveWorld(world)} gravity={{ x: 0, y: 0, z: -9.8 }}>
          <GL3D position={{ x: 0, y: 0, z: 0 }} mass={0} world={world} shape="PLANE" material={materials[0]} />
          {test.map((a, i) =>
            <HTML3D
              position={{ x: -20 + i * 2, y: 0, z: 10 * i }}
              world={world}
              mass={1}
              onCollide={e => this.letterCollision(e)}
            >
              <h1>{a}</h1>
            </HTML3D>)}
          {test.map((a, i) =>
            <GL3D
              position={{ x: 0, y: 10, z: 5 + i * 1.5 }}
              mass={1}
              world={world}
              shape="CUBE"
              material={materials[Math.round(Math.random() * materials.length)]}
              onCollide={e => this.boxCollision(e)} />)}
        </World>
        <DevTools />
        <div> Time {this.props.appState.timer}</div>
      </div >
    );
  }
  onReset = () => {
    this.props.appState.resetTimer();
  }
}

