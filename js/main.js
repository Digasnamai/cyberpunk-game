import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Importação dos dados e arquitetura dos níveis
import { LEVEL_DATA } from './data/levels.js';
import { introSequence, mission1Dialogue, mission2Dialogue, mission3Dialogue, mission4Dialogue, mission5Dialogue } from './data/dialogues.js';

////////////////////////////////////////////////////
// Inicialização do Three.js, load dos modelos (.glb) 
// e variáveis globais do estado do jogo.
////////////////////////////////////////////////////

let currentMode = 'PHYSICAL'; // Define se estamos no modo 'PHYSICAL' (meatspace) ou 'NETRUN' (netspace)

const scene = new THREE.Scene();

// Pré-carregamento dos modelos 3D 
let models = {
    hellhound: null, asp: null, krakenGltf: null, wispGltf: null, scorpionGltf: null,
    guard: null, doorGltf: null, cameraGltf: null,
    level1: null,
    netrunnerGltf: null, swordfishGltf: null, harpoonGltf: null
};

const clock = new THREE.Clock(); // Cronómetro para as animações
let netPlayerMixer = null;       // Controlador da animação do jogador
let netPlayerModel = null;       // O modelo 3D em si

let swordfishMixer = null;
let activeSwordfish = null;
let swordfishTimeout = null;

let activeHarpoon = null;
let harpoonTimeout = null;

const loader = new GLTFLoader();

loader.load('models/Camera.glb', function (gltf) {
    models.cameraGltf = gltf;
    console.log("Camera model loaded!");
});

loader.load('models/Scorpion.glb', function (gltf) {
    models.scorpionGltf = gltf;
    console.log("Scorpion model loaded!");
});

loader.load('models/Wisp.glb', function (gltf) {
    models.wispGltf = gltf;
    console.log("Wisp model loaded!");
});

loader.load('models/Kraken.glb', function (gltf) {
    models.krakenGltf = gltf;
    console.log("Kraken model loaded!");
});

loader.load('models/Door.glb', function (gltf) {
    models.doorGltf = gltf;
    console.log("Door model loaded!");
});

loader.load('models/Harpoon.glb', function (gltf) {
    models.harpoonGltf = gltf;
    console.log("Harpoon model loaded!");
});

loader.load('models/Swordfish.glb', function (gltf) {
    models.swordfishGltf = gltf;
    console.log("Swordfish model loaded!");
});

loader.load('models/Low_poly_woman.glb', function (gltf) {
    models.netrunnerGltf = gltf;
    console.log("Netrunner model loaded!");
});

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
renderer.domElement.style.display = 'none'; // Escondido até o jogo começar

let appState = 'MENU';
let currentLevelIndex = 1;
let currentTutorialPages = [];
let currentTutorialIndex = 0;
let onTutorialComplete = null;

// Função para navegar entre ecrãs dos diferentes estados do jogo
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

///////////////
// Log de ações
///////////////

const logWrapper = document.getElementById('log-wrapper');
const logHistory = document.getElementById('log-history');
const logCurrent = document.getElementById('log-current');

// Permite ao jogador expandir o histórico clicando na área
logWrapper.onclick = () => {
    logWrapper.classList.toggle('expanded');
    if (logWrapper.classList.contains('expanded')) {
        logHistory.scrollTop = logHistory.scrollHeight; // Faz scroll automático para o fundo
    }
};

function pushToLog(message, isNet = false) {
    // Ignora se for exatamente a mesma mensagem que a atual
    if (logCurrent.innerText === message) return;

    // Passa a mensagem atual para o histórico antes de a substituir
    if (logCurrent.innerText.trim() !== "") {
        const historyEntry = document.createElement('div');

        // Herda a classe da atual para manter a cor correta no histórico
        historyEntry.className = logCurrent.className.includes('netrun') ? 'log-item netrun' : 'log-item';
        historyEntry.innerText = logCurrent.innerText;

        logHistory.appendChild(historyEntry);
    }

    // Define a nova mensagem e a respetiva cor (isNet = true usa vermelho)
    logCurrent.innerText = message;
    logCurrent.className = isNet ? 'log-current netrun' : 'log-current';

    // Mantém o histórico scrolled para baixo se estiver aberto
    if (logWrapper.classList.contains('expanded')) {
        logHistory.scrollTop = logHistory.scrollHeight;
    }
}

///////////////////////////////////////////
// Gere a secção introdutória e os diálogos
///////////////////////////////////////////

let currentDialogueIndex = 0;
let isTyping = false;
let typingTimeout;

//função que gere a secção introdutória
function showIntro(dialogueArray, onCompleteCallback) {
    switchScreen('Intro-screen');
    currentDialogueIndex = 0;

    const textElement = document.getElementById('dialogue-text');
    const speakerElement = document.getElementById('dialogue-speaker');
    const mapContainer = document.getElementById('intro-map-container');
    const mapLayers = document.querySelectorAll('.map-layer');

    // Efeito de escrita gradual
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

            // Ilumina territórios corporativos no mapa consoante a linha de atual
            if (line.showMap) {
                mapLayers.forEach(layer => {
                    if (layer.id === 'map-base' || (line.activeLayers && line.activeLayers.includes(layer.id))) {
                        layer.classList.add('visible');
                    } else {
                        layer.classList.remove('visible');
                    }
                });
            } else {
                mapLayers.forEach(l => l.classList.remove('visible'));
            }

            typeWriter(line.text, 0);
        } else {
            mapContainer.style.display = 'none';
            onCompleteCallback();
        }
    }

    // Avança o texto ou auto-completa o texto atual
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

//Função que gere o diálogo entre personagens, mesma lógica da função acima
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

        // Lógica de escurecer quem não está a falar
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

/////////////////////////
// Menu e inicio de nível
/////////////////////////

//cemeça a sequencia introdutória, seguida pelo diálogo do 1º nível e finalemnte pelo nível
document.getElementById('btn-new-game').onclick = () => {
    showIntro(introSequence, () => {
        showCharacterDialogue(mission1Dialogue, () => {
            startLevel(0);
        });
    });
};

//altera o ecrã para a seleção de níveis
document.getElementById('btn-level-select').onclick = () => switchScreen('world-map');

//altera o ecrã de volta para o menu inicial
document.getElementById('btn-back-menu').onclick = () => switchScreen('main-menu');

//ao selecionar um dos níveis é apresentado o diálogo antes do nível e após o nível começa
document.querySelectorAll('.map-node').forEach(node => {
    node.onclick = (e) => {
        const level = parseInt(e.target.getAttribute('data-level'));

        if (level === 0) {
            startLevel(level);
        }
        if (level === 1) {
            showCharacterDialogue(mission1Dialogue, () => { startLevel(level); });
        }
        if (level === 2) {
            showCharacterDialogue(mission2Dialogue, () => { startLevel(level); });
        }
        if (level === 3) {
            showCharacterDialogue(mission3Dialogue, () => { startLevel(level); });
        }
        if (level === 4) {
            showCharacterDialogue(mission4Dialogue, () => { startLevel(level); });
        }
        if (level === 5) {
            showCharacterDialogue(mission5Dialogue, () => { startLevel(level); });
        }
        if (level === 6) {
            showCharacterDialogue(mission2Dialogue, () => { startLevel(level); });
        }
    };
});

//função para começar o nível
function startLevel(levelNum) {
    //failsafe
    if (!LEVEL_DATA[levelNum]) {
        console.error(`Level ${levelNum} data not found!`);
        return;
    }

    currentLevelIndex = levelNum;
    currentLevelData = LEVEL_DATA[levelNum];

    // Reinicia os atributos do jogador, sendo o local inicial consoante a data do nível
    player.r = currentLevelData.spawn.r;
    player.c = currentLevelData.spawn.c;
    player.hp = player.maxHp;
    player.ap = player.maxAp;
    player.inventory = [];
    document.getElementById('hp-bar').style.width = "100%";
    document.getElementById('ap-display').innerText = player.ap;

    //altera o state e o ecrã para o de jogo
    appState = 'GAME';
    switchScreen('game-ui');
    renderer.domElement.style.display = 'block';

    //constroi o mundo 3D
    buildPhysicalWorld();
    initNetrun();
    toggleMode('PHYSICAL'); //define o modo inicial para o mundo fisico

    // Mostra o tutorial se o nível possuir um array de tutorial 
    if (currentLevelData.tutorial && currentLevelData.tutorial.length > 0) {
        //define o state como tutorial até este acabar
        appState = 'TUTORIAL';
        currentTutorialPages = currentLevelData.tutorial;
        currentTutorialIndex = 0;

        document.getElementById('tutorial-overlay').style.display = 'flex';
        renderTutorialPage();
    }
}

//função que gere os tutoriais
function renderTutorialPage() {
    const page = currentTutorialPages[currentTutorialIndex];
    document.getElementById('tutorial-title').innerText = page.title;
    document.getElementById('tutorial-text').innerHTML = page.text;

    const mediaContainer = document.getElementById('tutorial-media-container');

    //aceita video ou imagens para os exemplos, por agora apenas temos um placeholder preto
    if (page.mediaType === 'video') {
        mediaContainer.innerHTML = `<video src="${page.mediaSrc}" autoplay loop muted playsinline></video>`;
    } else {
        mediaContainer.innerHTML = `<img src="${page.mediaSrc}" alt="Tutorial">`;
    }

    document.getElementById('btn-prev-tutorial').style.display = currentTutorialIndex > 0 ? 'block' : 'none';

    if (currentTutorialIndex === currentTutorialPages.length - 1) {
        //se na úçtima página apresenta o botão como "UNDERSTOOD"
        document.getElementById('btn-next-tutorial').innerText = 'UNDERSTOOD >>';
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
        document.getElementById('tutorial-overlay').style.display = 'none';
        appState = 'GAME';

        if (typeof onTutorialComplete === 'function') {
            onTutorialComplete();
            onTutorialComplete = null;
        }
    }
};

//////////////////////////
// Camara, luzes e jogador
//////////////////////////

//definições da camara
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 8, -8, 0.1, 1000);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
let cameraShakeTime = 0;
let cameraShakeIntensity = 0;

//definições da luz
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const physLight = new THREE.DirectionalLight(0xffffff, 0.5);
physLight.position.set(5, 10, 5);
scene.add(physLight);

let currentLevelData = null;

//define um estado inicial para os diferentes stats do player
let player = {
    r: 0, c: 0, floor: 0, hp: 15, maxHp: 15, ap: 4, maxAp: 4, netAp: 2, maxNetAp: 2,
    targetRot: 0,
    inventory: [], // Guarda IDs de chaves de encriptação (datapads)
    statuses: {
        disabledPrograms: { swordfish: 0, harpoon: 0, scales: 0, swim: 0 },
        burning: 0, krakenActive: false, scorpionActive: false, scalesBarrier: 0,
        netApPenalty: 0
    }
};

//inicialização de variáveis a ser usadas mais tarde
let playerGroup, physBody, netBody1, netBody2;
let physGridGroup = new THREE.Group();
let visionGroup = new THREE.Group();

let currentPath = [];
let hoveredTile = null;
let isPlayerMoving = false;

///////////////////////
// Fisica e pathfinding
///////////////////////

function isWalkable(r, c) {
    if (r < 0 || r >= currentLevelData.map.length || c < 0 || c >= currentLevelData.map[0].length) return false;

    const type = currentLevelData.map[r][c];
    if (type === 1 || type === 2 || type === 8 || type === 6) return false;

    // Portas trancadas bloqueiam movimento
    if (type === 3) {
        const door = currentLevelData.doors.find(d => d.r === r && d.c === c);
        if (door && !door.unlocked) return false;
    }

    // Buracos no mapa exigem uma plataforma movível
    if (type === 4) {
        const plat = currentLevelData.platforms.find(p => p.r === r && p.c === c);
        if (!plat) return false;
    }

    //se o espaço estiver ocupado por drones ou guardas bloqueiam movimento
    if (currentLevelData.guards && currentLevelData.guards.some(g => g.r === r && g.c === c)) return false;
    if (currentLevelData.drones && currentLevelData.drones.some(d => d.active !== false && d.r === r && d.c === c)) return false;

    // Cones de visão bloqueiam movimento 
    const inVision = visionGroup.children.some(v => v.userData.isCone && v.userData.r === r && v.userData.c === c);
    if (inVision) return false;

    return true;
}

