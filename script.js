// --- Global Variables ---
let scene, camera, renderer;
let islandGroup, desertIslandGroup, icyIslandGroup;
let mainIslandMesh; // Reference to the clickable part of the first island
let desertIslandMainMesh, icyIslandMainMesh; // For camera focusing
// let playerCharacter; // The player's 3D object - REMOVED
let ambientLight, directionalLight;
let clock;
let particles;
let clouds = [];
let floatingRocks = [];
let raycaster; // For mouse picking
let mouse = new THREE.Vector2(); // For mouse coordinates

// Control variables
let islandBobSpeed = 0.4;
let desertIslandBobSpeed = 0.3;
let desertIslandRotationSpeed = 0.0005;
let icyIslandBobSpeed = 0.25;
let icyIslandRotationSpeed = 0.0003;
// const PLAYER_HEIGHT = 1.0; // REMOVED
// const PLAYER_RADIUS = 0.3; // REMOVED

// Player movement & hop animation variables - REMOVED
// let playerSpeed = 5;
// let distancePerHopThreshold = 2;
// let isPlayerMovingOverall = false;
// let isPlayerOnHopSegment = false;
// let overallJourneyStartPosition = new THREE.Vector3();
// let overallJourneyTargetPosition = new THREE.Vector3();
// let currentHopTargetPosition = new THREE.Vector3(); 
// let currentHopSegmentIndex = 0;
// let totalHopSegments = 0;
// let currentSegmentDuration = 0.5;
// let playerHopInfo = { ... };

// Camera control variables
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let cameraTarget = new THREE.Vector3(0, 0, 0); // Point camera looks at
let cameraOrbitRadius = 40;
let cameraAzimuthAngle = 0; // Horizontal angle
let cameraPolarAngle = Math.PI / 4; // Vertical angle (from Y-axis)
const minPolarAngle = 0.1; // Prevent flipping at poles
const maxPolarAngle = Math.PI - 0.1;
const minOrbitRadius = 10;
const maxOrbitRadius = 200;

// WASD Movement State - REMOVED
// let moveState = { ... };

// Day/Night Cycle Variables
let currentTimeOfDay = 0.5; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
const sunPathRadius = 50;

// Define colors for different times of day
const dayNightColors = {
    dawn: {
        sky: new THREE.Color(0xFFCF8B), // Light orange/pink
        sun: new THREE.Color(0xFFDAB9), // Peach
        ambient: new THREE.Color(0x605050)
    },
    noon: {
        sky: new THREE.Color(0x87ceeb), // Sky blue
        sun: new THREE.Color(0xffefd5), // Light yellowish
        ambient: new THREE.Color(0x708090)
    },
    dusk: {
        sky: new THREE.Color(0xFF8C69), // Orangey red
        sun: new THREE.Color(0xFFB347), // Orange
        ambient: new THREE.Color(0x504040)
    },
    night: {
        sky: new THREE.Color(0x000033), // Dark blue
        sun: new THREE.Color(0x101044), // Very dim blue (moonlight)
        ambient: new THREE.Color(0x111122) 
    }
};

// --- Initialization Function ---
function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 30, 150);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 18, 35);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x87ceeb);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    createLights();
    createIsland(); // Creates islandGroup and assigns mainIslandMesh
    createDesertIsland();
    createIcyIsland();
    // createPlayerCharacter(); // Create the player - REMOVED
    createFloatingParticles();
    createClouds(7);
    createFloatingRocks(4);

    setupControls();
    window.addEventListener('resize', onWindowResize, false);
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown_Camera, false);
    renderer.domElement.addEventListener('mousemove', handleMouseMove_Camera, false);
    renderer.domElement.addEventListener('mouseup', handleMouseUp_Camera, false);
    renderer.domElement.addEventListener('wheel', handleMouseWheel_Camera, false);
    
    // Keyboard listeners for WASD - REMOVED
    // window.addEventListener('keydown', handleKeyDown, false);
    // window.addEventListener('keyup', handleKeyUp, false);

    animate();
}

