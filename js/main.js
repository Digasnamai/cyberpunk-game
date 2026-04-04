import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Import our custom data files!
import { LEVEL_DATA } from './data/levels.js';
import { introDialogue, mission1Dialogue, mission2Dialogue } from './data/dialogues.js';

// ==========================================
// 1. ENGINE & STATE MANAGER
// ==========================================
let currentMode = 'PHYSICAL'; // 'PHYSICAL' or 'NETRUN'

// Use a single scene to handle both physical and AR overlay rendering
const scene = new THREE.Scene();

// Preload Custom Models
let models = { hellhound: null, asp: null, guard: null, level1: null };
const loader = new GLTFLoader();

loader.load('models/level1.glb', function (gltf) {
    models.level1 = gltf.scene;
    console.log("Level 1 Environment loaded!");
});

loader.load('models/hellhound.glb', function (gltf) {
    models.hellhound = gltf.scene;
    console.log("Hellhound model loaded!");
}, undefined, function (error) {
    console.error('An error happened loading the Hellhound:', error);
});

loader.load('models/asp.glb', function (gltf) {
    models.asp = gltf.scene;
    console.log("Asp model loaded!");
}, undefined, function (error) {
    console.error('An error happened loading the Asp:', error);
});

loader.load('models/guard.glb', function (gltf) {
    models.guard = gltf.scene;
    console.log("Guard model loaded!");
}, undefined, function (error) {
    console.error('An error happened loading the Guard:', error);
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.display = 'none';

// App State (Menu -> Map -> Dialogue -> Game)
let appState = 'MENU';
let currentLevelIndex = 1;
let currentTutorialPages = [];
let currentTutorialIndex = 0;

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ==========================================
// DYNAMIC LOG MANAGER
// ==========================================
const logWrapper = document.getElementById('log-wrapper');
const logHistory = document.getElementById('log-history');
const logCurrent = document.getElementById('log-current');
const proxyLog = document.getElementById('log');

// Toggle expanded view on click
logWrapper.onclick = () => {
    logWrapper.classList.toggle('expanded');
    if (logWrapper.classList.contains('expanded')) {
        logHistory.scrollTop = logHistory.scrollHeight; // Auto-scroll to bottom
    }
};

let lastLogMsg = "";
let lastLogClass = "normal";

// Watch the hidden proxy log for changes made by the game engine
const logObserver = new MutationObserver(() => {
    const msg = proxyLog.innerText;
    const isNetrun = proxyLog.className.includes('log-netrun');
    const currentClassState = isNetrun ? 'netrun' : 'normal';

    if (msg !== lastLogMsg || currentClassState !== lastLogClass) {
        if (msg !== lastLogMsg) {
            if (msg.startsWith(lastLogMsg) && lastLogMsg !== "") {
                logCurrent.innerText = msg;
            } else {
                if (lastLogMsg !== "") {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'log-item' + (lastLogClass === 'netrun' ? ' netrun' : '');
                    historyItem.innerText = lastLogMsg;
                    logHistory.appendChild(historyItem);
                }
                logCurrent.innerText = msg;
            }
            lastLogMsg = msg;
        }

        logCurrent.className = 'log-current' + (isNetrun ? ' netrun' : '');
        lastLogClass = currentClassState;

        if (logWrapper.classList.contains('expanded')) logHistory.scrollTop = logHistory.scrollHeight;
    }
});

logObserver.observe(proxyLog, { childList: true, characterData: true, subtree: true, attributes: true });

// ==========================================
// NARRATIVE ENGINE
// ==========================================
let currentDialogueIndex = 0;
let isTyping = false;
let typingTimeout;

function showDialogue(dialogueArray, onCompleteCallback) {
    switchScreen('dialogue-screen');
    currentDialogueIndex = 0;

    const textElement = document.getElementById('dialogue-text');
    const speakerElement = document.getElementById('dialogue-speaker');
    const mapContainer = document.getElementById('intro-map-container');
    const mapLayers = document.querySelectorAll('.map-layer');

    function typeWriter(text, index) {
        isTyping = true;
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            typingTimeout = setTimeout(() => typeWriter(text, index + 1), 30);
        } else isTyping = false;
    }

    function displayCurrentLine() {
        clearTimeout(typingTimeout);
        textElement.innerHTML = '';

        if (currentDialogueIndex < dialogueArray.length) {
            const line = dialogueArray[currentDialogueIndex];
            speakerElement.innerText = line.speaker;

            // Handle Map Overlay Logic
            if (line.showMap) {
                mapLayers.forEach(layer => {
                    if (layer.id === 'map-base' || (line.activeLayers && line.activeLayers.includes(layer.id))) {
                        layer.classList.add('visible');
                    } else {
                        layer.classList.remove('visible');
                    }
                });
            } else {
                // Let CSS opacity handle the hiding transition
                mapLayers.forEach(l => l.classList.remove('visible'));
            }

            typeWriter(line.text, 0);
        } else {
            mapContainer.style.display = 'none'; // Cleanup
            onCompleteCallback();
        }
    }

    document.getElementById('btn-next-dialogue').onclick = () => {
        if (isTyping) {
            clearTimeout(typingTimeout);
            textElement.innerHTML = dialogueArray[currentDialogueIndex].text;
            isTyping = false;
        } else {
            currentDialogueIndex++;
            displayCurrentLine();
        }
    };

    displayCurrentLine();
}

// Split-screen character dialogue system
function showCharacterDialogue(dialogueArray, onCompleteCallback) {
    switchScreen('character-dialogue-screen');
    currentDialogueIndex = 0;

    const paneLeft = document.getElementById('pane-left');
    const paneRight = document.getElementById('pane-right');
    const textLeft = document.getElementById('text-left');
    const textRight = document.getElementById('text-right');
    const portraitLeft = document.getElementById('portrait-left');
    const portraitRight = document.getElementById('portrait-right');

    function typeWriter(textElement, text, index) {
        isTyping = true;
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            typingTimeout = setTimeout(() => typeWriter(textElement, text, index + 1), 30);
        } else isTyping = false;
    }

    function displayCurrentLine() {
        clearTimeout(typingTimeout);
        textLeft.innerHTML = '';
        textRight.innerHTML = '';

        if (currentDialogueIndex >= dialogueArray.length) {
            onCompleteCallback();
            return;
        }

        const line = dialogueArray[currentDialogueIndex];

        if (line.side === "left") {
            paneLeft.classList.remove('inactive');
            paneRight.classList.add('inactive');
            portraitLeft.innerText = line.name;
            typeWriter(textLeft, line.text, 0);
        } else {
            paneRight.classList.remove('inactive');
            paneLeft.classList.add('inactive');
            portraitRight.innerText = line.name;
            typeWriter(textRight, line.text, 0);
        }
    }

    document.getElementById('character-dialogue-screen').onclick = () => {
        if (isTyping) {
            clearTimeout(typingTimeout);
            const line = dialogueArray[currentDialogueIndex];
            if (line.side === 'left') textLeft.innerHTML = line.text;
            else textRight.innerHTML = line.text;
            isTyping = false;
        } else {
            currentDialogueIndex++;
            displayCurrentLine();
        }
    };

    displayCurrentLine();
}

// ==========================================
// MENU EVENTS
// ==========================================
document.getElementById('btn-new-game').onclick = () => {
    showDialogue(introDialogue, () => {
        showCharacterDialogue(mission1Dialogue, () => {
            startLevel(1);
        });
    });
};

document.getElementById('btn-level-select').onclick = () => switchScreen('world-map');
document.getElementById('btn-back-menu').onclick = () => switchScreen('main-menu');

document.querySelectorAll('.map-node').forEach(node => {
    node.onclick = (e) => {
        const level = parseInt(e.target.getAttribute('data-level'));
        if (level === 2) {
            showCharacterDialogue(mission2Dialogue, () => { startLevel(level); });
        } else {
            startLevel(level);
        }
    };
});

function startLevel(levelNum) {
    if (!LEVEL_DATA[levelNum]) {
        console.error(`Level ${levelNum} data not found!`);
        return;
    }

    currentLevelIndex = levelNum;
    currentLevelData = LEVEL_DATA[levelNum];

    // Reset Player Stats
    player.r = currentLevelData.spawn.r;
    player.c = currentLevelData.spawn.c;
    player.hp = player.maxHp;
    player.ap = player.maxAp;
    player.inventory = [];
    document.getElementById('hp-bar').style.width = "100%";
    document.getElementById('ap-display').innerText = player.ap;

    // Boot the 3D Engine immediately so it renders in the background!
    appState = 'GAME';
    switchScreen('game-ui');
    renderer.domElement.style.display = 'block';

    buildPhysicalWorld();
    initNetrun();
    toggleMode('PHYSICAL');

    // Check for Tutorial Array
    if (currentLevelData.tutorial && currentLevelData.tutorial.length > 0) {
        appState = 'TUTORIAL'; // Prevents mouse clicks on the grid
        currentTutorialPages = currentLevelData.tutorial;
        currentTutorialIndex = 0;

        document.getElementById('tutorial-overlay').style.display = 'flex';
        renderTutorialPage();
    }
}