//Algoritmo BFS para pathfinding
function getPath(startR, startC, targetR, targetC, maxAP) {
    //Se o destino final for inválido (parede, inimigo, visão), desiste imediatamente
    if (!isWalkable(targetR, targetC)) return null;
    //Se o jogador já está exatamente em cima do destino, não precisa de dar passos
    if (startR === targetR && startC === targetC) return [];

    // 'queue' guarda os próximos quadrados a investigar e a rota até chegar a eles
    let queue = [{ r: startR, c: startC, path: [] }];
    //'visited' memoriza as coordenadas por onde já passámos para evitar loops infinitos
    let visited = new Set([`${startR},${startC}`]);

    while (queue.length > 0) {
        // Tira o espaço mais antigo da fila para ser analisado
        let curr = queue.shift();

        //se o quadrado atual for o destino desejado, devolve caminho 
        if (curr.r === targetR && curr.c === targetC) return curr.path;

        // Limita a distancia baseada nos Pontos de Ação do jogador
        if (curr.path.length >= maxAP) continue;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let d of dirs) {
            // Calcula as coordenadas do quadrado vizinho
            let nr = curr.r + d[0];
            let nc = curr.c + d[1];
            // Se ainda não visitámos este vizinho E ele é um local seguro para pisar:
            if (!visited.has(`${nr},${nc}`) && isWalkable(nr, nc)) {
                // Marca-o como visitado para não voltarmos aqui
                visited.add(`${nr},${nc}`);
                //[...curr.path] copia a rota que fizemos até agora e acrescenta o novo passo no fim
                queue.push({ r: nr, c: nc, path: [...curr.path, { r: nr, c: nc }] });
            }
        }
    }
    return null; // Não encontrou rota segura dentro do limite de AP
}

// Limpa os highlights quando se põe o rato sobre uma cell e repõe o estado do mapa
function clearHighlights() {
    physGridGroup.children.forEach(child => {
        if (child.userData.type === 'floor' || child.userData.type === 'platform') {
            const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
            if (child.material && child.material.emissive) {
                //se for a saída, mantém a luz de neon ciano
                child.material.emissive.setHex(isExit ? 0x00ffcc : 0x000000);
            }
        }
    });
    currentPath = [];
}

//executa o movimento passo-a-passo do jogador e dos guardas 
function executePathMovement(path) {
    //bloqueia os inputs do jogador enquanto a animação de movimento decorre
    isPlayerMoving = true;

    //remove o AP necessário
    player.ap -= path.length;
    document.getElementById('ap-display').innerText = player.ap;

    //limpa os highlights no chão
    clearHighlights();
    hoveredTile = null;

    let stepIndex = 0;

    // Função recursiva para dar um efeito de movimento passo a passo
    function nextStep() {
        if (stepIndex >= path.length) {
            isPlayerMoving = false;

            //0 jogador pisou a célula de saída?
            if (currentLevelData.exit && player.r === currentLevelData.exit.r && player.c === currentLevelData.exit.c) {
                pushToLog("EXTRACTION POINT REACHED", false);
                setTimeout(() => {
                    const nextLevel = currentLevelIndex + 1;

                    // Se não houver mais níveis (Fim do jogo), volta ao mapa
                    if (!LEVEL_DATA[nextLevel]) {
                        appState = 'MAP';
                        renderer.domElement.style.display = 'none';
                        switchScreen('world-map');
                        return;
                    }

                    renderer.domElement.style.display = 'none';

                    if (nextLevel === 1) {
                        showCharacterDialogue(mission1Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 2) {
                        showCharacterDialogue(mission2Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 3) {
                        showCharacterDialogue(mission3Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 4) {
                        showCharacterDialogue(mission4Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 5) {
                        showCharacterDialogue(mission5Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 6) {
                        showCharacterDialogue(mission2Dialogue, () => { startLevel(nextLevel); });
                    } else {
                        //se for um nível sem diálogo
                        startLevel(nextLevel);
                    }

                }, 1500);
            }
            return;
        }

        const nextR = path[stepIndex].r;
        const nextC = path[stepIndex].c;

        // NOVO: Calcula o ângulo exato virado para o próximo quadrado!
        player.targetRot = Math.atan2(nextC - player.c, nextR - player.r);

        // move o Jogador
        player.r = nextR;
        player.c = nextC;
        stepIndex++;

        //movimenta os guardas simultaneamente
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

        if (currentLevelData.drones) {
            currentLevelData.drones.forEach(drone => {
                if (drone.active !== false) {
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
                }
            });
        }

        //atualiza os cones de visão de todos os inimigos nas suas novas posições
        updateVision();

        //aborta o movimento se o jogador caminhar inadvertidamente para a visão de um inimigo e retorna-o ao começo do nivel
        const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
        if (inVision) {
            checkPhysicalDetection();
            isPlayerMoving = false;
            return;
        }

        if (currentLevelData.triggers) {
            const activeTrigger = currentLevelData.triggers.find(t => t.r === player.r && t.c === player.c && !t.fired);

            if (activeTrigger) {
                activeTrigger.fired = true;

                appState = 'TUTORIAL';
                currentTutorialPages = activeTrigger.pages || [activeTrigger];
                currentTutorialIndex = 0;

                document.getElementById('tutorial-overlay').style.display = 'flex';
                renderTutorialPage();

                onTutorialComplete = () => {
                    setTimeout(nextStep, 150);
                };

                return;
            }
        }

        setTimeout(nextStep, 150);
    }

    nextStep();
}

// //////////////////////////////////////////////////
// geração do mundo fisico,
// lê os dados do nível e insere meshes e objetos 3D.
/////////////////////////////////////////////////////

function buildPhysicalWorld() {
    // Antes de construir um nível novo, temos de limpar o lixo do nível anterior
    physGridGroup.clear();
    visionGroup.clear();

    // Se existir um modelo de jogador do nível anterior, apaga-o da cena principal
    if (playerGroup) {
        scene.remove(playerGroup);
    }

    //calcula o tamanho da grelha com base na data do nível
    const rows = currentLevelData.map.length;
    const cols = currentLevelData.map[0].length;

    let envMesh = null;
    currentLevelData.heightMap = [];

    //Se for o nível 1 e o modelo 3D estiver carregado adiciona-o
    if (currentLevelIndex === 1 && models.level1) {
        envMesh = models.level1.clone();
        envMesh.position.set(0, 0, 0);
        envMesh.updateMatrixWorld(true);

        // Esconde o braço robótico do modelo base para podermos rodá-lo inicialmente
        currentLevelData.robotArm = envMesh.getObjectByName("RoboticArm");
        if (currentLevelData.robotArm) {
            currentLevelData.robotArmTargetRot = currentLevelData.robotArm.rotation.y;
            currentLevelData.robotArm.visible = false;
        }

        physGridGroup.add(envMesh);
    }

    const downVector = new THREE.Vector3(0, -1, 0); // Vetor a apontar diretamente para baixo
    currentLevelData.normalMap = [];

    // geração da grelha
    for (let r = 0; r < rows; r++) {
        currentLevelData.heightMap[r] = [];
        currentLevelData.normalMap[r] = [];

        for (let c = 0; c < cols; c++) {
            const type = currentLevelData.map[r][c];

            let tileY = 0;
            let tileNormal = new THREE.Vector3(0, 1, 0);

            if (envMesh) {
                //Usa um raycast vindo de cima para baixo para descobrir a altura do chão
                const hits = new THREE.Raycaster(new THREE.Vector3(c, 10, r), downVector).intersectObject(envMesh, true);

                if (hits.length > 0) {
                    tileY = hits[0].point.y; // Guarda a altura (Y) deste quadrado

                    //raycaster de 3 pontos: Dispara mais dois lasers ligeiramente ao lado 
                    const hitX = new THREE.Raycaster(new THREE.Vector3(c + 0.1, 10, r), downVector).intersectObject(envMesh, true);
                    const hitZ = new THREE.Raycaster(new THREE.Vector3(c, 10, r + 0.1), downVector).intersectObject(envMesh, true);

                    //com base nesses 3 pontos, calcula a inclinação da rampa
                    if (hitX.length > 0 && hitZ.length > 0) {
                        const vecX = new THREE.Vector3().subVectors(hitX[0].point, hits[0].point);
                        const vecZ = new THREE.Vector3().subVectors(hitZ[0].point, hits[0].point);
                        tileNormal.crossVectors(vecZ, vecX).normalize();

                        // Garante que o vetor aponta sempre para cima
                        if (tileNormal.y < 0) tileNormal.negate();
                    }
                }
            }

            //guarda estes dados na memória para que os guardas e a visão saibam onde estão as rampas
            currentLevelData.heightMap[r][c] = tileY;
            currentLevelData.normalMap[r][c] = tileNormal;

            // Tiles
            // Ignora paredes (1) e buracos (4)
            if (type !== 1 && type !== 4) {
                const isExit = currentLevelData.exit && currentLevelData.exit.r === r && currentLevelData.exit.c === c;

                //cria o quadrado 
                const floor = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.05, 0.95),
                    new THREE.MeshStandardMaterial({
                        color: 0x000000, emissive: 0x00ffcc, emissiveIntensity: 0.5,
                        transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending
                    })
                );
                floor.position.set(c, tileY + 0.05, r); // posiciona de acordo a altura calculada pelo raycast
                floor.renderOrder = 1;
                floor.userData = { r, c, type: 'floor', isHitbox: true };

                // Desenha a borda néon do quadrado
                const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.95));
                const outlineColor = isExit ? 0x00ffcc : 0x518f88; // Destaca o quadrado de saída

                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                    color: outlineColor, transparent: true, opacity: isExit ? 1.0 : 0.1, depthWrite: false
                }));

                line.rotation.x = -Math.PI / 2;
                line.position.y = 0.05;
                line.renderOrder = 2;
                line.raycast = () => { }; // Impede que o rato colida com a linha em vez do quadrado
                line.userData = { isOutline: true };

                floor.add(line);

                // aplica a inclinação detetada ao quadrado 
                const up = new THREE.Vector3(0, 1, 0);
                floor.quaternion.setFromUnitVectors(up, tileNormal);

                physGridGroup.add(floor);
            }

            //Terminais
            if (type === 2) {
                const terminal = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.8, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5, transparent: true }));
                terminal.position.set(c, tileY + 0.4, r);
                const tData = currentLevelData.terminals.find(t => t.r === r && t.c === c);
                terminal.userData = { r, c, type: 'terminal', data: tData };
                physGridGroup.add(terminal);
            }

            //Portas
            if (type === 3) {
                const physDoorGroup = new THREE.Group();
                const dData = currentLevelData.doors.find(d => d.r === r && d.c === c);

                // Roda a porta dependendo se é vertical ou horizontal
                if (dData && dData.dir === 'vertical') {
                    physDoorGroup.rotation.y = Math.PI / 2;
                } else {
                    physDoorGroup.rotation.y = 0;
                }

                let physDoorLeft, physDoorRight;

                if (models.doorGltf) {
                    physDoorGroup.position.set(c, tileY, r);

                    const doorScene = models.doorGltf.scene.clone();

                    // doorScene.scale.set(1, 1, 1); 

                    physDoorLeft = doorScene.getObjectByName('left');
                    physDoorRight = doorScene.getObjectByName('right');

                    if (physDoorLeft && physDoorLeft.material) physDoorLeft.material = physDoorLeft.material.clone();
                    if (physDoorRight && physDoorRight.material) physDoorRight.material = physDoorRight.material.clone();

                    physDoorGroup.add(doorScene);
                } else {
                    //caso o ficheiro falhe a carregar
                    physDoorGroup.position.set(c, tileY + 0.75, r);
                    const doorGeo = new THREE.BoxGeometry(0.5, 1.5, 0.2);
                    const doorMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.2, transparent: true });

                    physDoorLeft = new THREE.Mesh(doorGeo, doorMat);
                    physDoorLeft.position.set(-0.25, 0, 0);
                    physDoorRight = new THREE.Mesh(doorGeo, doorMat.clone());
                    physDoorRight.position.set(0.25, 0, 0);

                    physDoorGroup.add(physDoorLeft);
                    physDoorGroup.add(physDoorRight);
                }

                physGridGroup.add(physDoorGroup);

                //guarda para mais tarde serem animadas
                if (dData) {
                    dData.leftMesh = physDoorLeft;
                    dData.rightMesh = physDoorRight;
                }
            }

            //Camaras
            if (type === 5) {
                let camMesh;
                
                if (models.cameraGltf) {
                    camMesh = SkeletonUtils.clone(models.cameraGltf.scene);
                    camMesh.scale.set(1.2, 1.2, 1.2);
                    camMesh.position.set(c, 1.2, r); // na parede
                    
                    camMesh.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                        }
                    });
                } else {
                    camMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.4, 0.4, 0.4),
                        new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true })
                    );
                    camMesh.position.set(c, 1.2, r);
                }

                camMesh.userData = { r, c, type: 'camera' };

                const cData = currentLevelData.cameras.find(cam => cam.r === r && cam.c === c);
                if (cData) {
                    cData.mesh = camMesh;
                    
                    // Define a rotação inicial com base na direção em que ela começa o nível!
                    const initDir = cData.dirs[cData.dirIdx];
                    if (initDir === 'up') camMesh.rotation.y = Math.PI;
                    else if (initDir === 'down') camMesh.rotation.y = 0;
                    else if (initDir === 'left') camMesh.rotation.y = -Math.PI / 2;
                    else if (initDir === 'right') camMesh.rotation.y = Math.PI / 2;

                    camMesh.rotation.y
                    
                    cData.targetRot = camMesh.rotation.y;
                }
                physGridGroup.add(camMesh);
            }

            //Datapad
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

    // Adiciona todo este ambiente base à cena do jogo
    scene.add(physGridGroup);

    //Repõe a visibilidade do braço robótico
    if (currentLevelData.robotArm) {
        currentLevelData.robotArm.visible = true;
    }


    //plataformas Móveis 
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

    //Drones
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

    //guardas 
    if (currentLevelData.guards) {
        currentLevelData.guards.forEach(guard => {
            let guardTileY = 0;
            //usa elevação do terreno para o guarda não aparecer a flutuar nem debaixo do chão
            if (currentLevelData.heightMap && currentLevelData.heightMap[guard.r]) {
                guardTileY = currentLevelData.heightMap[guard.r][guard.c] || 0;
            }

            //conversão caso seja um guarda que se move (path) em vez de rotação estática (dirs)
            if (guard.path && !guard.dirs) {
                guard.dirs = [guard.path[0].dir];
                guard.dirIdx = 0;
            }

            // Traduz a direção inicial em rotação para o modelo
            let initRot = 0;
            const dir = guard.dirs[guard.dirIdx];
            if (dir === 'up') initRot = Math.PI;
            else if (dir === 'down') initRot = 0;
            else if (dir === 'left') initRot = -Math.PI / 2;
            else if (dir === 'right') initRot = Math.PI / 2;

            let guardMesh;
            // Se o ficheiro .glb do guarda carregou com sucesso, usa-o
            if (models.guard) {
                guardMesh = SkeletonUtils.clone(models.guard);
                guardMesh.scale.set(0.5, 0.5, 0.5);
                guardMesh.position.set(guard.c, guardTileY, guard.r);
            } else {
                // Se o modelo 3D falhar, cria uma caixa vermelha genérica
                guardMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true })
                );
                guardMesh.position.set(guard.c, guardTileY + 0.5, guard.r);
            }

            guardMesh.rotation.y = initRot;
            guard.targetRot = initRot;

            guard.mesh = guardMesh;
            physGridGroup.add(guardMesh);
        });
    }

    //gera os cones de visão vermelhos com base nas direções
    updateVision();
    scene.add(visionGroup);

    //grupo dos corpos do jogador
    playerGroup = new THREE.Group();

    //corpo físico 
    physBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1), new THREE.MeshStandardMaterial({ color: 0x0088ff, transparent: true }));
    physBody.position.y = 0.5;
    playerGroup.add(physBody);

    if (models.netrunnerGltf) {
        netPlayerModel = SkeletonUtils.clone(models.netrunnerGltf.scene);
        netPlayerModel.scale.set(1, 1, 1); // Ajusta a escala conforme necessário
        netPlayerModel.position.y = 0; // Ajusta a altura 

        netPlayerModel.traverse((child) => {
            if (child.isMesh) {
                child.renderOrder = 1001;

                if (child.material) {
                    child.material.transparent = true;

                    child.material.opacity = 1.0;
                    child.material.depthWrite = true;
                    child.material.depthTest = true;
                }
            }
        });

        // Configurar a Animação
        netPlayerMixer = new THREE.AnimationMixer(netPlayerModel);

        // Vai buscar a primeira animação (Idle) do ficheiro do Blender
        const idleClip = models.netrunnerGltf.animations[0];
        if (idleClip) {
            const action = netPlayerMixer.clipAction(idleClip);
            action.setLoop(THREE.LoopRepeat); // Força a animação a fazer Loop infinito
            action.play(); // Inicia a animação
        }

        playerGroup.add(netPlayerModel);
    } else {
        // Fallback: se o modelo falhar a carregar usa geometria 
        netBody1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }));
        netBody1.position.y = 0.5; netBody1.renderOrder = 1000;

        netBody2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, depthTest: false, depthWrite: false }));
        netBody2.position.y = 0.5; netBody2.renderOrder = 1000;

        playerGroup.add(netBody1);
        playerGroup.add(netBody2);
    }

    // Adiciona o jogador  à cena
    scene.add(playerGroup);
}