// --- Light Creation ---
function createLights() {
    ambientLight = new THREE.AmbientLight(0x708090, 0.8);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffefd5, 1.2);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 150;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
}

// --- Original Island Creation ---
function createIsland() {
    islandGroup = new THREE.Group();
    const islandGeometry = new THREE.IcosahedronGeometry(10, 1);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x659B5E, flatShading: true, shininess: 10 });
    // Store reference to the main island mesh for raycasting
    mainIslandMesh = new THREE.Mesh(islandGeometry, islandMaterial);
    mainIslandMesh.castShadow = true;
    mainIslandMesh.receiveShadow = true;
    mainIslandMesh.scale.set(1, 0.6, 0.8);
    islandGroup.add(mainIslandMesh); // Add to group

    const soilGeometry = new THREE.CylinderGeometry(7.5, 8.5, 4, 8, 1, false);
    const soilMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00, flatShading: true });
    const soilLayer = new THREE.Mesh(soilGeometry, soilMaterial);
    soilLayer.position.y = -3;
    soilLayer.castShadow = true;
    soilLayer.receiveShadow = true;
    islandGroup.add(soilLayer);

    const rockGeometry = new THREE.CylinderGeometry(8.5, 9, 3, 6, 1, false);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, flatShading: true });
    const rockLayer = new THREE.Mesh(rockGeometry, rockMaterial);
    rockLayer.position.y = -5.5;
    rockLayer.castShadow = true;
    rockLayer.receiveShadow = true;
    islandGroup.add(rockLayer);

    createTree(islandGroup, 2, 7, 2);
    createTree(islandGroup, -3, 7, -1);
    createTree(islandGroup, -1, 6.5, 4);
    createTree(islandGroup, 4, 6, -3);

    createCrystal(islandGroup, 1, 6, 5, 0xff00ff);
    createCrystal(islandGroup, -2, 5.5, -4, 0x00ffff);
    createCrystal(islandGroup, 4.5, 5, 0.5, 0xffff00);
    createCrystal(islandGroup, 0, 5, -5.5, 0xf07000);

    islandGroup.position.set(0, 2, 0);
    scene.add(islandGroup);
}

// --- Desert Island Creation ---
function createDesertIsland() {
    desertIslandGroup = new THREE.Group();
    const desertBaseGeometry = new THREE.IcosahedronGeometry(12, 1);
    const desertBaseMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C, flatShading: true, shininess: 5 });
    desertIslandMainMesh = new THREE.Mesh(desertBaseGeometry, desertBaseMaterial); // Assign here
    desertIslandMainMesh.castShadow = true;
    desertIslandMainMesh.receiveShadow = true;
    desertIslandMainMesh.scale.set(1.2, 0.5, 0.9);
    desertIslandGroup.add(desertIslandMainMesh); // Add to group

    const desertRockGeometry = new THREE.CylinderGeometry(9, 10, 5, 7, 1, false);
    const desertRockMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, flatShading: true });
    const desertRockLayer = new THREE.Mesh(desertRockGeometry, desertRockMaterial);
    desertRockLayer.position.y = -3.5;
    desertRockLayer.castShadow = true;
    desertRockLayer.receiveShadow = true;
    desertIslandGroup.add(desertRockLayer);

    createCactus(desertIslandGroup, 3, 6.5, 2);
    createCactus(desertIslandGroup, -4, 6, -3, true);
    createCactus(desertIslandGroup, 1, 6.2, -4.5);
    createCactus(desertIslandGroup, -2, 6.8, 5);

    const oasisGroup = new THREE.Group();
    const waterGeometry = new THREE.CircleGeometry(2.5, 12);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x4682B4, flatShading: true, transparent: true, opacity: 0.75, shininess: 60
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.1; // Oasis water level
    water.receiveShadow = true;
    oasisGroup.add(water);

    const sandBankGeometry = new THREE.RingGeometry(2.3, 3, 12);
    const sandBankMaterial = new THREE.MeshPhongMaterial({ color: 0xF4A460, flatShading: true });
    const sandBank = new THREE.Mesh(sandBankGeometry, sandBankMaterial);
    sandBank.rotation.x = -Math.PI / 2;
    sandBank.position.y = 0.05; // Slightly below water
    oasisGroup.add(sandBank);

    createPalmTree(oasisGroup, 1.8, 0.2, 0.8);
    createPalmTree(oasisGroup, -1.5, 0.2, -1);

    oasisGroup.position.set(0, 5.5, 0); // Position oasis on desert island surface
    desertIslandGroup.add(oasisGroup);

    desertIslandGroup.position.set(-55, -2, -30); // Moved farther away
    scene.add(desertIslandGroup);
}