function renderTutorialPage() {
    const page = currentTutorialPages[currentTutorialIndex];
    document.getElementById('tutorial-title').innerText = page.title;
    document.getElementById('tutorial-text').innerHTML = page.text;

    const mediaContainer = document.getElementById('tutorial-media-container');
    if (page.mediaType === 'video') {
        mediaContainer.innerHTML = `<video src="${page.mediaSrc}" autoplay loop muted playsinline></video>`;
    } else {
        mediaContainer.innerHTML = `<img src="${page.mediaSrc}" alt="Tutorial">`;
    }

    // Toggle PREV button visibility
    document.getElementById('btn-prev-tutorial').style.display = currentTutorialIndex > 0 ? 'block' : 'none';

    // Change NEXT to START on the final page
    if (currentTutorialIndex === currentTutorialPages.length - 1) {
        document.getElementById('btn-next-tutorial').innerText = 'BEGIN >>';
    } else {
        document.getElementById('btn-next-tutorial').innerText = 'NEXT >>';
    }
}

document.getElementById('btn-prev-tutorial').onclick = () => {
    if (currentTutorialIndex > 0) {
        currentTutorialIndex--;
        renderTutorialPage();
    }
};

document.getElementById('btn-next-tutorial').onclick = () => {
    if (currentTutorialIndex < currentTutorialPages.length - 1) {
        currentTutorialIndex++;
        renderTutorialPage();
    } else {
        // Close tutorial and unlock the game interactions
        document.getElementById('tutorial-overlay').style.display = 'none';
        appState = 'GAME';
    }
};

// Camera and Global Lighting Setup
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 8, -8, 0.1, 1000);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const physLight = new THREE.DirectionalLight(0xffffff, 0.5);
physLight.position.set(5, 10, 5);
scene.add(physLight);

// ==========================================
// 3. PHYSICAL & UNIFIED PLAYER LOGIC
// ==========================================
let currentLevelData = null;

let player = {
    r: 4, c: 0, floor: 0, hp: 15, maxHp: 15, ap: 4, maxAp: 4, netAp: 2, maxNetAp: 2,
    inventory: [], // Stores collected datapad IDs
    statuses: {
        disabledPrograms: { swordfish: 0, harpoon: 0, scales: 0, swim: 0 },
        burning: 0, krakenActive: false, scorpionActive: false, scalesBarrier: 0,
        netApPenalty: 0
    }
};

let playerGroup, physBody, netBody1, netBody2;
let physGridGroup = new THREE.Group();
let visionGroup = new THREE.Group();

// Pathfinding Logic
let currentPath = [];
let hoveredTile = null;
let isPlayerMoving = false;

function isWalkable(r, c) {
    if (r < 0 || r >= currentLevelData.map.length || c < 0 || c >= currentLevelData.map[0].length) return false;

    const type = currentLevelData.map[r][c];
    if (type === 1 || type === 2 || type === 8 || type === 6) return false;

    // Locked doors are solid
    if (type === 3) {
        const door = currentLevelData.doors.find(d => d.r === r && d.c === c);
        if (door && !door.unlocked) return false;
    }

    // Empty pits are solid (unless there is a platform there)
    if (type === 4) {
        const plat = currentLevelData.platforms.find(p => p.r === r && p.c === c);
        if (!plat) return false;
    }

    // Check for collision with entities
    if (currentLevelData.guards && currentLevelData.guards.some(g => g.r === r && g.c === c)) return false;
    if (currentLevelData.drones.some(d => d.r === r && d.c === c)) return false;

    // Vision Cones act as invisible walls to prevent walking through sightlines
    const inVision = visionGroup.children.some(v => v.userData.isCone && v.userData.r === r && v.userData.c === c);
    if (inVision) return false;

    return true;
}

function getPath(startR, startC, targetR, targetC, maxAP) {
    if (!isWalkable(targetR, targetC)) return null;
    if (startR === targetR && startC === targetC) return [];

    let queue = [{ r: startR, c: startC, path: [] }];
    let visited = new Set([`${startR},${startC}`]);

    while (queue.length > 0) {
        let curr = queue.shift();

        if (curr.r === targetR && curr.c === targetC) return curr.path;
        if (curr.path.length >= maxAP) continue;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let d of dirs) {
            let nr = curr.r + d[0];
            let nc = curr.c + d[1];

            if (!visited.has(`${nr},${nc}`) && isWalkable(nr, nc)) {
                visited.add(`${nr},${nc}`);
                queue.push({ r: nr, c: nc, path: [...curr.path, { r: nr, c: nc }] });
            }
        }
    }
    return null; // No safe path found within AP limit
}

function clearHighlights() {
    physGridGroup.children.forEach(child => {
        if (child.userData.type === 'floor' || child.userData.type === 'platform') {
            const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
            if (child.material && child.material.emissive) {
                child.material.emissive.setHex(isExit ? 0x00ffcc : 0x000000);
            }
        }
    });
    currentPath = [];
}

// Step-by-step movement executor
function executePathMovement(path) {
    isPlayerMoving = true;
    player.ap -= path.length;
    document.getElementById('ap-display').innerText = player.ap;

    clearHighlights();
    hoveredTile = null;

    let stepIndex = 0;

    function nextStep() {
        if (stepIndex >= path.length) {
            isPlayerMoving = false;

            if (currentLevelData.exit && player.r === currentLevelData.exit.r && player.c === currentLevelData.exit.c) {
                document.getElementById('log').innerText = "EXTRACTION POINT REACHED";
                setTimeout(() => {
                    appState = 'MAP';
                    renderer.domElement.style.display = 'none';
                    const nextLevel = currentLevelIndex + 1;
                    const nextMapBtn = document.querySelector(`.map-node[data-level="${nextLevel}"]`);
                    if (nextMapBtn) nextMapBtn.disabled = false;
                    switchScreen('world-map');
                }, 1500);
            }
            return;
        }

        // Move Player
        player.r = path[stepIndex].r;
        player.c = path[stepIndex].c;
        stepIndex++;

        // Move Patrolling Guards Simultaneously
        if (currentLevelData.guards) {
            currentLevelData.guards.forEach(guard => {
                if (guard.path) {
                    guard.pathIdx = (guard.pathIdx + 1) % guard.path.length;
                    const step = guard.path[guard.pathIdx];

                    guard.r = step.r;
                    guard.c = step.c;

                    if (step.dir === 'up') guard.targetRot = Math.PI;
                    else if (step.dir === 'down') guard.targetRot = 0;
                    else if (step.dir === 'left') guard.targetRot = -Math.PI / 2;
                    else if (step.dir === 'right') guard.targetRot = Math.PI / 2;

                    guard.dirs = [step.dir];
                    guard.dirIdx = 0;
                }
            });
        }

        // Update their vision cones from their new positions
        updateVision();

        // Abort movement if caught mid-step
        const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
        if (inVision) {
            checkPhysicalDetection();
            isPlayerMoving = false;
            return;
        }

        // Wait 150ms for the meshes to visually slide before calculating the next step
        setTimeout(nextStep, 150);
    }

    nextStep();
}