/////////////////////////////////////////
/// Logica de visão e deteção de inimigos
/////////////////////////////////////////
function updateVision() {
    if (window.drawnVisionTiles) window.drawnVisionTiles.clear();

    //limpa os raios de visão anteriores
    visionGroup.clear();

    //visão de guardas
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

    //visão de camaras
    if (currentLevelData.cameras) {
        currentLevelData.cameras.forEach(cam => {
            if (cam.active) {
                const cDir = cam.dir || (cam.dirs ? cam.dirs[0] : 'down');
                drawVisionCone(cam.r, cam.c, cDir, 5, 0, 0); //alcance de 5 quadrados
                
                if (cam.mesh) {
                    if (cam.mesh.isGroup) {
                        cam.mesh.traverse(child => { 
                            if (child.isMesh && child.name === 'lente_led' && child.material) {
                                child.material.emissive.setHex(0xff0000);
                                child.material.emissiveIntensity = 2; 
                            } 
                        });
                    } else {
                        //fallback 
                        cam.mesh.material.emissive.setHex(0xff0000);
                    }
                }
            } else {
                // Desliga o LED 
                if (cam.mesh) {
                    if (cam.mesh.isGroup) {
                        cam.mesh.traverse(child => { 
                            if (child.isMesh && child.name === 'lente_led' && child.material) {
                                child.material.emissive.setHex(0x000000); // Apaga a luz
                            } 
                        });
                    } else {
                        cam.mesh.material.emissive.setHex(0x000000);
                    }
                }
            }
        });
    }

    //area dos drones 
    if (currentLevelData.drones) {
        currentLevelData.drones.forEach(drone => {
            if (drone.active !== false) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const vR = drone.r + dr;
                        const vC = drone.c + dc;

                        if (vR < 0 || vR >= currentLevelData.map.length || vC < 0 || vC >= currentLevelData.map[0].length) continue;
                        if (currentLevelData.map[vR][vC] === 1) continue;

                        const tileKey = `${vR},${vC}`;
                        if (!window.drawnVisionTiles.has(tileKey)) {
                            window.drawnVisionTiles.add(tileKey);

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
            }
        });
    }
}

//função que desenha os cones de visão
function drawVisionCone(startR, startC, dir, length, startOffset = 1, spread = 1) {

    //variáveis de direção frontal e direção ortogonal 
    let dr = 0, dc = 0;
    let orthoR = 0, orthoC = 0;

    //define para onde o cone aponta e como se expande para os lados
    if (dir === 'up') { dr = -1; orthoC = 1; }
    else if (dir === 'down') { dr = 1; orthoC = 1; }
    else if (dir === 'left') { dc = -1; orthoR = 1; }
    else if (dir === 'right') { dc = 1; orthoR = 1; }

    //cria um registo global para memorizar quais os quadrados já foram pintados de vermelho neste turno.
    //isto evita sobreposição de cores se as visões de dois guardas se cruzarem.
    if (!window.drawnVisionTiles) window.drawnVisionTiles = new Set();

    for (let v = startOffset; v <= length; v++) {

        const centerR = startR + (dr * v);
        const centerC = startC + (dc * v);

        //bloqueia visão através de paredes
        if (centerR < 0 || centerR >= currentLevelData.map.length || centerC < 0 || centerC >= currentLevelData.map[0].length) break;
        if (currentLevelData.map[centerR][centerC] === 1) break;

        //expande a visão para os lados
        for (let s = -spread; s <= spread; s++) {
            const vR = startR + (dr * v) + (orthoR * s);
            const vC = startC + (dc * v) + (orthoC * s);

            //ignora cells inválidas
            if (vR < 0 || vR >= currentLevelData.map.length || vC < 0 || vC >= currentLevelData.map[0].length) continue;
            if (currentLevelData.map[vR][vC] === 1) continue;

            const tileKey = `${vR},${vC}`;

            //se este quadrado ainda não foi pintado de vermelho neste turno
            if (!window.drawnVisionTiles.has(tileKey)) {
                //regista-o para que não seja pintado duas vezes
                window.drawnVisionTiles.add(tileKey);

                const visionGeo = new THREE.PlaneGeometry(0.9, 0.9);
                visionGeo.rotateX(-Math.PI / 2);

                const vision = new THREE.Mesh(
                    visionGeo,
                    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
                );

                let vY = 0;
                let vNormal = new THREE.Vector3(0, 1, 0);

                //vai buscar os dados topográficos recolhidos durante a construção do mundo
                //permitindo que a visão se adapte à altura e inclinação de rampas
                if (currentLevelData.heightMap && currentLevelData.heightMap[vR]) {
                    vY = currentLevelData.heightMap[vR][vC] || 0;
                    vNormal = currentLevelData.normalMap[vR][vC] || new THREE.Vector3(0, 1, 0);
                }

                vision.position.set(vC, vY + 0.08, vR);

                //roda o plano para ter a mesma inclinação do chão 
                const up = new THREE.Vector3(0, 1, 0);
                vision.quaternion.setFromUnitVectors(up, vNormal);

                vision.renderOrder = 2;
                vision.userData = { r: vR, c: vC, isCone: true };

                visionGroup.add(vision);
            }
        }
    }
}

