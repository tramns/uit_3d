import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";

//Audio with Howler.js
const sounds = {
  backgroundMusic: new Howl({
    src: ["./sfx/music.ogg"],
    loop: true,
    volume: 0.3,
    preload: true,
  }),

  projectsSFX: new Howl({
    src: ["./sfx/projects.ogg"],
    volume: 0.5,
    preload: true,
  }),

  pokemonSFX: new Howl({
    src: ["./sfx/pokemon.ogg"],
    volume: 0.5,
    preload: true,
  }),

  jumpSFX: new Howl({
    src: ["./sfx/jumpsfx.ogg"],
    volume: 1.0,
    preload: true,
  }),
};

let touchHappened = false;

let isMuted = false;

function playSound(soundId) {
  if (!isMuted && sounds[soundId]) {
    sounds[soundId].play();
  }
}

function stopSound(soundId) {
  if (sounds[soundId]) {
    sounds[soundId].stop();
  }
}

//three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaec972);

const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

  // Physics stuff
  const GRAVITY = 30;
  const CAPSULE_RADIUS = 0.3;
  const CAPSULE_HEIGHT = 1;
  const JUMP_HEIGHT = 8;
  const MOVE_SPEED = 14;

let character = {
  instance: null,
  isMoving: false,
  spawnPosition: new THREE.Vector3(),
};
let targetRotation = Math.PI / 2;

const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADIUS
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

// Renderer Stuff
// See: https://threejs.org/docs/?q=render#api/en/constants/Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

// sau khi khởi tạo renderer:
renderer.setSize(window.innerWidth, window.innerHeight, false);

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);   // cập nhật canvas
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;

// Some of our DOM elements, others are scattered in the file
let isModalOpen = false;
const modal = document.querySelector(".modal");
const modalbgOverlay = document.querySelector(".modal-bg-overlay");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(
  ".modal-project-description"
);
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(
  ".modal-project-visit-button"
);
const themeToggleButton = document.querySelector(".theme-mode-toggle-button");
const firstIcon = document.querySelector(".first-icon");
const secondIcon = document.querySelector(".second-icon");

const audioToggleButton = document.querySelector(".audio-toggle-button");
const firstIconTwo = document.querySelector(".first-icon-two");
const secondIconTwo = document.querySelector(".second-icon-two");
// 1. Tải texture
const textureLoader = new THREE.TextureLoader();
const boardWidth = 8;  // Thêm khai báo kích thước
const boardHeight = 8; // Thêm khai báo kích thước

textureLoader.load('./logo.jpg', (texture) => {
  // 2. Cấu hình sau khi tải
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  // 3. Tạo vật liệu
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  // 4. Tạo mesh board
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth, boardHeight),
    material
  );
  board.position.set(-17, 4.5, -125);
  board.rotation.y = Math.PI;

  // 5. Tạo viền (border)
  const borderThickness = 0.2;
  const borderGeometry = new THREE.BoxGeometry(
    boardWidth + borderThickness * 2, 
    boardHeight + borderThickness * 2, 
    borderThickness
  );
  const borderMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x8B4513 // Màu nâu gỗ
  });
  const border = new THREE.Mesh(borderGeometry, borderMaterial);
  
  // Đặt border cùng vị trí với board nhưng lùi về sau một chút
  border.position.copy(board.position);
  border.rotation.copy(board.rotation);
  border.position.z += borderThickness * 0.6;

  // 6. Nhóm board và border lại
  const boardGroup = new THREE.Group();
  boardGroup.add(board);
  boardGroup.add(border);

  scene.add(boardGroup);
}, undefined, (error) => {
  console.error("Lỗi tải texture:", error);
});


