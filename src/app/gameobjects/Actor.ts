import * as THREE from 'three';
import * as CANNON from 'cannon';
export class Actor extends THREE.Object3D {
  mesh: any;            // mesh
  material: any;        // material
  body: any;            // physics body
  shape: any;           // physics shape
  constructor(props) {
    super();
    this.init(props);
    this.update(props);
  }
  init (props) {
    const { world, mass = 0, position, type = 'CUBE', material } = props;
    let geometry;
    let shape;
    // graphics
    if (material) {
      this.material = new THREE[material.shader](material.props);
    }
    switch (type) {
      case 'PLANE':
        geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
        shape = new CANNON.Plane();
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.scale.set(100, 100, 100);
        break;
      case 'CUBE':
      default:
        geometry = new THREE.CubeGeometry(2, 2, 2);
        shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        this.mesh = new THREE.Mesh(geometry, this.material);
        break;
    }
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    const mesh = this.mesh;
    if (mesh.children) {
      for (let i = 0; i < mesh.children.length; i += 1) {
        mesh.children[i].castShadow = true;
        mesh.children[i].receiveShadow = true;
        if (mesh.children[i]) {
          for (let j = 0; j < mesh.children[i].length; j += 1) {
            mesh.children[i].children[j].castShadow = true;
            mesh.children[i].children[j].receiveShadow = true;
          }
        }
      }
    }
    this.add(this.mesh);
    // physics
    this.body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });
    if (world && world.physics) world.physics.addBody(this.body);
    if (world && world.scene) world.scene.add(this);
  }
  update (props) {
    const { position, rotation } = props;
    if (position) {
      this.body.position.x = position.x;
      this.body.position.y = position.y;
      this.body.position.z = position.z;
    }
    if (rotation) {
      this.rotation.x = rotation.x;
      this.rotation.y = rotation.y;
      this.rotation.z = rotation.z;
    }
  }
  // this is called every frame;
  renderAnimationFrame (clock) {
    this.position.x = this.body.position.x;
    this.position.y = this.body.position.y;
    this.position.z = this.body.position.z;
    this.quaternion.x = this.body.quaternion.x;
    this.quaternion.y = this.body.quaternion.y;
    this.quaternion.z = this.body.quaternion.z;
    this.quaternion.w = this.body.quaternion.w;
  }
}