function buildPhysicalWorld() {
    physGridGroup.clear();
    visionGroup.clear();

    // Remove the player mesh from the previous level to prevent ghosting
    if (playerGroup) {
        scene.remove(playerGroup);
    }

    const rows = currentLevelData.map.length;
    const cols = currentLevelData.map[0].length;

    // Inject 3D environment models and scan for elevation
    let envMesh = null;
    currentLevelData.heightMap = [];

    if (currentLevelIndex === 1 && models.level1) {
        envMesh = models.level1.clone();
        envMesh.position.set(0, 0, 0);
        envMesh.updateMatrixWorld(true);

        currentLevelData.robotArm = envMesh.getObjectByName("RoboticArm");
        if (currentLevelData.robotArm) {
            currentLevelData.robotArmTargetRot = currentLevelData.robotArm.rotation.y;
            // Hide environmental interactables temporarily so raycasters hit the floor mesh
            currentLevelData.robotArm.visible = false;
        }

        physGridGroup.add(envMesh);
    }

    const heightRaycaster = new THREE.Raycaster();
    const downVector = new THREE.Vector3(0, -1, 0);

    // Create a Global Normal Map to store slope angles
    currentLevelData.normalMap = [];

    for (let r = 0; r < rows; r++) {
        currentLevelData.heightMap[r] = [];
        currentLevelData.normalMap[r] = [];

        for (let c = 0; c < cols; c++) {
            const type = currentLevelData.map[r][c];

            // 3-Point Raycaster check to determine tile elevation and slope
            let tileY = 0;
            let tileNormal = new THREE.Vector3(0, 1, 0);

            if (envMesh) {
                const hits = new THREE.Raycaster(new THREE.Vector3(c, 10, r), downVector).intersectObject(envMesh, true);
                if (hits.length > 0) {
                    tileY = hits[0].point.y;

                    const hitX = new THREE.Raycaster(new THREE.Vector3(c + 0.1, 10, r), downVector).intersectObject(envMesh, true);
                    const hitZ = new THREE.Raycaster(new THREE.Vector3(c, 10, r + 0.1), downVector).intersectObject(envMesh, true);

                    if (hitX.length > 0 && hitZ.length > 0) {
                        const vecX = new THREE.Vector3().subVectors(hitX[0].point, hits[0].point);
                        const vecZ = new THREE.Vector3().subVectors(hitZ[0].point, hits[0].point);
                        tileNormal.crossVectors(vecZ, vecX).normalize();
                        if (tileNormal.y < 0) tileNormal.negate();
                    }
                }
            }

            // Save height and slope to the global level data
            currentLevelData.heightMap[r][c] = tileY;
            currentLevelData.normalMap[r][c] = tileNormal;

            // Walkable Tiles
            if (type !== 1 && type !== 4) {
                const isExit = currentLevelData.exit && currentLevelData.exit.r === r && currentLevelData.exit.c === c;

                const floor = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.05, 0.95),
                    new THREE.MeshStandardMaterial({
                        color: 0x000000, emissive: 0x00ffcc, emissiveIntensity: 0.5,
                        transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending
                    })
                );
                floor.position.set(c, tileY + 0.05, r);
                floor.renderOrder = 1;
                floor.userData = { r, c, type: 'floor', isHitbox: true };

                const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.95));
                const outlineColor = isExit ? 0x00ffcc : 0x518f88;

                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                    color: outlineColor, transparent: true, opacity: isExit ? 1.0 : 0.1, depthWrite: false
                }));

                line.rotation.x = -Math.PI / 2;
                line.position.y = 0.05;
                line.renderOrder = 2;
                line.raycast = () => { };
                line.userData = { isOutline: true };

                floor.add(line);

                // Apply the pre-calculated slope from memory
                const up = new THREE.Vector3(0, 1, 0);
                floor.quaternion.setFromUnitVectors(up, tileNormal);

                physGridGroup.add(floor);
            }

            // Terminal
            if (type === 2) {
                const terminal = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.8, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5, transparent: true }));
                terminal.position.set(c, tileY + 0.4, r);
                const tData = currentLevelData.terminals.find(t => t.r === r && t.c === c);
                terminal.userData = { r, c, type: 'terminal', data: tData };
                physGridGroup.add(terminal);
            }

            // Locked Door
            if (type === 3) {
                const physDoorGroup = new THREE.Group();
                physDoorGroup.position.set(c, tileY + 0.75, r);

                // Rotate the door based on layout direction
                const dData = currentLevelData.doors.find(d => d.r === r && d.c === c);
                if (dData && dData.dir === 'vertical') {
                    physDoorGroup.rotation.y = Math.PI / 2;
                } else {
                    physDoorGroup.rotation.y = 0;
                }

                const doorGeo = new THREE.BoxGeometry(0.5, 1.5, 0.2);
                const doorMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.2, transparent: true });
                const physDoorLeft = new THREE.Mesh(doorGeo, doorMat);
                physDoorLeft.position.set(-0.25, 0, 0);
                physDoorLeft.raycast = () => { };

                const physDoorRight = new THREE.Mesh(doorGeo, doorMat.clone());
                physDoorRight.position.set(0.25, 0, 0);
                physDoorRight.raycast = () => { };

                physDoorGroup.add(physDoorLeft);
                physDoorGroup.add(physDoorRight);
                physGridGroup.add(physDoorGroup);

                if (dData) {
                    dData.leftMesh = physDoorLeft;
                    dData.rightMesh = physDoorRight;
                }
            }

            // Security Camera
            if (type === 5) {
                const camMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.4, 0.4),
                    new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true })
                );
                camMesh.position.set(c, 1.2, r);

                camMesh.userData = { r, c, type: 'camera' };

                const cData = currentLevelData.cameras.find(cam => cam.r === r && cam.c === c);
                if (cData) cData.mesh = camMesh;
                physGridGroup.add(camMesh);
            }

            // Datapad / Passwords
            if (type === 6) {
                const pad = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.2),
                    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 1, transparent: true })
                );
                pad.position.set(c, tileY + 0.4, r);

                const pData = currentLevelData.passwords.find(p => p.r === r && p.c === c);
                if (pData) pData.mesh = pad;

                pad.userData = { r, c, type: 'password', data: pData };
                physGridGroup.add(pad);
            }
        }
    }
    scene.add(physGridGroup);

    if (currentLevelData.robotArm) {
        currentLevelData.robotArm.visible = true;
    }

    // Build Dynamic Platforms
    currentLevelData.platforms.forEach(plat => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 0.15, 0.95),
            new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.2, transparent: true })
        );
        mesh.position.set(plat.c, 0.05, plat.r);
        mesh.userData = { r: plat.r, c: plat.c, type: 'platform' };
        plat.mesh = mesh;
        physGridGroup.add(mesh);
    });

    currentLevelData.drones.forEach(drone => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 0.5, transparent: true })
        );
        mesh.position.set(drone.c, 0.8, drone.r);
        mesh.userData = { r: drone.r, c: drone.c, type: 'drone' };
        drone.mesh = mesh;
        physGridGroup.add(mesh);
    });

    // Guard Iteration
    if (currentLevelData.guards) {
        currentLevelData.guards.forEach(guard => {
            let guardTileY = 0;
            if (currentLevelData.heightMap && currentLevelData.heightMap[guard.r]) {
                guardTileY = currentLevelData.heightMap[guard.r][guard.c] || 0;
            }

            // Bridge the pathfinding system to the vision system
            if (guard.path && !guard.dirs) {
                guard.dirs = [guard.path[0].dir];
                guard.dirIdx = 0;
            }

            let initRot = 0;
            const dir = guard.dirs[guard.dirIdx];
            if (dir === 'up') initRot = Math.PI;
            else if (dir === 'down') initRot = 0;
            else if (dir === 'left') initRot = -Math.PI / 2;
            else if (dir === 'right') initRot = Math.PI / 2;

            let guardMesh;
            if (models.guard) {
                guardMesh = SkeletonUtils.clone(models.guard);
                guardMesh.scale.set(0.5, 0.5, 0.5);
                guardMesh.position.set(guard.c, guardTileY, guard.r);
            } else {
                guardMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true })
                );
                guardMesh.position.set(guard.c, guardTileY + 0.5, guard.r);
            }

            // Set starting rotation and save target angles
            guardMesh.rotation.y = initRot;
            guard.targetRot = initRot;

            guard.mesh = guardMesh;
            physGridGroup.add(guardMesh);
        });
    }

    updateVision();
    scene.add(visionGroup);

    playerGroup = new THREE.Group();

    physBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1), new THREE.MeshStandardMaterial({ color: 0x0088ff, transparent: true }));
    physBody.position.y = 0.5;
    playerGroup.add(physBody);

    // Layer 3 (Player renders on top of physical objects)
    netBody1 = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false })
    );
    netBody1.position.y = 0.5;
    netBody1.renderOrder = 1000;

    netBody2 = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, depthTest: false, depthWrite: false })
    );
    netBody2.position.y = 0.5;
    netBody2.renderOrder = 1000;

    playerGroup.add(netBody1);
    playerGroup.add(netBody2);

    scene.add(playerGroup);
}