// Modal stuff
const modalContent = {
  sign_UIT: {
    title: "🌞About UIT👋",
    content:
      "Established in 2006, the University of Information Technology (UIT) is a leading institution for Information Technology in Vietnam. The university currently offers nine academic programs, supported by a high-quality faculty and a modern learning environment.",
    link: "https://www.uit.edu.vn/",
  },
  sign_A: {
    title: "📋Toa A✏️",
    content:
      "Thư viện\nPhòng Đào Tạo\nPhòng Công tác Sinh Viên\n...",
    link: "https://example.com/",
  },
  sign_B: {
    title: "🌞Toa B😎",
    content:
      "Phòng B.102 \n Phòng B.104 \n Phòng B.106 \n....",
    link: "https://example.com/",
  },
  sign_C: {
    title: "💁‍♀️ Toa C",
    content:
      "C.103, C.105...",
  },
  sign_E: {
    title: "😎Toa E🌞",
    content:
      " Văn phòng khoa Khoa học Máy tính, Công nghệ Phần mềm, Kỹ thuật Máy tính....",
  },
};

function showModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    modalProjectDescription.textContent = content.content;

    if (content.link) {
      modalVisitProjectButton.href = content.link;
      modalVisitProjectButton.classList.remove("hidden");
    } else {
      modalVisitProjectButton.classList.add("hidden");
    }
    modal.classList.remove("hidden");
    modalbgOverlay.classList.remove("hidden");
    isModalOpen = true;
  }
}

function hideModal() {
  isModalOpen = false;
  modal.classList.add("hidden");
  modalbgOverlay.classList.add("hidden");
  if (!isMuted) {
    playSound("projectsSFX");
  }
}

// Our Intersecting objects
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
  "sign_UIT",
  "sign_A",
  "sign_B",
  "sign_E",
  "Squirtle",
  "Chicken",
  "Pikachu",
  "Bulbasaur",
  "Charmander",
  "daudau",
  "sign_C",
];

// Loading screen and loading manager
// See: https://threejs.org/docs/#api/en/loaders/managers/LoadingManager
const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.querySelector(".loading-text");
const enterButton = document.querySelector(".enter-button");
const instructions = document.querySelector(".instructions");

const manager = new THREE.LoadingManager();

manager.onLoad = function () {
  const t1 = gsap.timeline();

  t1.to(loadingText, {
    opacity: 0,
    duration: 0,
  });

  t1.to(enterButton, {
    opacity: 1,
    duration: 0,
  });
};

enterButton.addEventListener("click", () => {
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 0,
  });
  gsap.to(instructions, {
    opacity: 0,
    duration: 0,
    onComplete: () => {
      loadingScreen.remove();
    },
  });

  if (!isMuted) {
    playSound("projectsSFX");
    playSound("backgroundMusic");
  }
});

//Audio

// GLTF Loader
// See: https://threejs.org/docs/?q=glt#examples/en/loaders/GLTFLoader
const loader = new GLTFLoader(manager);