//verifica deteção
function checkPhysicalDetection() {
    const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
    if (inVision) {
        pushToLog("SIMULATION FAILED. CAUGHT. RECALCULATING...", false);

        const damageOverlay = document.getElementById('damage-overlay');
        if (damageOverlay) {
            damageOverlay.classList.add('simulation'); // Muda o efeito de dano para Azul 
            damageOverlay.classList.add('active');

            setTimeout(() => {
                damageOverlay.classList.remove('active');
                // Remove a cor azul só depois do fade out acabar
                setTimeout(() => damageOverlay.classList.remove('simulation'), 500);
            }, 150);
        }

        //retorna o jogador ao inicio do nivel
        player.r = currentLevelData.spawn.r;
        player.c = currentLevelData.spawn.c;

        player.ap = player.maxAp;
        if (currentLevelData.guards) currentLevelData.guards.forEach(g => g.dirIdx = 0);
        updateVision();
        document.getElementById('ap-display').innerText = player.ap;
    }
}

//movimento das plataformas móveis
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

        // Se o jogador estiver na plataforma, move-o com ela
        if (wasPlayerOnPlatform) {
            player.r = plat.r;
            player.c = plat.c;
        }
    });
}

//comportamento de drones
function processDrones() {
    currentLevelData.drones.forEach(drone => {
        if (drone.active === false) return;

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

//////////////////////
// Geração do netspace
//////////////////////

const FLOOR_SPACING = 6; //dstância vertical entre os andares
let currentTotalFloors = 3;
let activeTerminal = null; //memoriza com que terminal foi feita a interação 
let netFloorGroups = [];
let enemies = [];
let netSlashEffect, netSlashMat; //efeitos visuais do combate
let selectedTarget = null;
let isScanning = false;
let netLight;

let netrunBaseY = 0;

// luzes que apenas afetam o netspace
scene.add(new THREE.AmbientLight(0x404040, 2));

netLight = new THREE.PointLight(0x00ffcc, 100, 20);
netLight.position.set(0, 5, 0);
scene.add(netLight);

//cria os efeitos visuais de ataque (Swordfish e Harpoon)
function initNetrun() {
    if (!netSlashEffect) {
        netSlashMat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0, depthTest: false });
        netSlashEffect = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32), netSlashMat);
        netSlashEffect.rotation.x = Math.PI / 2;
        netSlashEffect.renderOrder = 999;
        scene.add(netSlashEffect);
    }
}

// adiciona divs no canto superior direito para representar os andares disponíveis
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

// Replica a área 3x3 à volta do terminal como sendo a grelha de Netrun
function generateMirroredNetrun(terminalData) {
    activeTerminal = terminalData;
    currentTotalFloors = terminalData.floors;

    netrunBaseY = 0;
    if (currentLevelData.heightMap && currentLevelData.heightMap[terminalData.r]) {
        netrunBaseY = currentLevelData.heightMap[terminalData.r][terminalData.c] || 0;
    }

    buildNetUI();

    //limpa os dados da última vez que se entrou num terminal
    netFloorGroups.forEach(g => scene.remove(g));
    netFloorGroups = [];

    if (enemies && enemies.length > 0) {
        enemies.forEach(en => {
            // Remove o modelo 3D antigo da cena, se ainda existir
            if (en.group && en.group.parent) {
                en.group.parent.remove(en.group);
            }
        });
        enemies = []; // Esvazia o array de inimigos!
    }

    selectedTarget = null;

    //guarda quadrados seguros para poder adicionar ICE neles
    let validNetCoords = [];

    //constrói cada andar
    for (let f = 0; f < currentTotalFloors; f++) {
        const group = new THREE.Group();
        group.position.y = -f * FLOOR_SPACING;

        //3x3 quadrados ao redor do terminal
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const wR = terminalData.r + i;
                const wC = terminalData.c + j;

                const isSafe = wR >= 0 && wR < currentLevelData.map.length && wC >= 0 && wC < currentLevelData.map[0].length;
                if (isSafe && currentLevelData.map[wR][wC] !== 1 && currentLevelData.map[wR][wC] !== 4) {

                    if (f === 0) validNetCoords.push({ x: wC, z: wR });

                    //cells dentro da architecture
                    const tile = new THREE.Mesh(
                        new THREE.BoxGeometry(0.9, 0.1, 0.9),
                        new THREE.MeshStandardMaterial({ color: 0x001111, emissive: 0x00ffcc, emissiveIntensity: 0.1, transparent: true, opacity: 0.1, depthTest: false, depthWrite: false })
                    );
                    tile.position.set(wC, 0.02, wR);
                    tile.renderOrder = 998;

                    // Guarda a opacidade e emissividade originais para os efeitos do Sonar
                    tile.userData = { x: wC, z: wR, baseOpacity: 0.1, baseEmissive: 0.1 };
                    group.add(tile);

                    //Outlines para cada cell
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

        //reconstrói o próprio terminal
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

    //pega nos quadrados seguros e adiciona ICE 
    if (validNetCoords.length > 0) {
        // Filtra os quadrados para garantir que o inimigo não nasce em cima do próprio terminal
        let outerTiles = validNetCoords.filter(t => t.x !== terminalData.c || t.z !== terminalData.r);

        // Proteção: Se o terminal estiver num beco sem saída e não houver "outerTiles", usa o que houver
        if (outerTiles.length === 0) outerTiles = [...validNetCoords];

        // Função que tira um quadrado aleatório do "saco" e o remove da lista
        const pullRandomSpawn = () => {
            if (outerTiles.length === 0) return null; // Previne erros se faltarem quadrados
            const randomIndex = Math.floor(Math.random() * outerTiles.length);
            return outerTiles.splice(randomIndex, 1)[0]; // splice remove e devolve o item
        };

        for (let f = 1; f < currentTotalFloors; f++) {
            const spawnPoint = pullRandomSpawn();

            // Se encontrou um quadrado válido, faz spawn do ICE nesse andar
            if (spawnPoint) {
                spawnICE(f, spawnPoint.x, spawnPoint.z);
            } else {
                break;
            }
        }
    }

    //repõe os AP do jogador quando entra
    player.netAp = player.maxNetAp;
    document.getElementById('net-ap-display').innerText = player.netAp;

    //O jogador começa sempre no andar principal 0
    player.floor = 0;
    updateNetUI();

    checkNetrunTriggers();
}

//gerador aleatório de ICE 
function spawnICE(f, x, z) {
    //escolhe aleatoriamente uma classe de inimigo
    const types = ['Asp', 'Kraken', 'Scorpion', 'Wisp', 'Hellhound'];
    const type = types[Math.floor(Math.random() * types.length)];

    const g = new THREE.Group();
    let b;
    let color;

    // As classes que têm um modelo 3D atribuído tentam carregá-lo
    // Se por acaso o ficheiro GLB não tiver sido carregado (ou houver falha)
    // Têm um fallback e geram uma forma geométrica básica 

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
        if (models.krakenGltf) {
            b = SkeletonUtils.clone(models.krakenGltf.scene);
            //b.scale.set(0.2, 0.2, 0.2);
            b.position.y = -0.35;

            b.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 });
                }
            });

            //cria o mixer para este kraken
            const mixer = new THREE.AnimationMixer(b);
            const idleClip = models.krakenGltf.animations[0];
            if (idleClip) {
                const action = mixer.clipAction(idleClip);
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }

            //guarda o mixer dentro do objeto 
            b.userData.mixer = mixer;

        } else {
            b = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
        }
    }
    else if (type === 'Scorpion') {
        color = 0x00ff00;

        if (models.scorpionGltf) {
            b = SkeletonUtils.clone(models.scorpionGltf.scene);
            //b.scale.set(0.4, 0.4, 0.4); 
            b.position.y = -0.35;

            const mixer = new THREE.AnimationMixer(b);
            const idleClip = models.scorpionGltf.animations[0];
            if (idleClip) {
                const action = mixer.clipAction(idleClip);
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }

            b.userData.mixer = mixer;

        } else {
            b = new THREE.Mesh(new THREE.TetrahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
        }
    }
    else if (type === 'Wisp') {
        color = 0xffffff;
        if (models.wispGltf) {
            b = SkeletonUtils.clone(models.wispGltf.scene);
            //b.scale.set(0.4, 0.4, 0.4); 
            b.position.y = 0.2;

            b.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: color, emissive: color });
                }
            });

            const mixer = new THREE.AnimationMixer(b);
            const idleClip = models.wispGltf.animations[0];
            if (idleClip) {
                const action = mixer.clipAction(idleClip);
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }

            b.userData.mixer = mixer;

        } else {
            //caso o modelo falhe a carregar
            b = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2 }));
        }

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

    // Força os ICE a ficar desenhados por cima do ambiente 3D físico
    b.traverse((child) => {
        if (child.isMesh) {
            child.renderOrder = 1000;
            if (child.material) {
                child.material.depthTest = false;
                child.material.depthWrite = false;
                child.material.transparent = true;

                // ao invés de ter de alterar tudo em blender defino as propriedades aqui
                child.material.color.setHex(color);
                child.material.emissive.setHex(color);
                child.material.emissiveIntensity = 0;
                child.material.metalness = 0.6;
                child.material.roughness = 0.2;
            }
        }
    });

    const iceLight = new THREE.PointLight(color, 2, 3); //Cor, Intensidade, Distância
    iceLight.position.set(0, 0.8, 0.5); //um pouco acima ao lado para melhores sombras
    g.add(iceLight);

    // Guardamos a luz no grupo para a podermos pulsar na animação
    g.userData.personalLight = iceLight;

    g.add(b);
    g.position.set(x, -f * FLOOR_SPACING + 0.4, z);
    scene.add(g);

    enemies.push({
        data: { x, z, floor: f, hp: 10, active: true, isAlerted: false, type: type, baseColor: color },
        group: g,
        body: b,
        mixer: b.userData && b.userData.mixer ? b.userData.mixer : null
    });
}

/////////////////////////
// interação e turn logic
/////////////////////////