// ==========================================
// GUARD & DETECTION LOGIC 
// ==========================================
function updateVision() {
    // Wipe the drawn tiles cache for the new turn
    if (window.drawnVisionTiles) window.drawnVisionTiles.clear();

    visionGroup.clear();

    if (currentLevelData.guards) {
        currentLevelData.guards.forEach(guard => {
            const gR = guard.r;
            const gC = guard.c;
            const gDir = guard.dirs[guard.dirIdx];

            if (guard.mesh) {
                let targetRot = 0;
                if (gDir === 'up') targetRot = Math.PI;
                else if (gDir === 'down') targetRot = 0;
                else if (gDir === 'left') targetRot = -Math.PI / 2;
                else if (gDir === 'right') targetRot = Math.PI / 2;

                guard.targetRot = targetRot;
            }

            drawVisionCone(gR, gC, gDir, 2, 1, 1);
        });
    }

    if (currentLevelData.cameras) {
        currentLevelData.cameras.forEach(cam => {
            if (cam.active) {
                const cDir = cam.dirs[cam.dirIdx];
                drawVisionCone(cam.r, cam.c, cDir, 5, 0, 0);
                if (cam.mesh) cam.mesh.material.emissive.setHex(0xff0000);
            } else {
                if (cam.mesh) cam.mesh.material.emissive.setHex(0x000000);
            }
        });
    }

    if (currentLevelData.drones) {
        currentLevelData.drones.forEach(drone => {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const vR = drone.r + dr;
                    const vC = drone.c + dc;

                    if (vR < 0 || vR >= currentLevelData.map.length || vC < 0 || vC >= currentLevelData.map[0].length) continue;
                    if (currentLevelData.map[vR][vC] === 1) continue;

                    // Check the cache before drawing drone tiles
                    const tileKey = `${vR},${vC}`;
                    if (!window.drawnVisionTiles.has(tileKey)) {
                        window.drawnVisionTiles.add(tileKey);

                        // Bake the rotation directly into the geometry
                        const droneGeo = new THREE.PlaneGeometry(0.9, 0.9);
                        droneGeo.rotateX(-Math.PI / 2);

                        const vision = new THREE.Mesh(
                            droneGeo,
                            new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
                        );

                        const vY = currentLevelData.heightMap[vR][vC];
                        const vNormal = currentLevelData.normalMap[vR][vC];

                        vision.position.set(vC, vY + 0.08, vR);

                        const up = new THREE.Vector3(0, 1, 0);
                        vision.quaternion.setFromUnitVectors(up, vNormal);

                        vision.renderOrder = 2;
                        vision.userData = { r: vR, c: vC, isCone: true };
                        visionGroup.add(vision);
                    }
                }
            }
        });
    }
}

// Helper function to draw the red tiles with adjustable spread
function drawVisionCone(startR, startC, dir, length, startOffset = 1, spread = 1) {
    let dr = 0, dc = 0;
    let orthoR = 0, orthoC = 0;

    if (dir === 'up') { dr = -1; orthoC = 1; }
    else if (dir === 'down') { dr = 1; orthoC = 1; }
    else if (dir === 'left') { dc = -1; orthoR = 1; }
    else if (dir === 'right') { dc = 1; orthoR = 1; }

    if (!window.drawnVisionTiles) window.drawnVisionTiles = new Set();

    for (let v = startOffset; v <= length; v++) {

        const centerR = startR + (dr * v);
        const centerC = startC + (dc * v);
        if (centerR < 0 || centerR >= currentLevelData.map.length || centerC < 0 || centerC >= currentLevelData.map[0].length) break;
        if (currentLevelData.map[centerR][centerC] === 1) break;

        for (let s = -spread; s <= spread; s++) {
            const vR = startR + (dr * v) + (orthoR * s);
            const vC = startC + (dc * v) + (orthoC * s);

            if (vR < 0 || vR >= currentLevelData.map.length || vC < 0 || vC >= currentLevelData.map[0].length) continue;
            if (currentLevelData.map[vR][vC] === 1) continue;

            const tileKey = `${vR},${vC}`;

            if (!window.drawnVisionTiles.has(tileKey)) {
                window.drawnVisionTiles.add(tileKey);

                const visionGeo = new THREE.PlaneGeometry(0.9, 0.9);
                visionGeo.rotateX(-Math.PI / 2);

                const vision = new THREE.Mesh(
                    visionGeo,
                    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
                );

                let vY = 0;
                let vNormal = new THREE.Vector3(0, 1, 0);

                if (currentLevelData.heightMap && currentLevelData.heightMap[vR]) {
                    vY = currentLevelData.heightMap[vR][vC] || 0;
                    vNormal = currentLevelData.normalMap[vR][vC] || new THREE.Vector3(0, 1, 0);
                }

                vision.position.set(vC, vY + 0.08, vR);

                const up = new THREE.Vector3(0, 1, 0);
                vision.quaternion.setFromUnitVectors(up, vNormal);

                vision.renderOrder = 2;
                vision.userData = { r: vR, c: vC, isCone: true };

                visionGroup.add(vision);
            }
        }
    }
}

function checkPhysicalDetection() {
    const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
    if (inVision) {
        document.getElementById('log').innerText = "CAUGHT!";

        player.r = currentLevelData.spawn.r;
        player.c = currentLevelData.spawn.c;

        player.ap = player.maxAp;
        if (currentLevelData.guards) currentLevelData.guards.forEach(g => g.dirIdx = 0);
        updateVision();
        document.getElementById('ap-display').innerText = player.ap;
    }
}

function processMovingPlatforms() {
    currentLevelData.platforms.forEach(plat => {
        const wasPlayerOnPlatform = (player.r === plat.r && player.c === plat.c);

        if (plat.forward) {
            plat.pathIdx++;
            if (plat.pathIdx >= plat.path.length - 1) plat.forward = false;
        } else {
            plat.pathIdx--;
            if (plat.pathIdx <= 0) plat.forward = true;
        }

        plat.r = plat.path[plat.pathIdx][0];
        plat.c = plat.path[plat.pathIdx][1];

        if (plat.mesh) {
            plat.mesh.userData.r = plat.r;
            plat.mesh.userData.c = plat.c;
        }

        if (wasPlayerOnPlatform) {
            player.r = plat.r;
            player.c = plat.c;
            document.getElementById('log').innerText = "PLATFORM IN MOTION.";
        }
    });
}

function processDrones() {
    currentLevelData.drones.forEach(drone => {
        if (drone.forward) {
            drone.pathIdx++;
            if (drone.pathIdx >= drone.path.length - 1) drone.forward = false;
        } else {
            drone.pathIdx--;
            if (drone.pathIdx <= 0) drone.forward = true;
        }
        drone.r = drone.path[drone.pathIdx][0];
        drone.c = drone.path[drone.pathIdx][1];

        if (drone.mesh) {
            drone.mesh.userData.r = drone.r;
            drone.mesh.userData.c = drone.c;
        }
    });
}

function spawnICE(f, x, z) {
    const types = ['Asp', 'Kraken', 'Scorpion', 'Wisp', 'Hellhound'];
    const type = types[Math.floor(Math.random() * types.length)];

    const g = new THREE.Group();
    let b;
    let color;

    if (type === 'Asp') {
        color = 0x2E6F40;
        if (models.asp) {
            b = models.asp.clone();
            b.scale.set(0.3, 0.3, 0.3);
            b.position.y = -0.35;
            b.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                }
            });
        } else {
            b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
        }
    }
    else if (type === 'Kraken') {
        color = 0x0088ff;
        b = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
    }
    else if (type === 'Scorpion') {
        color = 0x00ff00;
        b = new THREE.Mesh(new THREE.TetrahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
    }
    else if (type === 'Wisp') {
        color = 0xffffff;
        b = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
    }
    else if (type === 'Hellhound') {
        color = 0xff4400;
        if (models.hellhound) {
            b = models.hellhound.clone();
            b.scale.set(0.5, 0.5, 0.5);
            b.position.y = -0.35;
            b.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                }
            });
        } else {
            b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
        }
    }

    // Force ICE models to render strictly on top of the physical world
    b.traverse((child) => {
        if (child.isMesh) {
            child.renderOrder = 1000;
            if (child.material) {
                child.material.depthTest = false;
                child.material.depthWrite = false;
                child.material.transparent = true;
            }
        }
    });

    g.add(b);
    g.position.set(x, -f * FLOOR_SPACING + 0.4, z);
    scene.add(g);

    enemies.push({ data: { x, z, floor: f, hp: 10, active: true, isAlerted: false, type: type, baseColor: color }, group: g, body: b });
}

// ==========================================
// 4. NETRUN LAYER LOGIC (Dynamic Mirroring)
// ==========================================
const FLOOR_SPACING = 6;
let currentTotalFloors = 3;
let activeTerminal = null;
let netFloorGroups = [];
let enemies = [];
let netSlashEffect, netSlashMat;
let selectedTarget = null;
let isScanning = false;
let netLight;

// Track the physical height of the active terminal
let netrunBaseY = 0;

scene.add(new THREE.AmbientLight(0x404040, 2));

netLight = new THREE.PointLight(0x00ffcc, 100, 20);
netLight.position.set(0, 5, 0);
scene.add(netLight);

function initNetrun() {
    netSlashMat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0, depthTest: false });
    netSlashEffect = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32), netSlashMat);
    netSlashEffect.rotation.x = Math.PI / 2;
    netSlashEffect.renderOrder = 999;
    scene.add(netSlashEffect);
}

function buildNetUI() {
    const sc = document.getElementById('stack-container');
    sc.innerHTML = '';
    for (let i = 0; i < currentTotalFloors; i++) {
        const div = document.createElement('div');
        div.className = 'stack-node';
        div.id = `node-${i}`;
        div.innerText = `L_0${i + 1}`;
        sc.appendChild(div);
    }
}