loader.load(
  "./y_uit_export.glb",
  function (glb) {

    // glb.scene.rotation.y = THREE.MathUtils.degToRad(30);
    glb.scene.traverse((child) => {
      // console.log("Object name:", child.name); // <-- dòng này để in ra tên object
      if (intersectObjectsNames.includes(child.name)) {
        intersectObjects.push(child);
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }

      if (child.name === "Character") {
        character.spawnPosition.copy(child.position);
        character.instance = child;
        
        // MAKE CHARACTER 8 TIMES LARGER
        character.instance.scale.set(8, 8, 8);
        
        playerCollider.start
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
        playerCollider.end
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
      }
      if (child.name === "Ground_Collider") {
        colliderOctree.fromGraphNode(child);
        child.visible = false;
      }
    });
    scene.add(glb.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);


const speechDiv = document.getElementById("speech");
const speechOffset = new THREE.Vector3(0, 2, 0); // vị trí phía trên đầu robot

//Robot
let robot;
const raycasterRobot = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isJumping = false;
let jumpUp = true;
let jumpHeight = 5;
let jumpSpeed = 1;
let originalY = 0;

const robotLoader = new GLTFLoader();

robotLoader.load( './robot.glb', function ( glb ) {
    robot = glb.scene;
    //Cast shadow
    glb.scene.traverse(( child ) => {
        if (child.isMesh){
            child.castShadow = true; 
            child.receiveShadow = true;
        }
    glb.scene.scale.set(2, 2, 2);
    glb.scene.position.set(-34, 0, -125);
    glb.scene.rotation.y = -Math.PI / 2;
    });
    scene.add( glb.scene );

}, undefined, function ( error ) {

  console.error( error );

} );

//Bus
const clock = new THREE.Clock();

const busLoader = new GLTFLoader();

let bus;

busLoader.load( './bus.glb', function ( glb ) {
    bus = glb.scene;
    //Cast shadow
    glb.scene.traverse(( child ) => {
        if (child.isMesh){
            child.castShadow = true; 
            child.receiveShadow = true;
        }
    glb.scene.scale.set(0.01, 0.01, 0.01);
    glb.scene.position.set(80, 0, -142);
    glb.scene.rotation.y = Math.PI / 2;

    });
    scene.add( glb.scene );

}, undefined, function ( error ) {

  console.error( error );

} );

// Lighting and Enviornment Stuff
// See: https://threejs.org/docs/?q=light#api/en/lights/DirectionalLight
// See: https://threejs.org/docs/?q=light#api/en/lights/AmbientLight
const sun = new THREE.DirectionalLight(0xffffff);
sun.castShadow = true;
sun.position.set(280, 200, -80);
sun.target.position.set(100, 0, -10);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -150;
sun.shadow.camera.right = 300;
sun.shadow.camera.top = 150;
sun.shadow.camera.bottom = -100;
sun.shadow.normalBias = 0.2;
scene.add(sun.target);
scene.add(sun);

// const shadowCameraHelper = new THREE.CameraHelper(sun.shadow.camera);
// scene.add(shadowCameraHelper);

// const sunHelper = new THREE.CameraHelper(sun);
// scene.add(sunHelper);

const light = new THREE.AmbientLight(0x404040, 2.7);
scene.add(light);

// Camera Stuff
// See: https://threejs.org/docs/?q=orth#api/en/cameras/OrthographicCamera
const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera(
  -aspect * 50,
  aspect * 50,
  50,
  -50,
  1,
  1000
);

camera.position.x = -91;
camera.position.y = 38;
camera.position.z = -165;

const cameraOffset = new THREE.Vector3(-13, 47, -67);

camera.zoom = 2.0;
camera.updateProjectionMatrix();

/************************************************** */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;    // cho phép inertia
controls.dampingFactor = 0.05;
controls.enableZoom    = false;    // tuỳ chỉnh nếu muốn
controls.enablePan     = false;   // tắt pan nếu không cần
controls.minPolarAngle = 0;      // Góc nghiêng tối thiểu (0 độ = nhìn từ trên xuống)
controls.maxPolarAngle = Math.PI / 2.6;
/************************************************* */


// Handle when window resizes
function onResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();

  // sau khi khởi tạo renderer:
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);   // cập nhật canvas
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Interact with Objects and Raycaster
// See: https://threejs.org/docs/?q=raycas#api/en/core/Raycaster
let isCharacterReady = true;

function jumpCharacter(meshID) {
  if (!isCharacterReady) return;

  const mesh = scene.getObjectByName(meshID);
  const jumpHeight = 2;
  const jumpDuration = 0.5;
  const isdaudau = meshID === "daudau";

  const currentScale = {
    x: mesh.scale.x,
    y: mesh.scale.y,
    z: mesh.scale.z,
  };

  const t1 = gsap.timeline();

  t1.to(mesh.scale, {
    x: isdaudau ? currentScale.x * 1.2 : 1.2,
    y: isdaudau ? currentScale.y * 0.8 : 0.8,
    z: isdaudau ? currentScale.z * 1.2 : 1.2,
    duration: jumpDuration * 0.2,
    ease: "power2.out",
  });

  t1.to(mesh.scale, {
    x: isdaudau ? currentScale.x * 0.8 : 0.8,
    y: isdaudau ? currentScale.y * 1.3 : 1.3,
    z: isdaudau ? currentScale.z * 0.8 : 0.8,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y + jumpHeight,
      duration: jumpDuration * 0.5,
      ease: "power2.out",
    },
    "<"
  );

  t1.to(mesh.scale, {
    x: isdaudau ? currentScale.x * 1.2 : 1,
    y: isdaudau ? currentScale.y * 1.2 : 1,
    z: isdaudau ? currentScale.z * 1.2 : 1,
    duration: jumpDuration * 0.3,
    ease: "power1.inOut",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y,
      duration: jumpDuration * 0.5,
      ease: "bounce.out",
      onComplete: () => {
        isCharacterReady = true;
      },
    },
    ">"
  );

  if (!isdaudau) {
    t1.to(mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: jumpDuration * 0.2,
      ease: "elastic.out(1, 0.3)",
    });
  }
}