// Alterna entre o Mundo Físico e Netrunning
function toggleMode(mode) {
    currentMode = mode;
    const isNet = mode === 'NETRUN';

    clearHighlights();
    hoveredTile = null;

    // transições de UI através de toggles de CSS 
    document.querySelectorAll('.net-only').forEach(el => el.style.display = isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');
    document.querySelectorAll('.phys-only').forEach(el => el.style.display = !isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');

    const logCurrent = document.getElementById('log-current');
    isNet ? pushToLog("CONNECTION ESTABLISHED. BYPASS SYSTEM CORE.", true) : pushToLog("AVOID DETECTION.", false);
    logCurrent.className = isNet ? 'log-current netrun' : 'log-current';
}

//sistema de Dano
function takeDamage(amt) {
    if (player.hp <= 0) return;

    //verifica se o jogador tem o escudo
    if (player.statuses.scalesBarrier > 0) {
        player.statuses.scalesBarrier--;
        pushToLog(`SCALES.EXE ABSORBED DAMAGE! (${player.statuses.scalesBarrier} SCALES LEFT)`, true);
        return; //absorve o dano sem perder HP
    }

    //subtrai a vida e atualiza a healthbar
    player.hp -= amt;
    document.getElementById('hp-bar').style.width = (player.hp / player.maxHp * 100) + "%";

    pushToLog(`NEURAL SPIKE! -${amt} HP`, true);

    const damageOverlay = document.getElementById('damage-overlay');
    if (damageOverlay) {
        damageOverlay.classList.add('active');
        // Remove a classe logo a seguir para o CSS tratar do fade-out
        setTimeout(() => {
            damageOverlay.classList.remove('active');
        }, 150);
    }

    cameraShakeTime = 0.3;
    cameraShakeIntensity = 0.5;

    if (player.hp <= 0) {
        renderer.domElement.style.display = 'none';
        switchScreen('bsod-screen');

        const bsodText = document.getElementById('bsod-text');
        bsodText.innerHTML = '';

        //caveira no background
        const asciiSkull = [
            "     .... NO! ...                  ... MNO! ...    ",
            "   ..... MNO!! ...................... MNNOO! ...   ",
            " ..... MMNO! ......................... MNNOO!! .   ",
            "..... MNOONNOO!   MMMMMMMMMMPPPOII!   MNNO!!!! .   ",
            " ... !O! NNO! MMMMMMMMMMMMMPPPOOOII!! NO! ....     ",
            "    ...... ! MMMMMMMMMMMMMPPPPOOOOIII! ! ...       ",
            "   ........ MMMMMMMMMMMMPPPPPOOOOOOII!! .....      ",
            "   ........ MMMMMOOOOOOPPPPPPPPOOOOMII! ...        ",
            "    ....... MMMMM..    OPPMMP    .,OMI! ....       ",
            "     ...... MMMM::   o.,OPMP,.o   ::I!! ...        ",
            "         .... NNM:::.,,OOPM!P,.::::!! ....         ",
            "          .. MMNNNNNOOOOPMO!!IIPPO!!O! .....       ",
            "         ... MMMMMNNNNOO:!!:!!IPPPPOO! ....        ",
            "           .. MMMMMNNOOMMNNIIIPPPOO!! ......       ",
            "          ...... MMMONNMMNNNIIIOO!..........       ",
            "       ....... MN MOMMMNNNIIIIIO! OO ..........    ",
            "    ......... MNO! IiiiiiiiiiiiI OOOO ...........  ",
            "  ...... NNN.MNO! . O!!!!!!!!!O . OONO NO! ........",
            "   .... MNNNNNO! ...OOOOOOOOOOO .  MMNNON!........ ",
            "   ...... MNNNNO! .. PPPPPPPPP .. MMNON!........   ",
            "      ...... OO! ................. ON! .......     ",
            "         ................................          "
        ].join('\n');
        document.getElementById('bsod-skull').innerText = asciiSkull;

        //mensagem no centro do ecrã
        const msg = "FOREIGN ACCESS DETECTED.\nCEREBRAL CORTEX FRYING...\nNEURAL LINK SEVERED.\n\nGOODBYE, RUNNER.";

        //efeito typewriter
        let i = 0;
        function typeBSOD() {
            if (i < msg.length) {
                // Se for um \n, muda de linha com um <br>, senão escreve a letra
                bsodText.innerHTML += msg.charAt(i) === '\n' ? '<br>' : msg.charAt(i);
                i++;
                setTimeout(typeBSOD, 50); // Velocidade do teclado
            } else {
                // Depois de acabar de escrever, espera 3 segundos e reinicia o nível atual
                setTimeout(() => {
                    startLevel(currentLevelIndex);
                }, 2000);
            }
        }

        typeBSOD();
    }
}

// ==========================================
// SISTEMA DE TRIGGERS (TUTORIAIS NETRUN)
// ==========================================
function checkNetrunTriggers() {
    // Só funciona se estivermos ativamente num terminal que tenha triggers configurados
    if (activeTerminal && activeTerminal.triggers) {

        // Procura um trigger válido para o andar atual.
        // Se o trigger não especificar 'r' ou 'c', ele dispara em QUALQUER quadrado desse andar!
        const activeTrigger = activeTerminal.triggers.find(t =>
            t.floor === player.floor &&
            (t.r === undefined || t.r === player.r) &&
            (t.c === undefined || t.c === player.c) &&
            !t.fired
        );

        if (activeTrigger) {
            activeTrigger.fired = true;

            // Pausa o jogo e abre o ecrã
            appState = 'TUTORIAL';
            currentTutorialPages = activeTrigger.pages || [activeTrigger];
            currentTutorialIndex = 0;

            document.getElementById('tutorial-overlay').style.display = 'flex';
            renderTutorialPage();
        }
    }
}

//highlight do caminho usando o rato
window.addEventListener('mousemove', (e) => {
    //ignora se estivermos Netrunning, nos menus ou se já estiver a andar
    if (currentMode !== 'PHYSICAL' || appState !== 'GAME' || isPlayerMoving) return;

    //converte a posição do rato para coordenadas 3D por raycasting
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // verifica que tiles o raycast intersetou
    const intersects = raycaster.intersectObjects(physGridGroup.children);
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;

        //se não for um tile da grelha ignora
        if (data.r === undefined || data.c === undefined) return;

        //só recalcula a rota se o rato mudou efetivamente para uma tile novo
        if (hoveredTile !== `${data.r},${data.c}`) {
            hoveredTile = `${data.r},${data.c}`;
            clearHighlights(); //apaga o path anterior

            const type = currentLevelData.map[data.r][data.c];
            //ignora paredes e terminais
            if (type !== 1 && type !== 2) {

                // NOVO: Se o jogador não tiver AP, projeta o caminho simulando que já tem o AP do próximo turno
                const projectedAp = player.ap > 0 ? player.ap : player.maxAp;
                currentPath = getPath(player.r, player.c, data.r, data.c, projectedAp);

                // Se houver uma rota segura, ilumina os quadrados
                if (currentPath && currentPath.length > 0) {
                    physGridGroup.children.forEach(child => {
                        if (child.userData.type === 'floor' || child.userData.type === 'platform') {
                            const inPath = currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);
                            if (inPath) {
                                // NOVO: Fica Laranja se for um movimento do próximo turno, Ciano se for do atual
                                child.material.emissive.setHex(player.ap > 0 ? 0x00ffcc : 0xff8800);
                            }
                        }
                    });
                }
            }
        }
    } else {
        //se o rato saiu do mapa para o background, limpa tudo
        if (hoveredTile !== null) {
            hoveredTile = null;
            clearHighlights();
        }
    }
});

//ações primárias do rato (mover, entrar em teminais, selecionar um alvo, apanhar items)
window.addEventListener('mousedown', (e) => {
    const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // mundo físico
    if (currentMode === 'PHYSICAL') {
        const intersects = raycaster.intersectObjects(physGridGroup.children);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;

            if (data.r === undefined || data.c === undefined) return;

            const type = currentLevelData.map[data.r][data.c];

            if (type === 1) return;
            if (type === 4 && data.type !== 'platform') return;

            // interagir com terminais
            if (type === 2) {
                //necessário estar adjecente
                const dist = Math.abs(player.r - data.r) + Math.abs(player.c - data.c);
                if (dist <= 1) {
                    const tData = currentLevelData.terminals.find(t => t.r === data.r && t.c === data.c);
                    if (tData) {
                        generateMirroredNetrun(tData);
                        toggleMode('NETRUN');
                        clearHighlights();
                    }
                } else {
                    pushToLog("TOO FAR FROM TERMINAL. MOVE CLOSER.", false);
                }
                return;
            }

            //apanhar datapads
            if (type === 6) {
                const dist = Math.abs(player.r - data.r) + Math.abs(player.c - data.c);
                if (dist <= 1) {
                    const pData = currentLevelData.passwords.find(p => p.r === data.r && p.c === data.c);
                    if (pData && pData.mesh.visible) {
                        //adiciona o ID da chave ao inventário e esconde o objeto
                        player.inventory.push(pData.id);
                        pData.mesh.visible = false;

                        player.ap -= 1;
                        document.getElementById('ap-display').innerText = player.ap;
                        pushToLog("DATAPAD ACQUIRED. DECRYPTION KEY STORED.", false);
                        clearHighlights();
                    }
                } else {
                    pushToLog("TOO FAR FROM DATAPAD.", false);
                }
                return;
            }

            // Lógica de Movimento
            if (currentPath && currentPath.length > 0) {
                const lastStep = currentPath[currentPath.length - 1];

                // Verifica se clicámos exatamente no fim dessa rota planeada
                if (lastStep.r === data.r && lastStep.c === data.c) {

                    // Se o jogador tiver 0 AP, passa o turno automaticamente antes de se mexer
                    if (player.ap <= 0) {
                        pushToLog("OUT OF AP. AUTO-ENDING TURN...", false);

                        const startR = player.r;
                        const startC = player.c;

                        // Termina o turno 
                        document.getElementById('btn-end-turn').click();

                        const savedPath = currentPath;
                        currentPath = null;
                        clearHighlights();

                        setTimeout(() => {
                            // Verifica se o jogador sobreviveu ao turno sem ser apanhado
                            const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
                            if (player.r === startR && player.c === startC && !inVision) {
                                executePathMovement(savedPath);
                            }
                        }, 400);

                        return;
                    }

                    // Se tinha AP normal, o movimento é imediato
                    executePathMovement(currentPath);
                    return;
                }
            }

            if (data.r === player.r && data.c === player.c) return;

            pushToLog("INVALID MOVE. PATH BLOCKED OR NOT ENOUGH AP.", false);
        }
    }

    //ações em netspace
    else if (currentMode === 'NETRUN') {
        const intersects = raycaster.intersectObjects(netFloorGroups[player.floor].children);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;

            //Terminal
            if (data.isTerminal) {
                if (player.floor === currentTotalFloors - 1) {

                    //não podes completar o terminal se estiveres em combate
                    const inCombat = enemies.some(en => en.data.active && en.data.isAlerted);
                    if (inCombat) {
                        pushToLog("ACCESS DENIED: COMBAT DETECTED. PURGE ICE FIRST.", true);
                        return;
                    }

                    let successMessage = "";

                    //executa a ação programada no nível para este terminal

                    if (activeTerminal.action === "unlock_door") {
                        const targetDoor = currentLevelData.doors.find(d => d.id === activeTerminal.targetId);
                        if (targetDoor) {
                            targetDoor.unlocked = true;

                            //targetDoor.leftMesh.material.color.setHex(0x00ffcc);
                            //targetDoor.leftMesh.material.emissive.setHex(0x00ffcc);
                            //targetDoor.rightMesh.material.color.setHex(0x00ffcc);
                            //targetDoor.rightMesh.material.emissive.setHex(0x00ffcc);
                        }
                        successMessage = "CORE COMPROMISED. DOOR UNLOCKED.";

                    } else if (activeTerminal.action === "disable_camera") {
                        const targetCam = currentLevelData.cameras.find(c => c.id === activeTerminal.targetId);
                        if (targetCam) targetCam.active = false;
                        successMessage = "CORE COMPROMISED. CAMERA NETWORK OFFLINE.";

                    } else if (activeTerminal.action === "rotate_arm") {
                        if (currentLevelData.robotArm) {
                            currentLevelData.robotArmTargetRot -= Math.PI; //roda o braço
                            currentLevelData.map[8][7] = 0; //liberta as células na data
                            currentLevelData.map[7][7] = 0;
                        }
                        successMessage = "CORE COMPROMISED. MACHINERY OVERRIDE ENGAGED.";

                    } else if (activeTerminal.action === 'disable_drone') {
                        // Transforma o targetId numa lista (mesmo que seja só um drone, vira uma lista de 1 elemento)
                        const targets = Array.isArray(activeTerminal.targetId) ? activeTerminal.targetId : [activeTerminal.targetId];

                        let disabledCount = 0;

                        // Percorre todos os IDs de drones fornecidos pelo terminal
                        targets.forEach(id => {
                            const targetDrone = currentLevelData.drones.find(d => d.id === id);
                            if (targetDrone) {
                                targetDrone.active = false;

                                // Efeito visual de desligar
                                if (targetDrone.mesh) {
                                    targetDrone.mesh.material.emissive.setHex(0x111111);
                                    targetDrone.mesh.material.opacity = 0.3;
                                    targetDrone.mesh.position.y = 0.1; // Drone cai no chão
                                }
                                disabledCount++;
                            }
                        });

                        if (disabledCount > 0) {
                            pushToLog(`CORE COMPROMISED. ${disabledCount} AUTOMATED DRONE(S) OFFLINE.`, true);
                        }
                    }

                    //volta ao mundo real
                    toggleMode('PHYSICAL');
                    updateVision();
                    pushToLog(successMessage, false);

                } else {
                    //Jack Out: interagir com o terminal num andar superior cancela a Netrun
                    toggleMode('PHYSICAL');
                    updateVision();
                    pushToLog("JACKED OUT OF NETRUN.", false);
                }
                return;
            }

            //verifica se o clique acertou diretamente num ICE e seleciona-o como alvo
            const clickedEnemy = enemies.find(e => e.data.active && e.data.floor === player.floor && e.data.x === data.x && e.data.z === data.z);
            if (clickedEnemy) {
                selectedTarget = clickedEnemy;
                pushToLog("TARGET LOCKED: ICE_UNIT.", true);
                return;
            }

            //movimento dentro da grelha
            const dist = Math.abs(player.r - data.z) + Math.abs(player.c - data.x);

            const targetType = currentLevelData.map[data.z][data.x];
            if (targetType === 2) {
                pushToLog("PATH BLOCKED. SOLID OBSTACLE.", true);
                return;
            }
            const targetDoor = currentLevelData.doors.find(d => d.r === data.z && d.c === data.x);
            if (targetType === 3 && targetDoor && !targetDoor.unlocked) {
                pushToLog("PATH BLOCKED. DOOR LOCKED.", true);
                return;
            }

            // move 1 cell de cada vez
            if (dist === 1) {
                //passiva do Scorpion: Se estiver vivo no mesmo andar, impede-te de andar
                if (player.statuses.scorpionActive) {
                    pushToLog("SCORPION ICE: MOVEMENT ROOTED!", true);
                    return;
                }

                player.targetRot = Math.atan2(data.x - player.c, data.z - player.r);

                //move e consome NA
                player.c = data.x;
                player.r = data.z;
                selectedTarget = null; //O movimento anula a seleção do alvo
                consumeNetAction(1);

            } else if (dist > 1) {
                pushToLog("INVALID MOVE. SELECT ADJACENT TILE.", true);
            }
        }
    }
});