function generateMirroredNetrun(terminalData) {
    activeTerminal = terminalData;
    currentTotalFloors = terminalData.floors;

    netrunBaseY = 0;
    if (currentLevelData.heightMap && currentLevelData.heightMap[terminalData.r]) {
        netrunBaseY = currentLevelData.heightMap[terminalData.r][terminalData.c] || 0;
    }

    buildNetUI();

    netFloorGroups.forEach(g => scene.remove(g));
    netFloorGroups = [];
    enemies.forEach(e => scene.remove(e.group));
    enemies = [];

    let validNetCoords = [];

    for (let f = 0; f < currentTotalFloors; f++) {
        const group = new THREE.Group();
        group.position.y = -f * FLOOR_SPACING;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const wR = terminalData.r + i;
                const wC = terminalData.c + j;

                const isSafe = wR >= 0 && wR < currentLevelData.map.length && wC >= 0 && wC < currentLevelData.map[0].length;
                if (isSafe && currentLevelData.map[wR][wC] !== 1 && currentLevelData.map[wR][wC] !== 4) {

                    if (f === 0) validNetCoords.push({ x: wC, z: wR });

                    const tile = new THREE.Mesh(
                        new THREE.BoxGeometry(0.9, 0.1, 0.9),
                        new THREE.MeshStandardMaterial({ color: 0x001111, emissive: 0x00ffcc, emissiveIntensity: 0.1, transparent: true, opacity: 0.1, depthTest: false, depthWrite: false })
                    );
                    tile.position.set(wC, 0.02, wR);
                    tile.renderOrder = 998;

                    // Save the base opacity/emissive properties for animations
                    tile.userData = { x: wC, z: wR, baseOpacity: 0.1, baseEmissive: 0.1 };
                    group.add(tile);

                    const wire = new THREE.LineSegments(
                        new THREE.EdgesGeometry(tile.geometry),
                        new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4, depthTest: false, depthWrite: false })
                    );
                    wire.position.set(wC, 0.02, wR);
                    wire.renderOrder = 999;
                    wire.raycast = () => { };
                    wire.userData = { baseOpacity: 0.4 };
                    group.add(wire);
                }
            }
        }

        const term = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5, transparent: true, opacity: 1.0, depthTest: false, depthWrite: false })
        );
        term.position.set(terminalData.c, 0.4, terminalData.r);
        term.renderOrder = 1000;
        term.userData = { isTerminal: true, c: terminalData.c, r: terminalData.r, baseOpacity: 1.0, baseEmissive: 0.5 };
        group.add(term);

        scene.add(group);
        netFloorGroups.push(group);
    }

    if (validNetCoords.length > 0) {
        const outerTiles = validNetCoords.filter(t => t.x !== terminalData.c || t.z !== terminalData.r);
        const spawn1 = outerTiles.length > 0 ? outerTiles[0] : validNetCoords[0];
        const spawn2 = outerTiles.length > 1 ? outerTiles[1] : validNetCoords[0];

        spawnICE(1, spawn1.x, spawn1.z);
        if (currentTotalFloors > 2) spawnICE(2, spawn2.x, spawn2.z);
    }

    player.netAp = player.maxNetAp;
    document.getElementById('net-ap-display').innerText = player.netAp;

    player.floor = 0;
    updateNetUI();
}

// ==========================================
// 5. INTERACTION & TURN LOGIC
// ==========================================
function toggleMode(mode) {
    currentMode = mode;
    const isNet = mode === 'NETRUN';

    // Cleanup physical UI elements
    if (typeof clearHighlights === "function") clearHighlights();
    hoveredTile = null;

    document.querySelectorAll('.net-only').forEach(el => el.style.display = isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');
    document.querySelectorAll('.phys-only').forEach(el => el.style.display = !isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');

    const log = document.getElementById('log');
    log.innerText = isNet ? "CONNECTION ESTABLISHED. BYPASS SYSTEM CORE." : "AVOID DETECTION.";
    log.className = isNet ? 'log log-netrun' : 'log';
}

function takeDamage(amt) {
    if (player.statuses.scalesBarrier > 0) {
        player.statuses.scalesBarrier--;
        document.getElementById('log').innerText = `SCALES.EXE ABSORBED DAMAGE! (${player.statuses.scalesBarrier} STACKS LEFT)`;
        document.getElementById('log').className = 'log log-netrun-alert';
        return;
    }

    player.hp -= amt;
    document.getElementById('hp-bar').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('log').innerText = `CRITICAL: NEURAL SPIKE! -${amt} HP`;
    document.getElementById('log').className = 'log log-netrun';

    if (player.hp <= 0) {
        document.getElementById('log').innerText = "FATAL ERROR. NEURAL LINK SEVERED.";
        setTimeout(() => location.reload(), 2000);
    }
}

window.addEventListener('mousemove', (e) => {
    if (currentMode !== 'PHYSICAL' || appState !== 'GAME' || isPlayerMoving) return;

    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(physGridGroup.children);
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;

        // Safely ignore non-grid meshes
        if (data.r === undefined || data.c === undefined) return;

        if (hoveredTile !== `${data.r},${data.c}`) {
            hoveredTile = `${data.r},${data.c}`;
            clearHighlights();

            const type = currentLevelData.map[data.r][data.c];
            if (type !== 1 && type !== 2) {
                currentPath = getPath(player.r, player.c, data.r, data.c, player.ap);

                if (currentPath && currentPath.length > 0) {
                    physGridGroup.children.forEach(child => {
                        if (child.userData.type === 'floor' || child.userData.type === 'platform') {
                            const inPath = currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);
                            if (inPath) child.material.emissive.setHex(0x00ffcc);
                        }
                    });
                }
            }
        }
    } else {
        if (hoveredTile !== null) {
            hoveredTile = null;
            clearHighlights();
        }
    }
});

window.addEventListener('mousedown', (e) => {
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    if (currentMode === 'PHYSICAL') {
        const intersects = raycaster.intersectObjects(physGridGroup.children);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;

            if (data.r === undefined || data.c === undefined) return;

            const type = currentLevelData.map[data.r][data.c];

            if (type === 1) return;
            if (type === 4 && data.type !== 'platform') return;

            if (type === 2) {
                const dist = Math.abs(player.r - data.r) + Math.abs(player.c - data.c);
                if (dist <= 1) {
                    const tData = currentLevelData.terminals.find(t => t.r === data.r && t.c === data.c);
                    if (tData) {
                        generateMirroredNetrun(tData);
                        toggleMode('NETRUN');
                        clearHighlights();
                    }
                } else {
                    document.getElementById('log').innerText = "TOO FAR FROM TERMINAL. MOVE CLOSER.";
                }
                return;
            }

            // Collect the Datapad
            if (type === 6) {
                const dist = Math.abs(player.r - data.r) + Math.abs(player.c - data.c);
                if (dist <= 1) {
                    const pData = currentLevelData.passwords.find(p => p.r === data.r && p.c === data.c);
                    if (pData && pData.mesh.visible) {
                        player.inventory.push(pData.id);
                        pData.mesh.visible = false;

                        player.ap -= 1;
                        document.getElementById('ap-display').innerText = player.ap;
                        document.getElementById('log').innerText = "DATAPAD ACQUIRED. DECRYPTION KEY STORED.";
                        clearHighlights();
                    }
                } else {
                    document.getElementById('log').innerText = "TOO FAR FROM DATAPAD.";
                }
                return;
            }

            // Execute the pre-calculated path
            if (currentPath && currentPath.length > 0) {
                const lastStep = currentPath[currentPath.length - 1];

                if (lastStep.r === data.r && lastStep.c === data.c) {
                    executePathMovement(currentPath);
                    return;
                }
            }

            if (data.r === player.r && data.c === player.c) return;

            document.getElementById('log').innerText = "INVALID MOVE. PATH BLOCKED OR NO AP.";
        }
    }
    else if (currentMode === 'NETRUN') {
        const intersects = raycaster.intersectObjects(netFloorGroups[player.floor].children);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;

            if (data.isTerminal) {
                if (player.floor === currentTotalFloors - 1) {

                    // Combat Lockout Check
                    const inCombat = enemies.some(en => en.data.active && en.data.isAlerted);
                    if (inCombat) {
                        document.getElementById('log').innerText = "ACCESS DENIED: COMBAT DETECTED. PURGE ICE FIRST.";
                        return;
                    }

                    let successMessage = "";

                    if (activeTerminal.action === "unlock_door") {
                        const targetDoor = currentLevelData.doors.find(d => d.id === activeTerminal.targetId);
                        if (targetDoor) {
                            targetDoor.unlocked = true;
                            targetDoor.leftMesh.material.color.setHex(0x00ffcc);
                            targetDoor.leftMesh.material.emissive.setHex(0x00ffcc);
                            targetDoor.rightMesh.material.color.setHex(0x00ffcc);
                            targetDoor.rightMesh.material.emissive.setHex(0x00ffcc);
                        }
                        successMessage = "CORE COMPROMISED. DOOR UNLOCKED.";

                    } else if (activeTerminal.action === "disable_camera") {
                        const targetCam = currentLevelData.cameras.find(c => c.id === activeTerminal.targetId);
                        if (targetCam) targetCam.active = false;
                        successMessage = "CORE COMPROMISED. CAMERA NETWORK OFFLINE.";

                    } else if (activeTerminal.action === "rotate_arm") {
                        if (currentLevelData.robotArm) {
                            currentLevelData.robotArmTargetRot -= Math.PI;
                            currentLevelData.map[8][7] = 0;
                            currentLevelData.map[7][7] = 0;
                        }
                        successMessage = "CORE COMPROMISED. MACHINERY OVERRIDE ENGAGED.";
                    }

                    // 1. Switch back to physical mode (this sets "AVOID DETECTION.")
                    toggleMode('PHYSICAL');
                    // 2. Update vision (so disabled cameras instantly drop their red cones)
                    updateVision();
                    // 3. Overwrite the default log with your specific success message
                    document.getElementById('log').innerText = successMessage;

                } else {
                    // Jacking out early
                    toggleMode('PHYSICAL');
                    updateVision();
                    document.getElementById('log').innerText = "JACKED OUT OF NETRUN.";
                }
                return;
            }

            const clickedEnemy = enemies.find(e => e.data.active && e.data.floor === player.floor && e.data.x === data.x && e.data.z === data.z);
            if (clickedEnemy) {
                selectedTarget = clickedEnemy;
                document.getElementById('log').innerText = "TARGET LOCKED: ICE_UNIT.";
                return;
            }

            const dist = Math.abs(player.r - data.z) + Math.abs(player.c - data.x);

            // Prevent phasing into solid physical objects during AR
            const targetType = currentLevelData.map[data.z][data.x];
            if (targetType === 2) {
                document.getElementById('log').innerText = "PATH BLOCKED. SOLID OBSTACLE.";
                return;
            }
            const targetDoor = currentLevelData.doors.find(d => d.r === data.z && d.c === data.x);
            if (targetType === 3 && targetDoor && !targetDoor.unlocked) {
                document.getElementById('log').innerText = "PATH BLOCKED. DOOR LOCKED.";
                return;
            }

            if (dist === 1) {
                // Scorpion blocks grid movement
                if (player.statuses.scorpionActive) {
                    document.getElementById('log').innerText = "SCORPION ICE: MOVEMENT ROOTED!";
                    return;
                }
                player.c = data.x;
                player.r = data.z;
                selectedTarget = null;
                consumeNetAction(1);
            } else if (dist > 1) {
                document.getElementById('log').innerText = "INVALID MOVE. SELECT ADJACENT TILE.";
            }
        }
    }
});