function onClick() {
  if (touchHappened) return;
  handleInteraction();
}

function handleInteraction() {
  if (!modal.classList.contains("hidden")) return;

  // 1) Raycast đệ quy để có thể chạm tới mesh con sâu bên trong
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(intersectObjects, true);
  if (intersects.length === 0) {
    intersectObject = "";
    return;
  }

  // 2) Leo lên ancestor cho đến khi node.name khớp với list của chúng ta
  let node = intersects[0].object;
  while (node && !intersectObjectsNames.includes(node.name)) {
    node = node.parent;
  }
  if (!node) return;  // không tìm được node hợp lệ

  intersectObject = node.name;

  // 3) Xử lý như cũ, nhưng giờ chắc chắn được tên đúng
  if (
    ["Bulbasaur", "Chicken", "Pikachu", "Charmander", "Squirtle", "daudau"]
      .includes(intersectObject)
  ) {
    if (isCharacterReady) {
      if (!isMuted) playSound("pokemonSFX");
      jumpCharacter(intersectObject);
      isCharacterReady = false;
    }
  } else {
    showModal(intersectObject);
    if (!isMuted) playSound("projectsSFX");
  }
}


function onMouseMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  touchHappened = false;
}

function onTouchEnd(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  touchHappened = true;
  handleInteraction();
}

// Movement and Gameplay functions
function respawnCharacter() {
  character.instance.position.copy(character.spawnPosition);

  playerCollider.start
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
  playerCollider.end
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));

  playerVelocity.set(0, 0, 0);
  character.isMoving = false;
}

function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(playerCollider);
  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;
    playerCollider.translate(result.normal.multiplyScalar(result.depth));

    if (playerOnFloor) {
      character.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  }
}

function updatePlayer() {
  if (!character.instance) return;

  if (character.instance.position.y < -20) {
    respawnCharacter();
    return;
  }

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * 0.035;
  }

  playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035));

  playerCollisions();

  character.instance.position.copy(playerCollider.start);
  character.instance.position.y -= CAPSULE_RADIUS;

  let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;
  let finalRotation = character.instance.rotation.y + rotationDiff;

  character.instance.rotation.y = THREE.MathUtils.lerp(
    character.instance.rotation.y,
    finalRotation,
    0.4
  );
}

function onKeyDown(event) {
  if (event.code.toLowerCase() === "keyr") {
    respawnCharacter();
    return;
  }

  switch (event.code.toLowerCase()) {
    case "keyw":
    case "arrowup":
      pressedButtons.up = true;
      break;
    case "keys":
    case "arrowdown":
      pressedButtons.down = true;
      break;
    case "keya":
    case "arrowleft":
      pressedButtons.left = true;
      break;
    case "keyd":
    case "arrowright":
      pressedButtons.right = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code.toLowerCase()) {
    case "keyw":
    case "arrowup":
      pressedButtons.up = false;
      break;
    case "keys":
    case "arrowdown":
      pressedButtons.down = false;
      break;
    case "keya":
    case "arrowleft":
      pressedButtons.left = false;
      break;
    case "keyd":
    case "arrowright":
      pressedButtons.right = false;
      break;
  }
}