// Barra de espaço passa o turno
window.addEventListener('keydown', (e) => {
    if (appState !== 'GAME') return;

    if (e.code === 'Space') {
        e.preventDefault();  //impede o ecrã de deslizar para baixo no browser
        document.getElementById('btn-end-turn').click();
    }
});

///////////////////////////////
// Gestão de turnos e IA de ICE
///////////////////////////////

// Remove NA. Quando chega a 0 acaba o turno e é a vez do inimigo agir.
function consumeNetAction(cost = 1) {
    player.netAp -= cost;
    document.getElementById('net-ap-display').innerText = player.netAp;

    // Turno do inimigo inicia quando as ações esgotam
    if (player.netAp <= 0) {
        triggerNetAction();

        //repõe os Pontos de Ação descontando a penalidade do Wisp se estiver ativa
        player.netAp = Math.max(1, player.maxNetAp - player.statuses.netApPenalty);
        player.statuses.netApPenalty = 0;

        document.getElementById('net-ap-display').innerText = player.netAp;
    }
}

function triggerNetAction() {

    //reduz os temporizadores dos programas desativados pelo Asp
    for (let prog in player.statuses.disabledPrograms) {
        if (player.statuses.disabledPrograms[prog] > 0) {
            player.statuses.disabledPrograms[prog]--;
            if (player.statuses.disabledPrograms[prog] === 0) {
                pushToLog(`SYSTEM RECOVERED: ${prog.toUpperCase()}.EXE ONLINE.`, true);
            }
        }
    }

    //aplicação do DOT do Hellhound
    if (player.statuses.burning > 0) {
        takeDamage(1);
        pushToLog(`(HELLHOUND FIRE: ${player.statuses.burning} TURNS LEFT)`, true);
        player.statuses.burning--;
    }

    processNetrunTurn();
}

//inteligência artificial dos ICE
function processNetrunTurn() {
    player.statuses.krakenActive = false;
    player.statuses.scorpionActive = false;

    enemies.forEach(en => {
        if (!en.data.active) return;

        const distX = Math.abs(player.c - en.data.x);
        const distZ = Math.abs(player.r - en.data.z);
        const dist = Math.max(distX, distZ);

        // sistema de aggro
        if (en.data.floor === player.floor && dist <= 2) en.data.isAlerted = true;

        if (en.data.isAlerted && en.data.floor === player.floor) {

            // ativa passivas
            if (en.data.type === 'Kraken') player.statuses.krakenActive = true;
            if (en.data.type === 'Scorpion') player.statuses.scorpionActive = true;

            //ICE não podem sair da grelha 3x3 nem pisar no terminal
            const isValidIceTile = (x, z) => {
                if (z < 0 || z >= currentLevelData.map.length || x < 0 || x >= currentLevelData.map[0].length) return false;
                if (activeTerminal && (Math.abs(x - activeTerminal.c) > 1 || Math.abs(z - activeTerminal.r) > 1)) return false;
                if (activeTerminal && x === activeTerminal.c && z === activeTerminal.r) return false;

                const type = currentLevelData.map[z][x];
                if (type === 1 || type === 4) return false;

                return true;
            };

            // pathfinding do ICE até ao jogador
            let queue = [{ x: en.data.x, z: en.data.z, path: [] }];
            let visited = new Set([`${en.data.x},${en.data.z}`]);
            let targetPath = null;

            while (queue.length > 0) {
                let curr = queue.shift();

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

            //move o inimigo para o primeiro passo do path
            if (targetPath && targetPath.length > 0) {
                const nextStep = targetPath[0];

                if (!(nextStep.x === player.c && nextStep.z === player.r)) {
                    en.data.x = nextStep.x;
                    en.data.z = nextStep.z;
                }
            }

            const newDistX = Math.abs(player.c - en.data.x);
            const newDistZ = Math.abs(player.r - en.data.z);

            // se estiver adjecente ao jogador ataca
            if (newDistX <= 1 && newDistZ <= 1) {
                takeDamage(1);

                // lógica de efeitos de ataque por classe de ICE
                if (en.data.type === 'Asp') {
                    // escolhe uma das habilidades de batalha para desativar
                    const targetable = ['swordfish', 'harpoon', 'scales', 'swim'];
                    const hitProg = targetable[Math.floor(Math.random() * targetable.length)];

                    player.statuses.disabledPrograms[hitProg] = 3;
                    pushToLog(`ASP VIRUS: ${hitProg.toUpperCase()}.EXE CORRUPTED!`, true);

                } else if (en.data.type === 'Wisp') {
                    // remove NA no próximo turno
                    if (player.statuses.netApPenalty < 1) {
                        player.statuses.netApPenalty = 1;
                        pushToLog("WISP HIT: NET ACTION DRAINED!", true);
                    }
                } else if (en.data.type === 'Hellhound') {
                    // faz o jogador arder por 4 turnos
                    player.statuses.burning = 4;
                    pushToLog("HELLHOUND: NEURAL FIRE DETECTED!", true);
                }

                //Faz o ICE brilhar durante 200ms
                if (en.body.isGroup) {
                    en.body.traverse((child) => { if (child.isMesh && child.material) child.material.emissiveIntensity = 5; });
                    setTimeout(() => { if (en.data.active) en.body.traverse((child) => { if (child.isMesh && child.material) child.material.emissiveIntensity = 0.6; }); }, 200);
                } else {
                    if (en.body.material) en.body.material.emissiveIntensity = 5;
                    setTimeout(() => { if (en.data.active && en.body.material) en.body.material.emissiveIntensity = 0.6; }, 200);
                }
            }
        }
    });
}

// Atualiza a representação visual da architecture
function updateNetUI() {
    const sc = document.getElementById('stack-container');
    sc.innerHTML = '';

    for (let i = 0; i < currentTotalFloors; i++) {
        const layer = document.createElement('div');
        layer.className = 'stack-layer';
        layer.id = `layer-${i}`;

        // Ilumina o andar onde o jogador se encontra
        if (i === player.floor) {
            layer.classList.add('active');
        }

        // Fica vermelho se houver um ICE acordado a vigiar esse andar
        const enemyPresent = enemies.some(en => en.data.active && en.data.floor === i && en.data.isAlerted);
        if (enemyPresent) {
            layer.classList.add('detected');
        }

        // tranca o andar se o núcleo precise de um Datapad para entrar
        const isLocked = (i === currentTotalFloors - 1) && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith);
        if (isLocked) {
            layer.classList.add('locked');
        }

        sc.appendChild(layer);
    }
}

// Verificação antes de o jogador andar para cima/baixo num terminal (Ascend/Dive)
function canChangeFloor(targetFloor) {
    // evita andar para cima de um monstro que esteja por cima/baixo do jogador
    const isIceOccupied = enemies.some(en => en.data.active && en.data.floor === targetFloor && en.data.x === player.c && en.data.z === player.r);
    if (isIceOccupied) return false;

    // impede descer para a posição do terminal (failsafe porque não se pode ir para a posição do terminal em primeiro lugar)
    if (targetFloor === currentTotalFloors - 1 && player.c === activeTerminal.c && player.r === activeTerminal.r) return false;

    return true;
}

// Botão ASCEND (subir para o andar anterior)
document.getElementById('btn-up').onclick = () => {
    //kraken impede mudar de andar
    if (player.statuses.krakenActive) { pushToLog("KRAKEN ICE: ELEVATION BLOCKED!", true); return; }

    //verifica se não estamos já no topo (0) e se o tile de destino no andar de cima está livre
    if (player.floor > 0 && canChangeFloor(player.floor - 1)) {
        player.floor--;

        //ICE que já esteja alerta, perseguem o jogador para o novo andar
        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        // atualiza o UI e consome NA
        updateNetUI();
        consumeNetAction(1);

        checkNetrunTriggers();
    }

    //bloqueado por ICE
    else if (player.floor > 0) {
        pushToLog("ERROR: ELEVATION BLOCKED BY ICE.", true);
    }
};

// Botão DIVE (descer para o andar seguinte)
document.getElementById('btn-down').onclick = () => {
    //kraken impede mudar de andar
    if (player.statuses.krakenActive) { pushToLog("KRAKEN ICE: DIVE BLOCKED!", true); return; }

    // se esse terminal exige uma chave que o jogador não tem no inventário 
    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        pushToLog("ERROR: DECRYPTION KEY REQUIRED TO ACCESS CORE.", true);
        return;
    }

    //verifica se não estamos já no fundo e se o tile de destino no andar de baixo está livre
    if (player.floor < currentTotalFloors - 1 && canChangeFloor(player.floor + 1)) {
        player.floor++;

        //ICE que já esteja alerta, perseguem o jogador para o novo andar
        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        // atualiza o UI e consome NA
        updateNetUI();
        consumeNetAction(1);
        checkNetrunTriggers();
    }

    //bloqueado por ICE
    else if (player.floor < currentTotalFloors - 1) {
        pushToLog("ERROR: DIVE BLOCKED BY ICE.", true);
    }
};

////////////////////////////////////////
// habilidades e programas de netrunning
////////////////////////////////////////

//SONAR.EXE: Revela todos os andares
document.getElementById('btn-sonar').onclick = () => {
    if (currentMode !== 'NETRUN' || isScanning) return;

    isScanning = true;
    pushToLog("SONAR.EXE: SCANNING ARCHITECTURE...", true);

    // Percorre todos os inimigos e ilumina os andares onde eles se encontram
    enemies.forEach(en => {
        if (en.data.active) {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.add('scanning-active'); // Ativa a animação de pulsação CSS
                layer.classList.add('detected');        // Pinta o andar de vermelho
            }
        }
    });

    // O efeito dura 3 segundos antes de desaparecer
    setTimeout(() => {
        isScanning = false;
        enemies.forEach(en => {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.remove('scanning-active');
                // Mantém o realce apenas se o inimigo já estivesse alerta naturalmente
                const naturallyAlerted = enemies.some(nEn => nEn.data.active && nEn.data.floor === en.data.floor && nEn.data.isAlerted);
                if (!naturallyAlerted) {
                    layer.classList.remove('detected');
                }
            }
        });
    }, 3000);

    consumeNetAction(1);
};