// --- Icy Island Creation ---
function createIcyIsland() {
    icyIslandGroup = new THREE.Group();
    const icyBaseGeometry = new THREE.IcosahedronGeometry(20, 1); // Larger base radius
    const icyBaseMaterial = new THREE.MeshPhongMaterial({ color: 0xADD8E6, flatShading: true, shininess: 20, specular: 0xeeeeee }); // Light blue, shiny
    icyIslandMainMesh = new THREE.Mesh(icyBaseGeometry, icyBaseMaterial); // Assign here
    icyIslandMainMesh.castShadow = true;
    icyIslandMainMesh.receiveShadow = true;
    icyIslandMainMesh.scale.set(1.5, 0.7, 1.2); // Scaled up, proportionally deeper
    icyIslandGroup.add(icyIslandMainMesh);

    const icyRockGeometry = new THREE.CylinderGeometry(15, 16, 7, 9, 1, false); // Larger rock layer
    const icyRockMaterial = new THREE.MeshPhongMaterial({ color: 0x90A4AE, flatShading: true }); // Bluish grey rock
    const icyRockLayer = new THREE.Mesh(icyRockGeometry, icyRockMaterial);
    icyRockLayer.position.y = -5; // Adjusted for larger scale
    icyRockLayer.castShadow = true;
    icyRockLayer.receiveShadow = true;
    icyIslandGroup.add(icyRockLayer);

    // Ice Mountain
    const mountainHeight = 18;
    const mountainRadius = 8;
    const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 7, 3);
    const mountainMaterial = new THREE.MeshPhongMaterial({ color: 0x95B9C7, flatShading: true, shininess: 30 }); // Icy rock color
    const iceMountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    iceMountain.position.y = (icyIslandMainMesh.scale.y * 10 * 0.7) + mountainHeight / 2 - 5; // Position on top of the island base
    iceMountain.castShadow = true;
    iceMountain.receiveShadow = true;
    icyIslandGroup.add(iceMountain);

    // Snow cap
    const snowCapGeom = new THREE.IcosahedronGeometry(mountainRadius * 0.8, 1);
    const snowMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFAFA, flatShading: true, shininess: 10 }); // Snow white
    const snowCap = new THREE.Mesh(snowCapGeom, snowMaterial);
    snowCap.position.y = iceMountain.position.y + mountainHeight * 0.4;
    snowCap.scale.set(1, 0.4, 1); // Flatten it a bit
    icyIslandGroup.add(snowCap);

    // Snow patches
    for (let i = 0; i < 5; i++) {
        const patchSize = 1 + Math.random() * 3;
        const patchGeom = new THREE.IcosahedronGeometry(patchSize, 0);
        const snowPatch = new THREE.Mesh(patchGeom, snowMaterial);
        const angle = Math.random() * Math.PI * 2;
        const distFromCenter = mountainRadius * 0.3 + Math.random() * mountainRadius * 0.4;
        snowPatch.position.set(
            Math.cos(angle) * distFromCenter,
            iceMountain.position.y - mountainHeight * 0.1 + Math.random() * mountainHeight * 0.3, 
            Math.sin(angle) * distFromCenter
        );
        snowPatch.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        snowPatch.scale.y = Math.random() * 0.3 + 0.2; // Make patches flatter
        icyIslandGroup.add(snowPatch);
    }

    icyIslandGroup.position.set(30, -5, -45); // Position it somewhere distinct
    scene.add(icyIslandGroup);
}