window.addEventListener('keydown', (e) => {
    // Only allow spacebar if we are actively playing the level
    if (appState !== 'GAME') return;

    // Check if the Spacebar was pressed
    if (e.code === 'Space') {
        e.preventDefault(); // Prevents the browser from scrolling down the page!

        // Simulate a click on the End Turn button
        document.getElementById('btn-end-turn').click();
    }
});

function consumeNetAction(cost = 1) {
    player.netAp -= cost;
    document.getElementById('net-ap-display').innerText = player.netAp;

    if (player.netAp <= 0) {
        triggerNetAction();

        // Apply penalty, but guarantee at least 1 Net Action
        player.netAp = Math.max(1, player.maxNetAp - player.statuses.netApPenalty);
        player.statuses.netApPenalty = 0;

        document.getElementById('net-ap-display').innerText = player.netAp;
    }
}

function triggerNetAction() {
    if (player.statuses.burning > 0) {
        takeDamage(1);
        document.getElementById('log').innerText = `HELLHOUND FIRE: TOOK 1 DMG! (${player.statuses.burning} TURNS LEFT)`;
        player.statuses.burning--;
    }

    // Tick down disabled program timers
    for (let prog in player.statuses.disabledPrograms) {
        if (player.statuses.disabledPrograms[prog] > 0) {
            player.statuses.disabledPrograms[prog]--;
            if (player.statuses.disabledPrograms[prog] === 0) {
                document.getElementById('log').innerText = `SYSTEM RECOVERED: ${prog.toUpperCase()}.EXE ONLINE.`;
            }
        }
    }

    processNetrunTurn();
}

function processNetrunTurn() {
    player.statuses.krakenActive = false;
    player.statuses.scorpionActive = false;

    enemies.forEach(en => {
        if (!en.data.active) return;

        const distX = Math.abs(player.c - en.data.x);
        const distZ = Math.abs(player.r - en.data.z);
        const dist = Math.max(distX, distZ);

        if (en.data.floor === player.floor && dist <= 2) en.data.isAlerted = true;

        if (en.data.isAlerted && en.data.floor === player.floor) {

            // Constant Area-of-Effect Abilities
            if (en.data.type === 'Kraken') player.statuses.krakenActive = true;
            if (en.data.type === 'Scorpion') player.statuses.scorpionActive = true;

            const isValidIceTile = (x, z) => {
                // Stay within map bounds
                if (z < 0 || z >= currentLevelData.map.length || x < 0 || x >= currentLevelData.map[0].length) return false;

                // MUST stay within the 3x3 AR grid around the terminal
                if (activeTerminal && (Math.abs(x - activeTerminal.c) > 1 || Math.abs(z - activeTerminal.r) > 1)) return false;

                // Treat the terminal itself as a solid wall
                if (activeTerminal && x === activeTerminal.c && z === activeTerminal.r) return false;

                // Treat physical walls and pits as solid
                const type = currentLevelData.map[z][x];
                if (type === 1 || type === 4) return false;

                return true;
            };

            // 2. Execute BFS Pathfinding (Just like the Player's getPath!)
            let queue = [{ x: en.data.x, z: en.data.z, path: [] }];
            let visited = new Set([`${en.data.x},${en.data.z}`]);
            let targetPath = null;

            while (queue.length > 0) {
                let curr = queue.shift();

                // If we found the player, save the path and stop searching
                if (curr.x === player.c && curr.z === player.r) {
                    targetPath = curr.path;
                    break;
                }

                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (let d of dirs) {
                    let nx = curr.x + d[0];
                    let nz = curr.z + d[1];

                    if (!visited.has(`${nx},${nz}`) && isValidIceTile(nx, nz)) {
                        visited.add(`${nx},${nz}`);
                        queue.push({ x: nx, z: nz, path: [...curr.path, { x: nx, z: nz }] });
                    }
                }
            }

            // 3. Take the first step on the calculated path
            if (targetPath && targetPath.length > 0) {
                const nextStep = targetPath[0];

                // Don't physically step onto the player (just get adjacent to attack)
                if (!(nextStep.x === player.c && nextStep.z === player.r)) {
                    en.data.x = nextStep.x;
                    en.data.z = nextStep.z;
                }
            }

            const newDistX = Math.abs(player.c - en.data.x);
            const newDistZ = Math.abs(player.r - en.data.z);

            if (newDistX <= 1 && newDistZ <= 1) {
                takeDamage(1);

                // Specific ICE Attack Effects
                if (en.data.type === 'Asp') {
                    const targetable = ['swordfish', 'harpoon', 'scales', 'swim'];
                    const hitProg = targetable[Math.floor(Math.random() * targetable.length)];

                    player.statuses.disabledPrograms[hitProg] = 3;
                    document.getElementById('log').innerText += ` | ASP VIRUS: ${hitProg.toUpperCase()}.EXE CORRUPTED!`;

                } else if (en.data.type === 'Wisp') {
                    if (player.statuses.netApPenalty < 1) {
                        player.statuses.netApPenalty = 1;
                        document.getElementById('log').innerText += " | WISP HIT: NET ACTION DRAINED!";
                    }
                } else if (en.data.type === 'Hellhound') {
                    player.statuses.burning = 4;
                    document.getElementById('log').innerText += " | HELLHOUND: NEURAL FIRE DETECTED!";
                }

                if (en.body.isGroup) {
                    en.body.traverse((child) => { if (child.isMesh) child.material.emissiveIntensity = 20; });
                    setTimeout(() => { if (en.data.active) en.body.traverse((child) => { if (child.isMesh) child.material.emissiveIntensity = 2; }); }, 200);
                } else {
                    en.body.material.emissiveIntensity = 20;
                    setTimeout(() => { if (en.data.active) en.body.material.emissiveIntensity = 2; }, 200);
                }
            }
        }
    });
}