// Toggle Theme Function
function toggleTheme() {
  if (!isMuted) {
    playSound("projectsSFX");
  }
  const isDarkTheme = document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");

  if (firstIcon.style.display === "none") {
    firstIcon.style.display = "block";
    secondIcon.style.display = "none";
  } else {
    firstIcon.style.display = "none";
    secondIcon.style.display = "block";
  }

  gsap.to(light.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.31,
    b: isDarkTheme ? 1.0 : 0.78,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(light, {
    intensity: isDarkTheme ? 0.8 : 0.9,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun, {
    intensity: isDarkTheme ? 1 : 0.8,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.41,
    b: isDarkTheme ? 1.0 : 0.88,
    duration: 1,
    ease: "power2.inOut",
  });
}

// Toggle Audio Function
function toggleAudio() {
  if (!isMuted) {
    playSound("projectsSFX");
  }
  if (firstIconTwo.style.display === "none") {
    firstIconTwo.style.display = "block";
    secondIconTwo.style.display = "none";
    isMuted = false;
    sounds.backgroundMusic.play();
  } else {
    firstIconTwo.style.display = "none";
    secondIconTwo.style.display = "block";
    isMuted = true;
    sounds.backgroundMusic.pause();
  }
}

// Mobile controls
const mobileControls = {
  up: document.querySelector(".mobile-control.up-arrow"),
  left: document.querySelector(".mobile-control.left-arrow"),
  right: document.querySelector(".mobile-control.right-arrow"),
  down: document.querySelector(".mobile-control.down-arrow"),
};

const pressedButtons = {
  up: false,
  left: false,
  right: false,
  down: false,
};

function handleJumpAnimation() {
  if (!character.instance || !character.isMoving) return;

  const jumpDuration = 0.5;
  const jumpHeight = 2;
  const baseScale = 8; // Base scale is now 8 instead of 1

  const t1 = gsap.timeline();

  t1.to(character.instance.scale, {
    x: baseScale * 1.08,
    y: baseScale * 0.9,
    z: baseScale * 1.08,
    duration: jumpDuration * 0.2,
    ease: "power2.out",
  });

  t1.to(character.instance.scale, {
    x: baseScale * 0.92,
    y: baseScale * 1.1,
    z: baseScale * 0.92,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(character.instance.scale, {
    x: baseScale,
    y: baseScale,
    z: baseScale,
    duration: jumpDuration * 0.3,
    ease: "power1.inOut",
  });

  t1.to(character.instance.scale, {
    x: baseScale,
    y: baseScale,
    z: baseScale,
    duration: jumpDuration * 0.2,
  });
}

function handleContinuousMovement() {
  if (!character.instance) return;

  if (
    Object.values(pressedButtons).some((pressed) => pressed) &&
    !character.isMoving
  ) {
    if (!isMuted) {
      playSound("jumpSFX");
    }
    if (pressedButtons.up) {
      playerVelocity.z += MOVE_SPEED;
      targetRotation = 0;
    }
    if (pressedButtons.down) {
      playerVelocity.z -= MOVE_SPEED;
      targetRotation = Math.PI;
    }
    if (pressedButtons.left) {
      playerVelocity.x += MOVE_SPEED;
      targetRotation = Math.PI / 2;
    }
    if (pressedButtons.right) {
      playerVelocity.x -= MOVE_SPEED;
      targetRotation = -Math.PI / 2;
    }

    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
    handleJumpAnimation();
  }
}

//Sound Effects
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('./jump.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
});

function showSpeech(text) {
    if (!robot) return;

    const worldPos = new THREE.Vector3();
    robot.getWorldPosition(worldPos);
    worldPos.add(speechOffset); // đưa lên trên đầu

    const screenPos = worldPos.clone().project(camera);

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight;

    speechDiv.style.left = `${x}px`;
    speechDiv.style.top = `${y}px`;
    speechDiv.textContent = text;
    speechDiv.style.display = "block";

    // Ẩn sau 3 giây
    setTimeout(() => {
        speechDiv.style.display = "none";
    }, 500);
}

//---------------------------------------------------------------------
speechDiv.classList.add("speech-bubble");
// Cho label DauDau luôn hiển thị
function updateDauDauLabel() {
  const daudau = scene.getObjectByName("daudau");
  if (!daudau) return;

  // 1) Lấy vị trí thế giới và offset cao hơn
  const worldPos = new THREE.Vector3();
  daudau.getWorldPosition(worldPos);
  worldPos.y += 14  ;  // tăng lên 3 để bubble hơi cách đầu

  // 2) Chiếu ra toạ độ màn hình
  const screenPos = worldPos.project(camera);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight;

  // 3) Cập nhật DOM
  speechDiv.style.left = `${x}px`;
  speechDiv.style.top = `${y}px`;
  // shift bubble sao cho điểm (x,y) thành đáy giữa của nó
  speechDiv.style.transform = `translate(-80%, -100%)`;

  speechDiv.textContent = "Xin chào, tôi là Đậu Đậu!";
  speechDiv.style.display = "block";
}

//---------------------------------------------------------------------

Object.entries(mobileControls).forEach(([direction, element]) => {
  element.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pressedButtons[direction] = true;
  });

  element.addEventListener("touchend", (e) => {
    e.preventDefault();
    pressedButtons[direction] = false;
  });

  element.addEventListener("mousedown", (e) => {
    e.preventDefault();
    pressedButtons[direction] = true;
  });

  element.addEventListener("mouseup", (e) => {
    e.preventDefault();
    pressedButtons[direction] = false;
  });

  element.addEventListener("mouseleave", (e) => {
    pressedButtons[direction] = false;
  });

  element.addEventListener("touchcancel", (e) => {
    pressedButtons[direction] = false;
  });
});

window.addEventListener("blur", () => {
  Object.keys(pressedButtons).forEach((key) => {
    pressedButtons[key] = false;
  });
});

canvas.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycasterRobot.setFromCamera(mouse, camera);

    if (robot) {
        const intersects = raycasterRobot.intersectObject(robot, true);
        if (intersects.length > 0 && !isJumping) {
            showSpeech("Chào mừng đến với UIT!!");

            isJumping = true;
            jumpUp = true;

            if (sound.isPlaying) sound.stop();
            sound.play();
        }
    }
});