// --- Player Character Creation --- REMOVED
// function createPlayerCharacter() { ... }

// Helper function to create a low-poly tree
function createTree(parentGroup, x, y, z) {
    const treeGroup = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 5);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x755f41, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageColors = [0x4CAF50, 0x388E3C, 0x2E7D32];
    const foliagePositions = [
        { y: 2, scale: 1.5 }, { y: 2.8, x: 0.5, scale: 1.2 }, { y: 2.6, x: -0.4, z: 0.3, scale: 1.3 }
    ];
    foliagePositions.forEach(pos => {
        const foliageGeometry = new THREE.IcosahedronGeometry(pos.scale, 0);
        const foliageMaterial = new THREE.MeshPhongMaterial({
            color: foliageColors[Math.floor(Math.random() * foliageColors.length)],
            flatShading: true
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(pos.x || 0, pos.y, pos.z || 0);
        foliage.castShadow = true;
        treeGroup.add(foliage);
    });
    treeGroup.position.set(x, y - (2.5 / 2), z);
    parentGroup.add(treeGroup);
}

// Helper function to create a glowing crystal
function createCrystal(parentGroup, x, y, z, color) {
    const crystalGroup = new THREE.Group();
    const crystalGeometry = new THREE.IcosahedronGeometry(0.8, 0);
    const crystalMaterial = new THREE.MeshPhongMaterial({
        color: color, emissive: color, emissiveIntensity: 0.7, flatShading: true,
        shininess: 80, transparent: true, opacity: 0.85
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.castShadow = true;
    crystal.scale.set(0.5 + Math.random() * 0.8, 1 + Math.random() * 1.2, 0.5 + Math.random() * 0.8);
    crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    crystalGroup.add(crystal);

    const crystalLight = new THREE.PointLight(color, 0.9, 12);
    crystalLight.position.set(0, 0.2, 0);
    crystalGroup.add(crystalLight);
    crystalGroup.position.set(x, y, z);
    parentGroup.add(crystalGroup);
}

// Helper function to create a low-poly cactus
function createCactus(parentGroup, x, y, z, hasBranches = false) {
    const cactusGroup = new THREE.Group();
    const cactusMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, flatShading: true });
    const stemHeight = 2 + Math.random() * 1.5;
    const stemRadius = 0.3 + Math.random() * 0.2;
    const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 6);
    const stem = new THREE.Mesh(stemGeometry, cactusMaterial);
    stem.castShadow = true;
    cactusGroup.add(stem);

    if (hasBranches) {
        const numBranches = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numBranches; i++) {
            const branchHeight = stemHeight * (0.4 + Math.random() * 0.3);
            const branchRadius = stemRadius * 0.8;
            const branchGeometry = new THREE.CylinderGeometry(branchRadius, branchRadius, branchHeight, 5);
            const branch = new THREE.Mesh(branchGeometry, cactusMaterial);
            branch.position.y = (Math.random() - 0.2) * (stemHeight / 4);
            const angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 3 + (Math.random() - 0.5) * 0.3);
            branch.position.x = Math.sin(angle) * (stemRadius + branchHeight / 2 * 0.8);
            branch.position.z = (Math.random() - 0.5) * 0.2;
            branch.rotation.z = -angle;
            const upperBranchGeometry = new THREE.CylinderGeometry(branchRadius*0.9, branchRadius*0.8, branchHeight * 0.8, 5);
            const upperBranch = new THREE.Mesh(upperBranchGeometry, cactusMaterial);
            upperBranch.position.y = branchHeight/2 - (branchRadius*0.9);
            branch.add(upperBranch);
            branch.castShadow = true;
            cactusGroup.add(branch);
        }
    }
    cactusGroup.position.set(x, y - (stemHeight / 2), z);
    parentGroup.add(cactusGroup);
}