//SCALES.EXE: Escudo defensivo contra ataques de ICE
document.getElementById('btn-scales').onclick = () => {
    if (currentMode !== 'NETRUN') return;

    // Verifica se o programa foi corrompido por um Asp
    if (player.statuses.disabledPrograms.scales > 0) {
        pushToLog(`ERROR: SCALES.EXE REBOOTING (${player.statuses.disabledPrograms.scales} TURNS)`, true);
        return;
    }

    //absorve os próximos 2 ataques recebidos
    player.statuses.scalesBarrier = 2;
    pushToLog("SCALES.EXE: ABSORB NEXT 2 SPIKES.", true);

    consumeNetAction(1);
};

//SWIM.EXE: Fuga de emergência para despistar inimigos
document.getElementById('btn-swim').onclick = () => {
    if (currentMode !== 'NETRUN') return;
    if (player.statuses.krakenActive) { pushToLog("SWIM.EXE FAILED: KRAKEN ROOTED YOU.", true); return; }

    // Verifica se o programa foi corrompido por um Asp
    if (player.statuses.disabledPrograms.swim > 0) {
        pushToLog(`ERROR: SWIM.EXE REBOOTING (${player.statuses.disabledPrograms.swim} TURNS)`, true);
        return;
    }

    //O jogador não pode mergulhar para um andar trancado se não tiver a chave
    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        pushToLog("SWIM.EXE FAILED: DECRYPTION KEY REQUIRED.", true);
        return;
    }

    if (player.floor < currentTotalFloors - 1) {
        //verifica se a cell não está ocupada
        if (!canChangeFloor(player.floor + 1)) {
            pushToLog("SWIM.EXE FAILED: CELL OCCUPIED.", true); return;
        }

        player.floor++;

        // foge dos inimigos e perde o aggro
        enemies.forEach(en => {
            if (en.data.active && en.data.floor !== player.floor) {
                en.data.isAlerted = false;
            }
        });

        updateNetUI();
        pushToLog("SWIM.EXE: EMERGENCY DIVE EXECUTED. ICE EVADED.", true);

        consumeNetAction(1);
    } else {
        pushToLog("SWIM.EXE FAILED: MAXIMUM DEPTH REACHED.", true);
    }
};

//HARPOON.EXE: Ataque de longo alcance 
document.getElementById('btn-harpoon').onclick = () => {
    if (currentMode !== 'NETRUN') return;

    if (player.statuses.disabledPrograms.harpoon > 0) {
        pushToLog(`ERROR: HARPOON.EXE REBOOTING (${player.statuses.disabledPrograms.harpoon} TURNS)`, true);
        return;
    }

    let target = selectedTarget;

    if (target && target.data.active && target.data.floor !== player.floor) {
        target = null;
    }

    if (!target || !target.data.active) {
        let minDist = Infinity;
        enemies.forEach(en => {
            if (en.data.active && en.data.floor === player.floor) {
                const dist = Math.max(Math.abs(player.c - en.data.x), Math.abs(player.r - en.data.z));
                if (dist < minDist) {
                    minDist = dist;
                    target = en;
                }
            }
        });
    }

    if (!target || target.data.floor !== player.floor) {
        pushToLog("HARPOON.EXE FAILED: NO VALID TARGETS.", true);
        return;
    }

    //rotate player
    player.targetRot = Math.atan2(target.data.x - player.c, target.data.z - player.r);

    //apply Damage
    target.data.hp -= 3;

    if (models.harpoonGltf) {
        if (harpoonTimeout) {
            clearTimeout(harpoonTimeout);
            harpoonTimeout = null;
        }
        if (activeHarpoon) {
            scene.remove(activeHarpoon);
        }

        const startY = playerGroup.position.y + 1.5;
        const targetY = target.group.position.y + 0.25;

        activeHarpoon = new THREE.Group();

        activeHarpoon.position.set(playerGroup.position.x, startY, playerGroup.position.z);
        activeHarpoon.lookAt(target.group.position.x, targetY, target.group.position.z);

        const harpoonMesh = models.harpoonGltf.scene.clone();
        activeHarpoon.scale.set(2.5, 2.5, 2.5);

        harpoonMesh.rotation.y = Math.PI;

        /*
        const dx = target.group.position.x - playerGroup.position.x;
        const dz = target.group.position.z - playerGroup.position.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        
        const pitchAngle = Math.atan2(targetY - startY, distXZ);

        activeHarpoon.rotation.y = player.targetRot + Math.PI;
        
        activeHarpoon.rotation.x = -pitchAngle; 
        */

        activeHarpoon.add(harpoonMesh);

        activeHarpoon.userData = {
            spawnTime: Date.now(),
            startX: playerGroup.position.x,
            startZ: playerGroup.position.z,
            targetX: target.group.position.x,
            targetZ: target.group.position.z,
            startY: startY,
            targetY: targetY
        };

        scene.add(activeHarpoon);

        harpoonTimeout = setTimeout(() => {
            if (activeHarpoon) {
                scene.remove(activeHarpoon);
                activeHarpoon = null;
            }
        }, 700);

    } else {
        //fallback
        netSlashEffect.position.set(target.group.position.x, 0.6, target.group.position.z);
        netSlashMat.opacity = 1;
    }


    if (target.data.hp <= 0) {
        target.data.active = false;
        target.group.visible = false;
        if (selectedTarget === target) selectedTarget = null;
        pushToLog("TARGET TERMINATED", true);
    } else {
        pushToLog(`ICE INTEGRITY: ${target.data.hp * 10}%`, true);
    }

    consumeNetAction(1);
};