// Adding Event Listeners (tbh could make some of these just themselves rather than seperating them, oh well)
modalExitButton.addEventListener("click", hideModal);
modalbgOverlay.addEventListener("click", hideModal);
themeToggleButton.addEventListener("click", toggleTheme);
audioToggleButton.addEventListener("click", toggleAudio);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick, { passive: false });
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("touchend", onTouchEnd, { passive: false });
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);


/***************************************************************************************** */
let prevCharPosition = new THREE.Vector3();
let firstFollow = true;
// Like our movie strip!!! Calls on each frame.
function animate() {
  updatePlayer();
  handleContinuousMovement();

  const delta = clock.getDelta();
  if (bus) {
    const speed = 10; // đơn vị/giây
    bus.position.x -= speed * delta;

    if (bus.position.x < -110) {
        bus.position.x = 80;
    }
  }

  if (robot && isJumping) {
        if (jumpUp) {
            robot.position.y += jumpSpeed;
            if (robot.position.y >= originalY + jumpHeight) {
                jumpUp = false; // bắt đầu rơi xuống
            }
        } else {
            robot.position.y -= jumpSpeed;
            if (robot.position.y <= originalY) {
                robot.position.y = originalY;
                isJumping = false;
            }
        }
    }

  if (character.instance) {
    const charPos = character.instance.position;

    if (firstFollow) {
      // Lần đầu tiên: đặt camera và target đúng luôn
      controls.target.copy(charPos);
      prevCharPosition.copy(charPos);
      firstFollow = false;
    } else {
      // Tính delta di chuyển của nhân vật so với frame trước
      const delta = charPos.clone().sub(prevCharPosition);

      // Dịch camera theo đúng delta ấy (giữ nguyên góc, zoom)
      camera.position.add(delta);

      // Cập nhật lại target để camera luôn nhìn về nhân vật
      controls.target.copy(charPos);

      // Lưu lại vị trí nhân vật
      prevCharPosition.copy(charPos);
    }
  }

  // c) Cập nhật controls để xử lý input chuột
  controls.update();
  updateDauDauLabel();
  // d) Render
  renderer.render(scene, camera); 

}

renderer.setAnimationLoop(animate);