// Helper function to create a simple palm tree
function createPalmTree(parentGroup, x, y, z) {
    const palmTreeGroup = new THREE.Group();
    const trunkHeight = 1.5 + Math.random() * 0.5;
    const trunkGeom = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 5);
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8B4513, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkHeight / 2; // Center trunk correctly
    trunk.castShadow = true;
    palmTreeGroup.add(trunk);

    const numFronds = 4 + Math.floor(Math.random() * 2);
    const frondGeom = new THREE.ConeGeometry(0.8, 1.2, 4);
    const frondMat = new THREE.MeshPhongMaterial({ color: 0x2E8B57, flatShading: true });
    for (let i = 0; i < numFronds; i++) {
        const frond = new THREE.Mesh(frondGeom, frondMat);
        const angle = (i / numFronds) * Math.PI * 2;
        frond.position.set(Math.cos(angle) * 0.3, trunkHeight - 0.2, Math.sin(angle) * 0.3);
        frond.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        frond.rotation.y = angle + Math.PI /2;
        frond.rotation.z = (Math.random() - 0.5) * 0.3;
        frond.scale.set(0.5, 0.5, 0.5);
        palmTreeGroup.add(frond);
    }
    palmTreeGroup.position.set(x, y, z); // Position the whole tree group
    parentGroup.add(palmTreeGroup);
}

function createClouds(count) {
    for (let i = 0; i < count; i++) {
        const cloudGroup = new THREE.Group();
        const numPuffs = 3 + Math.floor(Math.random() * 4);
        for (let j = 0; j < numPuffs; j++) {
            const puffGeometry = new THREE.IcosahedronGeometry(1.5 + Math.random() * 2.5, 0);
            const puffMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f8ff, flatShading: true, transparent: true, opacity: 0.8 + Math.random() * 0.15 });
            const puff = new THREE.Mesh(puffGeometry, puffMaterial);
            puff.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3);
            puff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            cloudGroup.add(puff);
        }
        cloudGroup.position.set((Math.random() - 0.5) * 120, 20 + Math.random() * 15, (Math.random() - 0.5) * 120);
        cloudGroup.userData = { initialX: cloudGroup.position.x, speed: 0.008 + Math.random() * 0.015 };
        clouds.push(cloudGroup);
        scene.add(cloudGroup);
    }
}

function createFloatingRocks(count) {
    for (let i = 0; i < count; i++) {
        const rockSize = 0.8 + Math.random() * 2;
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 0);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x778899, flatShading: true, shininess: 5 });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.position.set((Math.random() - 0.5) * 70, -5 + Math.random() * 20, (Math.random() - 0.5) * 70);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.userData = {
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 0.15 + Math.random() * 0.25,
            bobAmount: 0.3 + Math.random() * 0.5,
            rotationDirX: (Math.random() - 0.5) * 0.001,
            rotationDirY: (Math.random() - 0.5) * 0.002
        };
        floatingRocks.push(rock);
        scene.add(rock);
    }
}

function createFloatingParticles() {
    const particleCount = 400;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        positions.push((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 80 + 15, (Math.random() - 0.5) * 150);
    }
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
}