//SWORDFISH.EXE: Ataque de curto alcance mas de dano elevado
document.getElementById('btn-swordfish').onclick = () => {
    if (currentMode !== 'NETRUN') return;

    if (player.statuses.disabledPrograms.swordfish > 0) {
        pushToLog(`ERROR: SWORDFISH.EXE REBOOTING (${player.statuses.disabledPrograms.swordfish} TURNS)`, true);
        return;
    }

    let target = selectedTarget;

    if (target && target.data.active) {
        const dx = Math.abs(player.c - target.data.x);
        const dz = Math.abs(player.r - target.data.z);
        if (target.data.floor !== player.floor || dx > 1 || dz > 1) {
            target = null;
        }
    }

    if (!target || !target.data.active) {
        target = enemies.find(en =>
            en.data.active &&
            en.data.floor === player.floor &&
            Math.max(Math.abs(player.c - en.data.x), Math.abs(player.r - en.data.z)) <= 1
        );
    }

    if (!target || !target.data.active) {
        pushToLog("SWORDFISH.EXE FAILED: NO TARGETS IN RANGE.", true);
        return;
    }

    //rotate player
    player.targetRot = Math.atan2(target.data.x - player.c, target.data.z - player.r);

    target.data.hp -= 5;

    if (models.swordfishGltf) {

        if (swordfishTimeout) {
            clearTimeout(swordfishTimeout);
            swordfishTimeout = null;
        }

        if (activeSwordfish) {
            scene.remove(activeSwordfish);
        }

        activeSwordfish = SkeletonUtils.clone(models.swordfishGltf.scene);

        activeSwordfish.scale.set(1.5, 1.5, 1.5);

        activeSwordfish.position.set(target.group.position.x, target.group.position.y + 0.5, target.group.position.z);
        activeSwordfish.rotation.y = player.targetRot;

        activeSwordfish.traverse((child) => {
            if (child.isMesh) {
                child.renderOrder = 1000;
                if (child.material) {
                    child.material.depthTest = false;
                    child.material.transparent = true;
                    child.material.opacity = 0;
                }
            }
        });

        activeSwordfish.userData.spawnTime = Date.now();

        scene.add(activeSwordfish);

        swordfishMixer = new THREE.AnimationMixer(activeSwordfish);

        const strikeClip = models.swordfishGltf.animations[0];

        if (strikeClip) {
            const action = swordfishMixer.clipAction(strikeClip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.reset();
            action.play();
        }

        swordfishTimeout = setTimeout(() => {
            if (activeSwordfish) {
                scene.remove(activeSwordfish);
                activeSwordfish = null;
            }
        }, 900);

    } else {
        // Fallback
        netSlashEffect.position.set(target.group.position.x, 0.6, target.group.position.z);
        netSlashEffect.scale.set(0.1, 0.1, 0.1);
        netSlashMat.opacity = 1;
    }

    if (target.data.hp <= 0) {
        target.data.active = false;
        target.group.visible = false;
        if (selectedTarget === target) selectedTarget = null;
        pushToLog("TARGET TERMINATED", true);
    } else {
        pushToLog(`SWORDFISH -> ICE INTEGRITY: ${target.data.hp * 10}%`, true);
    }

    consumeNetAction(1);
};

////////////////////////
// Botão de fim de turno
////////////////////////

document.getElementById('btn-end-turn').onclick = () => {
    // Impede o fim do turno se o jogador ainda estiver a meio de uma animação de movimento
    if (isPlayerMoving) return;

    if (currentMode === 'PHYSICAL') {
        // Repõe os Pontos de Ação (AP) físicos
        player.ap = player.maxAp;
        document.getElementById('ap-display').innerText = player.ap;

        // Atualiza o estado de todos os guardas
        if (currentLevelData.guards) {
            currentLevelData.guards.forEach(guard => {
                if (guard.path) {
                    // guardas em movimento avançam para o próximo passo da sua lista
                    guard.pathIdx = (guard.pathIdx + 1) % guard.path.length;
                    const step = guard.path[guard.pathIdx];

                    guard.r = step.r;
                    guard.c = step.c;

                    // Define a rotação do modelo 3D baseada na direção do path
                    if (step.dir === 'up') guard.targetRot = Math.PI;
                    else if (step.dir === 'down') guard.targetRot = 0;
                    else if (step.dir === 'left') guard.targetRot = -Math.PI / 2;
                    else if (step.dir === 'right') guard.targetRot = Math.PI / 2;

                    guard.dirs = [step.dir];
                    guard.dirIdx = 0;
                } else if (guard.dirs) {
                    // guardas estáticos apenas rodam para a próxima direção configurada
                    guard.dirIdx = (guard.dirIdx + 1) % guard.dirs.length;
                }
            });
        }

        //processa elementos dinâmicos do cenário
        processMovingPlatforms();
        processDrones();
        updateVision();

        setTimeout(() => {
            checkPhysicalDetection();
        }, 300); //verifica se o jogador terminou o turno numa zona de perigo após os guardas darem update

    } else if (currentMode === 'NETRUN') {
        pushToLog("NET TURN ENDED", true);
        player.netAp = 0;
        consumeNetAction(0); //força o fim do turno e passa a vez aos ICE
    }
};

/////////////////////////////////////////
// Responsável estritamente pelo tweening
/////////////////////////////////////////

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (netPlayerMixer) {
        netPlayerMixer.update(delta);
    }

    if (swordfishMixer) {
        swordfishMixer.update(delta);
    }

    if (typeof activeSwordfish !== 'undefined' && activeSwordfish) {
        const age = Date.now() - activeSwordfish.userData.spawnTime;

        activeSwordfish.traverse((child) => {
            if (child.isMesh && child.material) {
                if (age < 150) {
                    // Fade In 
                    child.material.opacity = age / 150;
                } else if (age > 600) {
                    //Fade Out suave 
                    child.material.opacity = Math.max(0, 1.0 - ((age - 600) / 300));
                } else {
                    child.material.opacity = 1.0;
                }
            }
        });
    }

    if (typeof activeHarpoon !== 'undefined' && activeHarpoon) {
        const age = Date.now() - activeHarpoon.userData.spawnTime;

        const flightProgress = Math.min(1, age / 100);

        activeHarpoon.position.x = activeHarpoon.userData.startX + (activeHarpoon.userData.targetX - activeHarpoon.userData.startX) * flightProgress;
        activeHarpoon.position.z = activeHarpoon.userData.startZ + (activeHarpoon.userData.targetZ - activeHarpoon.userData.startZ) * flightProgress;
        activeHarpoon.position.y = activeHarpoon.userData.startY + (activeHarpoon.userData.targetY - activeHarpoon.userData.startY) * flightProgress;

        activeHarpoon.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];

                mats.forEach(mat => {
                    if (!mat.transparent) {
                        mat.transparent = true;
                        mat.needsUpdate = true;
                    }

                    if (age < 50) {
                        //fade in
                        mat.opacity = age / 50;
                    } else if (age > 200) {
                        //Fade Out 
                        mat.opacity = Math.max(0, 1.0 - ((age - 200) / 250));
                    } else {
                        mat.opacity = 1.0;
                    }
                });
            }
        });
    }

    // Só processa animações se o jogador estiver num nível ou tutorial
    if (appState !== 'GAME' && appState !== 'TUTORIAL') return;

    // Define a opacidade base do mundo físico: 
    // Se o jogador estiver Netrunning, o mundo real fica quase invisível (0.15)
    const targetPhysOp = currentMode === 'NETRUN' ? 0.15 : 1.0;

    // Tweening visual para malhas, highlights do modo Netrun, etc.
    physGridGroup.children.forEach(child => {
        let targetOp = targetPhysOp;

        // Verifica se este objeto é o terminal que o jogador está a hackear no momento
        const isActiveTerminal = (currentMode === 'NETRUN' && child.userData.type === 'terminal' && child.userData.data && activeTerminal && child.userData.data.id === activeTerminal.id);

        child.traverse(m => {
            if ((m.isMesh || m.isLine) && m.material) {
                const mats = Array.isArray(m.material) ? m.material : [m.material];

                mats.forEach(mat => {
                    //garante que todos os materiais suportam transparência para as transições
                    if (mat.transparent === false) mat.transparent = true;

                    let finalTargetOp = targetOp;

                    // O terminal ativo no Netspace deve manter-se 100% visível
                    if (isActiveTerminal) {
                        finalTargetOp = 1.0;
                    }
                    //tiles
                    else if (m.userData.isHitbox) {
                        const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
                        const inPath = currentPath && currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);

                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.3; // no Netspace, o chão físico é quase transparente
                        } else if (isExit || inPath) {
                            finalTargetOp = 0.4; // realça a saída ou o caminho planeado
                        } else {
                            finalTargetOp = 0.0; // em chão normal apenas a borda aparece
                        }
                    }
                    //outlines
                    else if (m.userData.isOutline) {
                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.0; //em Netspace remove os outlines de tiles no mundo fisico
                        } else {
                            const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
                            finalTargetOp = isExit ? 1.0 : 0.25;
                        }
                    }

                    //aproxima a opacidade atual da opacidade desejada em 10% por frame
                    if (mat.opacity !== undefined) {
                        mat.opacity += (finalTargetOp - mat.opacity) * 0.1;
                    }

                    //ajusta o brilho baseado na opacidade
                    if (mat.emissive && !m.isLine) {
                        const maxGlow = (child.userData && child.userData.type === 'camera') ? 1.0 : 0.5;
                        mat.emissiveIntensity = mat.opacity * maxGlow;
                    }
                });
            }
        });
    });

    // Suaviza a alteração da opacidade do corpo físico do jogador
    physBody.material.opacity += (targetPhysOp - physBody.material.opacity) * 0.1;

    // Suaviza a alteração da opacidade dos cones de visao ds inimigos
    visionGroup.children.forEach(child => {
        if (child.material) {
            const targetOp = child.userData.isCone
                ? (currentMode === 'NETRUN' ? 0.05 : 0.4)
                : targetPhysOp;
            child.material.opacity += (targetOp - child.material.opacity) * 0.1;
        }
    });

    //movimento suave do Jogador
    playerGroup.position.x += (player.c - playerGroup.position.x) * 0.2;
    playerGroup.position.z += (player.r - playerGroup.position.z) * 0.2;

    //rotação do jogador
    if (player.targetRot !== undefined) {
        // Calcula a distância mais curta para a nova rotação (evita piruetas 360º)
        const diff = player.targetRot - playerGroup.rotation.y;
        const shortestDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        playerGroup.rotation.y += shortestDiff * 0.2;
    }

    //ajuste suave de altura baseado no terreno ou no andar do netspace
    let targetY = 0;
    if (currentMode === 'NETRUN') {
        targetY = netrunBaseY;
    } else if (currentLevelData.heightMap && currentLevelData.heightMap[player.r]) {
        targetY = currentLevelData.heightMap[player.r][player.c] || 0;
    }
    playerGroup.position.y += (targetY - playerGroup.position.y) * 0.2;

    // gestão de visibilidade do jogador fisico ou virtual
    if (currentMode === 'NETRUN') {
        physBody.visible = false;

        if (netPlayerModel) netPlayerModel.visible = true;
        if (netBody1) netBody1.visible = true;
        if (netBody2) {
            netBody2.visible = true;
            netBody2.rotation.y += 0.02;
        }

        //efeito visual de ataque (expansão e desvanecimento do anel)
        netSlashEffect.visible = true;
        if (netSlashMat.opacity > 0) {
            netSlashEffect.scale.x += 0.2;
            netSlashEffect.scale.y += 0.2;
            netSlashMat.opacity -= 0.05;
        }

        // Segue o jogador com uma luz virtual de modo a manter a iluminação constante
        netLight.position.set(playerGroup.position.x, playerGroup.position.y + 5, playerGroup.position.z);
        netLight.visible = true;
    } else {
        //no mundo fisico retira a visibilidade aos efeitos de netspace
        physBody.visible = true;
        if (netPlayerModel) netPlayerModel.visible = false;
        if (netBody1) netBody1.visible = false;
        if (netBody2) netBody2.visible = false;
        netSlashEffect.visible = false;
        netLight.visible = false;
    }

    // Movimento suave da câmara
    camera.position.x += ((player.c + 10) - camera.position.x) * 0.1;
    camera.position.z += ((player.r + 10) - camera.position.z) * 0.1;
    camera.position.y += (10 - camera.position.y) * 0.1;

    if (cameraShakeTime > 0) {
        cameraShakeTime -= delta;

        // Aplica um desvio aleatório à posição da câmara
        if (cameraShakeTime > 0) {
            camera.position.x += (Math.random() - 0.5) * cameraShakeIntensity;
            camera.position.z += (Math.random() - 0.5) * cameraShakeIntensity;

            // Diminui a intensidade gradualmente
            cameraShakeIntensity *= 0.9;
        }
    }

    //animação suave do braço robótico (se existir no nível)
    if (currentLevelData && currentLevelData.robotArm) {
        currentLevelData.robotArm.rotation.y += (currentLevelData.robotArmTargetRot - currentLevelData.robotArm.rotation.y) * 0.1;
    }

    //guardas e objetos
    if (currentLevelData.guards) {
        currentLevelData.guards.forEach(guard => {
            if (guard.mesh) {
                //rotação suave do guarda (calcula o caminho mais curto para rodar)
                if (guard.targetRot !== undefined) {
                    const diff = guard.targetRot - guard.mesh.rotation.y;
                    const shortestDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
                    guard.mesh.rotation.y += shortestDiff * 0.2;
                }
                // Movimento suave do guarda entre quadrados
                if (guard.c !== undefined && guard.r !== undefined) {
                    guard.mesh.position.x += (guard.c - guard.mesh.position.x) * 0.2;
                    guard.mesh.position.z += (guard.r - guard.mesh.position.z) * 0.2;
                }
            }
        });
    }

    // Animação de abertura das portas (deslizar para os lados)
    currentLevelData.doors.forEach(d => {
        if (d.unlocked && d.leftMesh && d.rightMesh) {
            d.leftMesh.position.x += (-0.65 - d.leftMesh.position.x) * 0.1;
            d.rightMesh.position.x += (0.65 - d.rightMesh.position.x) * 0.1;
        }
    });

    //movimento das plataformas móveis
    currentLevelData.platforms.forEach(plat => {
        if (plat.mesh) {
            plat.mesh.position.x += (plat.c - plat.mesh.position.x) * 0.2;
            plat.mesh.position.z += (plat.r - plat.mesh.position.z) * 0.2;
        }
    });

    //movimento e bobbing dos drones
    currentLevelData.drones.forEach(drone => {
        if (drone.mesh) {
            if (drone.active !== false) {
                //flutua e desloca-se para a sua coordenada
                drone.mesh.position.x += (drone.c - drone.mesh.position.x) * 0.2;
                drone.mesh.position.z += (drone.r - drone.mesh.position.z) * 0.2;
                drone.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.005) * 0.1;
            } else {
                //desliza para o chão
                drone.mesh.position.y += (0.1 - drone.mesh.position.y) * 0.2;
            }
        }
    });

    // inimigos e efeitos em netspace
    if (currentMode === 'NETRUN') {
        enemies.forEach(en => {
            if (en.data.active) {

                //animações dos ICE
                if (en.mixer) {
                    en.mixer.update(delta);
                }

                en.group.position.x += (en.data.x - en.group.position.x) * 0.2;
                en.group.position.z += (en.data.z - en.group.position.z) * 0.2;


                //sobe/desce conforme o jogador muda de andar
                const targetEnemyY = netrunBaseY + (-en.data.floor * FLOOR_SPACING) + 0.4 + (player.floor * FLOOR_SPACING);
                en.group.position.y += (targetEnemyY - en.group.position.y) * 0.2;

                //vibração se estiver alerta, pulsação se estiver calmo
                if (en.data.isAlerted) {
                    en.group.position.x += (Math.random() - 0.5) * 0.05;
                    en.group.position.z += (Math.random() - 0.5) * 0.05;
                    en.group.scale.y = 1;
                } else {
                    en.group.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.1;
                }

                // brilha mais intensamente se o jogador estiver perto
                const isNear = (player.floor === en.data.floor && Math.abs(player.c - en.data.x) <= 1 && Math.abs(player.r - en.data.z) <= 1);
                const baseColor = en.data.baseColor || 0xff0055;

                const targetEmissive = isNear ? 0.3 : 0.1;
                const targetLightInt = isNear ? 5 : 2;

                if (en.body.isGroup) {
                    en.body.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.emissive.setHex(baseColor);
                            child.material.emissiveIntensity = targetEmissive;
                        }
                    });
                } else {
                    if (en.body.material) {
                        en.body.material.emissive.setHex(baseColor);
                        en.body.material.emissiveIntensity = targetEmissive;
                    }
                }

                // Atualiza a intensidade da luz que criámos
                if (en.group.userData.personalLight) {
                    en.group.userData.personalLight.intensity = targetLightInt;
                }

                //só mostra inimigos que estejam no mesmo andar (ou durante um scan do Sonar)
                en.group.visible = (en.data.floor === player.floor || isScanning);
            } else en.group.visible = false;
        });

        //movimento suave dos andares da arquitetura (efeito de elevador)
        netFloorGroups.forEach((g, i) => {
            const floorMultiplier = (i === player.floor || isScanning) ? 1.0 : 0.05;

            const targetFloorY = netrunBaseY + (-i * FLOOR_SPACING) + (player.floor * FLOOR_SPACING);
            g.position.y += (targetFloorY - g.position.y) * 0.2;

            // reduz a opacidade dos andares distantes
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
        // Esconde tudo o que é virtual se o modo for Físico
        netFloorGroups.forEach(g => g.visible = false);
        enemies.forEach(en => en.group.visible = false);
    }

    // Renderiza a cena final com a câmara atualizada
    renderer.render(scene, camera);

}

// Inicia o ciclo de animação
animate();