function updateNetUI() {
    const sc = document.getElementById('stack-container');
    sc.innerHTML = '';

    for (let i = 0; i < currentTotalFloors; i++) {
        const layer = document.createElement('div');
        layer.className = 'stack-layer';
        layer.id = `layer-${i}`;

        if (i === player.floor) {
            layer.classList.add('active');
        }

        const enemyPresent = enemies.some(en => en.data.active && en.data.floor === i && en.data.isAlerted);
        if (enemyPresent) {
            layer.classList.add('detected');
        }

        const isLocked = (i === currentTotalFloors - 1) && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith);
        if (isLocked) {
            layer.classList.add('locked');
        }

        sc.appendChild(layer);
    }
}

function canChangeFloor(targetFloor) {
    const isIceOccupied = enemies.some(en => en.data.active && en.data.floor === targetFloor && en.data.x === player.c && en.data.z === player.r);
    if (isIceOccupied) return false;

    if (targetFloor === currentTotalFloors - 1 && player.c === activeTerminal.c && player.r === activeTerminal.r) return false;

    return true;
}

document.getElementById('btn-up').onclick = () => {
    if (player.statuses.krakenActive) { document.getElementById('log').innerText = "KRAKEN ICE: ELEVATION BLOCKED!"; return; }
    if (player.floor > 0 && canChangeFloor(player.floor - 1)) {
        player.floor--;

        // Alerted enemies follow you up
        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        updateNetUI(); consumeNetAction(1);
    } else if (player.floor > 0) document.getElementById('log').innerText = "ERROR: ELEVATION BLOCKED BY ICE.";
};

document.getElementById('btn-down').onclick = () => {
    if (player.statuses.krakenActive) { document.getElementById('log').innerText = "KRAKEN ICE: DIVE BLOCKED!"; return; }

    // Prevent Diving into locked floors
    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        document.getElementById('log').innerText = "ERROR: DECRYPTION KEY REQUIRED TO ACCESS CORE.";
        return;
    }

    if (player.floor < currentTotalFloors - 1 && canChangeFloor(player.floor + 1)) {
        player.floor++;

        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        updateNetUI(); consumeNetAction(1);
    } else if (player.floor < currentTotalFloors - 1) document.getElementById('log').innerText = "ERROR: DIVE BLOCKED BY OBSTACLE.";
};

document.getElementById('btn-sonar').onclick = () => {
    if (currentMode !== 'NETRUN' || isScanning) return;

    isScanning = true;
    document.getElementById('log').innerText = "SONAR.EXE: SCANNING ARCHITECTURE...";
    document.getElementById('log').className = 'log log-netrun';

    enemies.forEach(en => {
        if (en.data.active) {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.add('scanning-active');
                // Highlight layer during scan pulse
                layer.classList.add('detected');
            }
        }
    });

    setTimeout(() => {
        isScanning = false;
        enemies.forEach(en => {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.remove('scanning-active');
                // Remove the scan alert, unless the enemy is naturally alerted
                const naturallyAlerted = enemies.some(nEn => nEn.data.active && nEn.data.floor === en.data.floor && nEn.data.isAlerted);
                if (!naturallyAlerted) {
                    layer.classList.remove('detected');
                }
            }
        });
    }, 3000);

    consumeNetAction(1);
};

document.getElementById('btn-scales').onclick = () => {
    if (currentMode !== 'NETRUN') return;

    // Check for disabled programs (Asp virus)
    if (player.statuses.disabledPrograms.scales > 0) {
        document.getElementById('log').innerText = `ERROR: SCALES.EXE REBOOTING (${player.statuses.disabledPrograms.scales} TURNS)`;
        return;
    }

    player.statuses.scalesBarrier = 2;
    document.getElementById('log').innerText = "SCALES.EXE: ABSORB NEXT 2 SPIKES.";
    document.getElementById('log').className = 'log log-netrun';

    consumeNetAction(1);
};

document.getElementById('btn-swim').onclick = () => {
    if (currentMode !== 'NETRUN') return;
    if (player.statuses.krakenActive) { document.getElementById('log').innerText = "SWIM.EXE FAILED: KRAKEN ROOTED YOU."; return; }

    if (player.statuses.disabledPrograms.swim > 0) {
        document.getElementById('log').innerText = `ERROR: SWIM.EXE REBOOTING (${player.statuses.disabledPrograms.swim} TURNS)`;
        return;
    }

    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        document.getElementById('log').innerText = "SWIM.EXE FAILED: DECRYPTION KEY REQUIRED.";
        return;
    }

    if (player.floor < currentTotalFloors - 1) {
        if (!canChangeFloor(player.floor + 1)) {
            document.getElementById('log').innerText = "SWIM.EXE FAILED: CELL OCCUPIED."; return;
        }

        player.floor++;

        // Drop aggro of the enemies left behind on the old floor
        enemies.forEach(en => {
            if (en.data.active && en.data.floor !== player.floor) {
                en.data.isAlerted = false;
            }
        });

        updateNetUI();
        document.getElementById('log').innerText = "SWIM.EXE: EMERGENCY DIVE EXECUTED. ICE EVADED.";
        document.getElementById('log').className = 'log log-netrun';

        consumeNetAction(1);
    } else {
        document.getElementById('log').innerText = "SWIM.EXE FAILED: MAXIMUM DEPTH REACHED.";
    }
};

document.getElementById('btn-harpoon').onclick = () => {
    if (currentMode !== 'NETRUN' || !selectedTarget || !selectedTarget.data.active) return;

    if (player.statuses.disabledPrograms.harpoon > 0) {
        document.getElementById('log').innerText = `ERROR: HARPOON.EXE REBOOTING (${player.statuses.disabledPrograms.harpoon} TURNS)`;
        return;
    }

    const dx = Math.abs(player.c - selectedTarget.data.x);
    const dz = Math.abs(player.r - selectedTarget.data.z);

    if (selectedTarget.data.floor === player.floor) {
        selectedTarget.data.hp -= 3;

        netSlashEffect.position.set(selectedTarget.group.position.x, 0.6, selectedTarget.group.position.z);
        netSlashMat.opacity = 1;

        if (selectedTarget.data.hp <= 0) {
            selectedTarget.data.active = false;
            selectedTarget.group.visible = false;
            selectedTarget = null;
            document.getElementById('log').innerText = "TARGET TERMINATED";
        } else {
            document.getElementById('log').innerText = `ICE INTEGRITY: ${selectedTarget.data.hp * 10}%`;
        }

        consumeNetAction(1);
    }
};

document.getElementById('btn-swordfish').onclick = () => {
    if (currentMode !== 'NETRUN' || !selectedTarget || !selectedTarget.data.active) return;

    if (player.statuses.disabledPrograms.swordfish > 0) {
        document.getElementById('log').innerText = `ERROR: SWORDFISH.EXE REBOOTING (${player.statuses.disabledPrograms.swordfish} TURNS)`;
        return;
    }

    const dx = Math.abs(player.c - selectedTarget.data.x);
    const dz = Math.abs(player.r - selectedTarget.data.z);

    if (selectedTarget.data.floor === player.floor && dx <= 1 && dz <= 1) {
        selectedTarget.data.hp -= 5;
        netSlashEffect.position.set(selectedTarget.group.position.x, 0.6, selectedTarget.group.position.z);
        netSlashEffect.scale.set(0.1, 0.1, 0.1);
        netSlashMat.opacity = 1;

        if (selectedTarget.data.hp <= 0) {
            selectedTarget.data.active = false;
            selectedTarget.group.visible = false;
            selectedTarget = null;
            document.getElementById('log').innerText = "TARGET TERMINATED";
        } else document.getElementById('log').innerText = `ICE INTEGRITY: ${selectedTarget.data.hp * 10}%`;

        consumeNetAction(1);
    } else document.getElementById('log').innerText = "ERROR: TARGET OUT OF RANGE";
};

document.getElementById('btn-end-turn').onclick = () => {
    if (isPlayerMoving) return;

    if (currentMode === 'PHYSICAL') {
        player.ap = player.maxAp;
        document.getElementById('ap-display').innerText = player.ap;

        // Move Patrollers and spin Stationary guards
        if (currentLevelData.guards) {
            currentLevelData.guards.forEach(guard => {
                if (guard.path) {
                    guard.pathIdx = (guard.pathIdx + 1) % guard.path.length;
                    const step = guard.path[guard.pathIdx];

                    guard.r = step.r;
                    guard.c = step.c;

                    if (step.dir === 'up') guard.targetRot = Math.PI;
                    else if (step.dir === 'down') guard.targetRot = 0;
                    else if (step.dir === 'left') guard.targetRot = -Math.PI / 2;
                    else if (step.dir === 'right') guard.targetRot = Math.PI / 2;

                    guard.dirs = [step.dir];
                    guard.dirIdx = 0;
                } else if (guard.dirs) {
                    guard.dirIdx = (guard.dirIdx + 1) % guard.dirs.length;
                }
            });
        }

        processMovingPlatforms();
        processDrones();
        updateVision();
        checkPhysicalDetection();

    } else if (currentMode === 'NETRUN') {
        document.getElementById('log').innerText = "NET TURN ENDED";
        player.netAp = 0;
        consumeNetAction(0);
    }
};