function setupControls() {
    const sunIntensitySlider = document.getElementById('sunIntensity');
    const sunIntensityValue = document.getElementById('sunIntensityValue');
    const ambientIntensitySlider = document.getElementById('ambientIntensity');
    const ambientIntensityValue = document.getElementById('ambientIntensityValue');
    const bobSpeedSlider = document.getElementById('bobSpeed');
    const bobSpeedValue = document.getElementById('bobSpeedValue');
    // Player control sliders - REMOVED
    // const playerSpeedSlider = document.getElementById('playerSpeedSlider');
    // const playerSpeedValue = document.getElementById('playerSpeedValue');
    // const distancePerHopSlider = document.getElementById('distancePerHopSlider');
    // const distancePerHopValue = document.getElementById('distancePerHopValue');
    // const hopHeightSlider = document.getElementById('hopHeightSlider');
    // const hopHeightValue = document.getElementById('hopHeightValue');

    // Scene Controls Panel Toggle
    const controlsPanelHeader = document.getElementById('controlsPanelHeader');
    const controlsContent = document.getElementById('controlsContent');
    const toggleIcon = document.getElementById('toggleIcon');
    let controlsVisible = true;

    if (controlsPanelHeader && controlsContent && toggleIcon) {
        controlsPanelHeader.addEventListener('click', () => {
            controlsVisible = !controlsVisible;
            controlsContent.style.display = controlsVisible ? 'block' : 'none';
            toggleIcon.textContent = controlsVisible ? '[-]' : '[+]';
        });
    }

    sunIntensitySlider.addEventListener('input', (event) => {
        if (directionalLight) directionalLight.intensity = parseFloat(event.target.value);
        sunIntensityValue.textContent = event.target.value;
    });
    ambientIntensitySlider.addEventListener('input', (event) => {
        if (ambientLight) ambientLight.intensity = parseFloat(event.target.value);
        ambientIntensityValue.textContent = event.target.value;
    });
    bobSpeedSlider.addEventListener('input', (event) => {
        islandBobSpeed = parseFloat(event.target.value);
        bobSpeedValue.textContent = event.target.value;
    });
    // Player control slider listeners - REMOVED
    // playerSpeedSlider.addEventListener(...) 
    // distancePerHopSlider.addEventListener(...) 
    // hopHeightSlider.addEventListener(...) 

    // Dev Tools Panel Toggle
    const devToolsHeader = document.getElementById('devToolsHeader');
    const devToolsContent = document.getElementById('devToolsContent');
    const devToolsToggleIcon = document.getElementById('devToolsToggleIcon');
    let devControlsVisible = true;

    if (devToolsHeader && devToolsContent && devToolsToggleIcon) {
        devToolsHeader.addEventListener('click', () => {
            devControlsVisible = !devControlsVisible;
            devToolsContent.style.display = devControlsVisible ? 'block' : 'none';
            devToolsToggleIcon.textContent = devControlsVisible ? '[-]' : '[+]';
        });
    }

    // Time of Day Slider
    const timeOfDaySlider = document.getElementById('timeOfDaySlider');
    const timeOfDayValueDisplay = document.getElementById('timeOfDayValue');

    if (timeOfDaySlider && timeOfDayValueDisplay) {
        timeOfDaySlider.addEventListener('input', (event) => {
            currentTimeOfDay = parseFloat(event.target.value);
            timeOfDayValueDisplay.textContent = currentTimeOfDay.toFixed(2);
            updateDayNightCycle(currentTimeOfDay); 
        });
        // Initialize display
        updateDayNightCycle(currentTimeOfDay); 
    }
}

function updateDayNightCycle(time) { // time is 0 (midnight) to 1 (next midnight)
    if (!directionalLight || !ambientLight || !scene.fog) return;

    // Sun position (simple rotation around Y axis for now, then dip below horizon)
    const sunAngle = time * Math.PI * 2; // Full circle
    directionalLight.position.set(
        Math.cos(sunAngle) * sunPathRadius,
        Math.sin(sunAngle) * sunPathRadius * 0.6 + 10, // Adjust vertical path, ensure always some height or dips
        Math.sin(sunAngle - Math.PI / 2) * sunPathRadius // Offset Z to have it rise in east-ish
    );
    // Ensure sun position makes sense for shadows
    if (directionalLight.position.y < 0) {
        directionalLight.position.y = 0; // Keep sun above horizon for shadows, or handle night differently
        directionalLight.intensity = 0.1; // Moonlight intensity
    } else {
        directionalLight.intensity = THREE.MathUtils.lerp(0.1, 1.5, Math.sin(sunAngle > Math.PI ? 0 : sunAngle)); // Stronger at noon
    }
    directionalLight.intensity = Math.max(0.1, Math.sin(Math.PI * time) * 1.5); // Example: peaks at noon (0.5)

    let currentSkyColor, currentSunColor, currentAmbientColor;
    let sunIntensity = 1.2;
    let ambientIntensity = 0.8;

    if (time < 0.25) { // Night to Dawn (0 to 0.25)
        const t = time / 0.25;
        currentSkyColor = dayNightColors.night.sky.clone().lerp(dayNightColors.dawn.sky, t);
        currentSunColor = dayNightColors.night.sun.clone().lerp(dayNightColors.dawn.sun, t);
        currentAmbientColor = dayNightColors.night.ambient.clone().lerp(dayNightColors.dawn.ambient, t);
        sunIntensity = THREE.MathUtils.lerp(0.05, 0.8, t);
        ambientIntensity = THREE.MathUtils.lerp(0.1, 0.5, t);
    } else if (time < 0.5) { // Dawn to Noon (0.25 to 0.5)
        const t = (time - 0.25) / 0.25;
        currentSkyColor = dayNightColors.dawn.sky.clone().lerp(dayNightColors.noon.sky, t);
        currentSunColor = dayNightColors.dawn.sun.clone().lerp(dayNightColors.noon.sun, t);
        currentAmbientColor = dayNightColors.dawn.ambient.clone().lerp(dayNightColors.noon.ambient, t);
        sunIntensity = THREE.MathUtils.lerp(0.8, 1.5, t);
        ambientIntensity = THREE.MathUtils.lerp(0.5, 1.0, t);
    } else if (time < 0.75) { // Noon to Dusk (0.5 to 0.75)
        const t = (time - 0.5) / 0.25;
        currentSkyColor = dayNightColors.noon.sky.clone().lerp(dayNightColors.dusk.sky, t);
        currentSunColor = dayNightColors.noon.sun.clone().lerp(dayNightColors.dusk.sun, t);
        currentAmbientColor = dayNightColors.noon.ambient.clone().lerp(dayNightColors.dusk.ambient, t);
        sunIntensity = THREE.MathUtils.lerp(1.5, 0.8, t);
        ambientIntensity = THREE.MathUtils.lerp(1.0, 0.5, t);
    } else { // Dusk to Night (0.75 to 1)
        const t = (time - 0.75) / 0.25;
        currentSkyColor = dayNightColors.dusk.sky.clone().lerp(dayNightColors.night.sky, t);
        currentSunColor = dayNightColors.dusk.sun.clone().lerp(dayNightColors.night.sun, t);
        currentAmbientColor = dayNightColors.dusk.ambient.clone().lerp(dayNightColors.night.ambient, t);
        sunIntensity = THREE.MathUtils.lerp(0.8, 0.05, t);
        ambientIntensity = THREE.MathUtils.lerp(0.5, 0.1, t);
    }

    scene.fog.color.copy(currentSkyColor);
    renderer.setClearColor(currentSkyColor);
    directionalLight.color.copy(currentSunColor);
    directionalLight.intensity = sunIntensity;
    ambientLight.color.copy(currentAmbientColor);
    ambientLight.intensity = ambientIntensity;
}

// function startNextHopSegment() { ... } // REMOVED

// --- Mouse Click Handler for Player Movement / Camera Focus ---
function onIslandClick(event) { // This was already mostly for camera, ensure player parts are gone.
    event.preventDefault();
    // Player movement logic is now handled by WASD. This function will be for camera focus.
}