// ==========================================
// 6. ANIMATION & CAMERA LOOP
// ==========================================

function animate() {
    requestAnimationFrame(animate);

    if (appState !== 'GAME' && appState !== 'TUTORIAL') return;

    const targetPhysOp = currentMode === 'NETRUN' ? 0.15 : 1.0;

    physGridGroup.children.forEach(child => {
        let targetOp = targetPhysOp;

        const isActiveTerminal = (currentMode === 'NETRUN' && child.userData.type === 'terminal' && child.userData.data && activeTerminal && child.userData.data.id === activeTerminal.id);

        child.traverse(m => {
            if ((m.isMesh || m.isLine) && m.material) {
                const mats = Array.isArray(m.material) ? m.material : [m.material];

                mats.forEach(mat => {
                    if (mat.transparent === false) mat.transparent = true;

                    let finalTargetOp = targetOp;

                    // Apply the glow to the active physical terminal
                    if (isActiveTerminal) {
                        finalTargetOp = 1.0;
                    }
                    else if (m.userData.isHitbox) {
                        const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
                        const inPath = currentPath && currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);

                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.3;
                        } else if (isExit || inPath) {
                            finalTargetOp = 0.4;
                        } else {
                            finalTargetOp = 0.0;
                        }
                    }
                    else if (m.userData.isOutline) {
                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.0;
                        } else {
                            const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
                            // Set target opacity for inactive tactical grid
                            finalTargetOp = isExit ? 1.0 : 0.25;
                        }
                    }

                    if (mat.opacity !== undefined) {
                        mat.opacity += (finalTargetOp - mat.opacity) * 0.1;
                    }

                    if (mat.emissive && !m.isLine) {
                        const maxGlow = (child.userData && child.userData.type === 'camera') ? 1.0 : 0.5;
                        mat.emissiveIntensity = mat.opacity * maxGlow;
                    }
                });
            }
        });
    });

    physBody.material.opacity += (targetPhysOp - physBody.material.opacity) * 0.1;

    visionGroup.children.forEach(child => {
        if (child.material) {
            const targetOp = child.userData.isCone
                ? (currentMode === 'NETRUN' ? 0.05 : 0.4)
                : targetPhysOp;
            child.material.opacity += (targetOp - child.material.opacity) * 0.1;
        }
    });

    playerGroup.position.x += (player.c - playerGroup.position.x) * 0.2;
    playerGroup.position.z += (player.r - playerGroup.position.z) * 0.2;

    let targetY = 0;
    if (currentMode === 'NETRUN') {
        targetY = netrunBaseY;
    } else if (currentLevelData.heightMap && currentLevelData.heightMap[player.r]) {
        targetY = currentLevelData.heightMap[player.r][player.c] || 0;
    }
    playerGroup.position.y += (targetY - playerGroup.position.y) * 0.2;

    physBody.visible = (currentMode === 'PHYSICAL' || physBody.material.opacity > 0.1);

    if (currentMode === 'NETRUN') {
        physBody.visible = false;
        netBody1.visible = true;
        netBody2.visible = true;
        netBody2.rotation.y += 0.02;
        netSlashEffect.visible = true;

        if (netSlashMat.opacity > 0) {
            netSlashEffect.scale.x += 0.2;
            netSlashEffect.scale.y += 0.2;
            netSlashMat.opacity -= 0.05;
        }

        netLight.position.set(playerGroup.position.x, playerGroup.position.y + 5, playerGroup.position.z);
        netLight.visible = true;
    } else {
        physBody.visible = true;
        netBody1.visible = false;
        netBody2.visible = false;
        netSlashEffect.visible = false;
        netLight.visible = false;
    }

    camera.position.x += ((player.c + 10) - camera.position.x) * 0.1;
    camera.position.z += ((player.r + 10) - camera.position.z) * 0.1;
    camera.position.y += (10 - camera.position.y) * 0.1;

    // Smoothly rotate the environmental arm
    if (currentLevelData && currentLevelData.robotArm) {
        currentLevelData.robotArm.rotation.y += (currentLevelData.robotArmTargetRot - currentLevelData.robotArm.rotation.y) * 0.1;
    }

    // Smoothly rotate all guards
    if (currentLevelData.guards) {
        currentLevelData.guards.forEach(guard => {
            if (guard.mesh) {
                if (guard.targetRot !== undefined) {
                    const diff = guard.targetRot - guard.mesh.rotation.y;
                    const shortestDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
                    guard.mesh.rotation.y += shortestDiff * 0.2;
                }

                if (guard.c !== undefined && guard.r !== undefined) {
                    guard.mesh.position.x += (guard.c - guard.mesh.position.x) * 0.2;
                    guard.mesh.position.z += (guard.r - guard.mesh.position.z) * 0.2;
                }
            }
        });
    }

    currentLevelData.doors.forEach(d => {
        if (d.unlocked && d.leftMesh && d.rightMesh) {
            d.leftMesh.position.x += (-0.85 - d.leftMesh.position.x) * 0.1;
            d.rightMesh.position.x += (0.85 - d.rightMesh.position.x) * 0.1;
        }
    });

    currentLevelData.platforms.forEach(plat => {
        if (plat.mesh) {
            plat.mesh.position.x += (plat.c - plat.mesh.position.x) * 0.2;
            plat.mesh.position.z += (plat.r - plat.mesh.position.z) * 0.2;
        }
    });

    currentLevelData.drones.forEach(drone => {
        if (drone.mesh) {
            drone.mesh.position.x += (drone.c - drone.mesh.position.x) * 0.2;
            drone.mesh.position.z += (drone.r - drone.mesh.position.z) * 0.2;
            drone.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.005) * 0.1;
        }
    });

    if (currentMode === 'NETRUN') {
        enemies.forEach(en => {
            if (en.data.active) {
                en.group.position.x += (en.data.x - en.group.position.x) * 0.2;
                en.group.position.z += (en.data.z - en.group.position.z) * 0.2;

                // Spawn enemies at the dynamic Netrun height
                const targetEnemyY = netrunBaseY + (-en.data.floor * FLOOR_SPACING) + 0.4 + (player.floor * FLOOR_SPACING);
                en.group.position.y += (targetEnemyY - en.group.position.y) * 0.2;

                if (en.data.isAlerted) {
                    en.group.position.x += (Math.random() - 0.5) * 0.1;
                    en.group.position.z += (Math.random() - 0.5) * 0.1;
                    en.group.scale.y = 1;
                } else {
                    en.group.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.1;
                }

                const isNear = (player.floor === en.data.floor && Math.abs(player.c - en.data.x) <= 1 && Math.abs(player.r - en.data.z) <= 1);
                const baseColor = en.data.baseColor || 0xff0055;

                if (isNear) {
                    if (en.body.isGroup) {
                        en.body.traverse((child) => {
                            if (child.isMesh) { child.material.color.setHex(baseColor); child.material.emissiveIntensity = 4; }
                        });
                    } else {
                        en.body.material.color.setHex(baseColor); en.body.material.emissiveIntensity = 4;
                    }
                } else {
                    if (en.body.isGroup) {
                        en.body.traverse((child) => {
                            if (child.isMesh) { child.material.color.setHex(baseColor); child.material.emissiveIntensity = 2; }
                        });
                    } else {
                        en.body.material.color.setHex(baseColor); en.body.material.emissiveIntensity = 2;
                    }
                }

                en.group.visible = (en.data.floor === player.floor || isScanning);
            } else en.group.visible = false;
        });

        netFloorGroups.forEach((g, i) => {
            // Apply visibility multiplier based on active floor
            const floorMultiplier = (i === player.floor || isScanning) ? 1.0 : 0.05;

            const targetFloorY = netrunBaseY + (-i * FLOOR_SPACING) + (player.floor * FLOOR_SPACING);
            g.position.y += (targetFloorY - g.position.y) * 0.2;

            g.children.forEach(t => {
                if (t.material && t.userData.baseOpacity !== undefined) {
                    if (t.material.transparent === false) t.material.transparent = true;

                    const targetOp = t.userData.baseOpacity * floorMultiplier;
                    t.material.opacity += (targetOp - t.material.opacity) * 0.1;

                    if (t.material.emissive && t.userData.baseEmissive !== undefined) {
                        t.material.emissiveIntensity = t.userData.baseEmissive * floorMultiplier;
                    }
                }
            });
            g.visible = true;
        });

    } else {
        netFloorGroups.forEach(g => g.visible = false);
        enemies.forEach(en => en.group.visible = false);
    }

    renderer.render(scene, camera);
}
animate();