// --- Keyboard Handlers for WASD --- REMOVED
// function handleKeyDown(event) { ... }
// function handleKeyUp(event) { ... }

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Handle WASD Input for Player Movement - REMOVED
    // if (playerCharacter && (moveState.forward !== 0 || moveState.right !== 0) && !isPlayerMovingOverall) { ... }

    // Player hop animation logic - REMOVED
    // if (isPlayerOnHopSegment && playerCharacter) { ... }

    if (islandGroup) {
        islandGroup.position.y = 2 + Math.sin(elapsedTime * islandBobSpeed) * 0.7;
        islandGroup.rotation.y += 0.0008;
    }

    if (desertIslandGroup) {
        desertIslandGroup.position.y = -2 + Math.sin(elapsedTime * desertIslandBobSpeed + 1.5) * 0.9;
        desertIslandGroup.rotation.y += desertIslandRotationSpeed;
    }

    if (icyIslandGroup) {
        icyIslandGroup.position.y = -2 + Math.sin(elapsedTime * icyIslandBobSpeed + 1.5) * 0.9;
        icyIslandGroup.rotation.y += icyIslandRotationSpeed;
    }

    if (particles) {
        const particlePositions = particles.geometry.attributes.position;
        for (let i = 0; i < particlePositions.count; i++) {
            particlePositions.array[i * 3 + 1] += 0.025;
            if (particlePositions.array[i * 3 + 1] > 50) {
                particlePositions.array[i * 3 + 1] = -40;
                particlePositions.array[i * 3] = (Math.random() - 0.5) * 150;
                particlePositions.array[i * 3 + 2] = (Math.random() - 0.5) * 150;
            }
        }
        particlePositions.needsUpdate = true;
    }

    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > 80) {
            cloud.position.x = -80;
            cloud.position.z = (Math.random() - 0.5) * 120;
            cloud.position.y = 20 + Math.random() * 15;
        }
    });

    floatingRocks.forEach((rock, index) => {
        rock.position.y += Math.sin(elapsedTime * rock.userData.bobSpeed + rock.userData.bobOffset) * rock.userData.bobAmount * 0.025;
        rock.rotation.y += rock.userData.rotationDirY || ((0.001 + Math.random() * 0.0005) * (index % 2 === 0 ? 1 : -1));
        rock.rotation.x += rock.userData.rotationDirX || ((0.0005 + Math.random() * 0.0005));
    });

    updateCameraPosition(); 

    if (renderer && scene && camera) {
         renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function showMessage(message, duration = 3000) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        setTimeout(() => { messageBox.style.display = 'none'; }, duration);
    } else {
        console.log("Message Box (not found, logging to console):", message);
    }
}

window.onload = function() {
    try {
        init();
    } catch (error) {
        console.error("Error initializing 3D scene:", error);
        showMessage("Oops! Something went wrong. Please try refreshing. Error: " + error.message, 7000);
    }
};

function updateCameraPosition() {
    const x = cameraOrbitRadius * Math.sin(cameraPolarAngle) * Math.cos(cameraAzimuthAngle);
    const y = cameraOrbitRadius * Math.cos(cameraPolarAngle);
    const z = cameraOrbitRadius * Math.sin(cameraPolarAngle) * Math.sin(cameraAzimuthAngle);
    camera.position.set(x, y, z).add(cameraTarget);
    camera.lookAt(cameraTarget);
}

function handleMouseDown_Camera(event) {
    isDragging = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;

    // Click-to-focus logic (runs even if drag starts)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const focusableObjects = [];
    if (mainIslandMesh) focusableObjects.push(mainIslandMesh);
    if (desertIslandMainMesh) focusableObjects.push(desertIslandMainMesh);
    if (icyIslandMainMesh) focusableObjects.push(icyIslandMainMesh);

    const intersects = raycaster.intersectObjects(focusableObjects, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject === mainIslandMesh && islandGroup) {
            cameraTarget.copy(islandGroup.position);
        } else if (clickedObject === desertIslandMainMesh && desertIslandGroup) {
            cameraTarget.copy(desertIslandGroup.position);
        } else if (clickedObject === icyIslandMainMesh && icyIslandGroup) {
            cameraTarget.copy(icyIslandGroup.position);
        }
        // No need to call updateCameraPosition() here, animate loop will do it.
    }
}

function handleMouseMove_Camera(event) {
    if (!isDragging) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    cameraAzimuthAngle -= deltaX * 0.005; // Adjust sensitivity as needed
    cameraPolarAngle -= deltaY * 0.005;

    // Clamp polar angle to avoid flipping
    cameraPolarAngle = Math.max(minPolarAngle, Math.min(maxPolarAngle, cameraPolarAngle));

    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;

    updateCameraPosition();
}

function handleMouseUp_Camera(event) {
    isDragging = false;
}

function handleMouseWheel_Camera(event) {
    cameraOrbitRadius += event.deltaY * 0.1; // Adjust sensitivity
    // Clamp orbit radius
    cameraOrbitRadius = Math.max(minOrbitRadius, Math.min(maxOrbitRadius, cameraOrbitRadius));
    updateCameraPosition();
} 