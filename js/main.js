import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

//import dos dados e arquitetura dos níveis
import { LEVEL_DATA } from './data/levels.js';
import { introSequence, mission1Dialogue, mission2Dialogue, mission3Dialogue, mission4Dialogue, mission5Dialogue, mission6Dialogue } from './data/dialogues.js';

////////////////////////////////////////////////////
//inicialização do Three.js, load dos modelos (.glb) 
//e variáveis globais do estado do jogo.
////////////////////////////////////////////////////

let currentMode = 'PHYSICAL'; //define se estamos no modo 'PHYSICAL' (meatspace) ou 'NETRUN' (netspace)

const scene = new THREE.Scene();

//declaração dos modelos 3D 
let models = {
    hellhound: null, asp: null, krakenGltf: null, wispGltf: null, scorpionGltf: null,
    guard: null, doorGltf: null, cameraGltf: null, terminalGltf: null, plafplatformGltf: null,
    level1: null, level2: null, level3: null, level5: null,
    nyxGltf: null, netrunnerGltf: null, swordfishGltf: null, harpoonGltf: null
};

const clock = new THREE.Clock(); //Cronómetro para as animações
let netPlayerMixer = null;       //Controlador da animação do jogador
let netPlayerModel = null;       //O modelo 3D de netspace
let physPlayerModel = null;       //O modelo 3D físico
let physPlayerMixer = null;       //Controlador da animação do jogador

let swordfishMixer = null;
let activeSwordfish = null;
let swordfishTimeout = null;

let activeHarpoon = null;
let harpoonTimeout = null;

const loadingManager = new THREE.LoadingManager();

//atualiza a barra de progresso no HTML
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;

    const barFill = document.getElementById('loading-bar-fill');
    const loadText = document.getElementById('loading-text');

    if (barFill) barFill.style.width = progress + '%';
    if (loadText) loadText.innerText = `LOADING ASSETS... ${Math.floor(progress)}%`;
};

//quando acabar de carregar, esconde o loading screen e mostra o main menu
loadingManager.onLoad = function () {
    console.log('All assets loaded successfully!');

    //pequeno atraso para o jogador conseguir ver a barra chegar aos 100%
    setTimeout(() => {
        switchScreen('main-menu');
    }, 500);
};

const loader = new GLTFLoader(loadingManager);

loader.load('models/level5.glb', function (gltf) {
    models.level5 = gltf.scene;
    console.log("Level 5 Environment loaded!");
});

loader.load('models/Platform.glb', function (gltf) {
    models.platformGltf = gltf;
    console.log("Platform model loaded!");
});

loader.load('models/Terminal.glb', function (gltf) {
    models.terminalGltf = gltf;
    console.log("Terminal model loaded!");
});

loader.load('models/Nyx.glb', function (gltf) {
    models.nyxGltf = gltf;
    console.log("Nyx model loaded!");
});

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

loader.load('models/level2.glb', function (gltf) {
    models.level2 = gltf.scene;
    console.log("Level 2 Environment loaded!");
});

loader.load('models/level3.glb', function (gltf) {
    models.level3 = gltf.scene;
    console.log("Level 3 Environment loaded!");
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
renderer.domElement.style.display = 'none'; //escondido até o jogo começar

let appState = 'MENU';
let currentLevelIndex = 1;
let currentTutorialPages = [];
let currentTutorialIndex = 0;
let onTutorialComplete = null;

//função para navegar entre ecrãs dos diferentes estados do jogo
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

///////////////
//log de ações
///////////////

const logWrapper = document.getElementById('log-wrapper');
const logHistory = document.getElementById('log-history');
const logCurrent = document.getElementById('log-current');

//permite ao jogador expandir o histórico clicando na área
logWrapper.onclick = () => {
    logWrapper.classList.toggle('expanded');
    if (logWrapper.classList.contains('expanded')) {
        logHistory.scrollTop = logHistory.scrollHeight; //faz scroll automático para o fundo
    }
};

function pushToLog(message, isNet = false) {
    //ignora se for exatamente a mesma mensagem que a atual
    if (logCurrent.innerText === message) return;

    //passa a mensagem atual para o histórico antes de a substituir
    if (logCurrent.innerText.trim() !== "") {
        const historyEntry = document.createElement('div');

        //herda a classe da atual para manter a cor correta no histórico
        historyEntry.className = logCurrent.className.includes('netrun') ? 'log-item netrun' : 'log-item';
        historyEntry.innerText = logCurrent.innerText;

        logHistory.appendChild(historyEntry);
    }

    //define a nova mensagem e a respetiva cor (isNet = true usa vermelho)
    logCurrent.innerText = message;
    logCurrent.className = isNet ? 'log-current netrun' : 'log-current';

    //mantém o histórico scrolled para baixo se estiver aberto
    if (logWrapper.classList.contains('expanded')) {
        logHistory.scrollTop = logHistory.scrollHeight;
    }
}

///////////////////////////////////////////
//gere a secção introdutória e os diálogos
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

    //efeito de escrita gradual
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

            //ilumina territórios corporativos no mapa consoante a linha de atual
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

    //avança o texto ou auto-completa o texto atual
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

//função que gere o diálogo entre personagens, mesma lógica da função acima
function showCharacterDialogue(dialogueArray, onCompleteCallback) {
    switchScreen('character-dialogue-screen');
    currentDialogueIndex = 0;

    const paneLeft = document.getElementById('pane-left');
    const paneRight = document.getElementById('pane-right');
    const textLeft = document.getElementById('text-left');
    const textRight = document.getElementById('text-right');
    const portraitLeft = document.getElementById('portrait-left');
    const portraitRight = document.getElementById('portrait-right');

    const characterArt = {
        "Snapper": "media/Snapper.png", //
        //"Nyx": "assets/Nyx.png",
        //"Eel": "assets/Eel.png"
    };

    function typeWriter(textElement, text, index) {
        isTyping = true;

        //pega no texto desde o início até à letra atual
        const currentText = text.substring(0, index + 1);

        //converte os \n para saltos de linha em HTML e mostra no ecrã
        textElement.innerHTML = currentText.replace(/\n/g, '<br>');

        //se ainda não chegou ao fim do texto, agenda a próxima letra
        if (index < text.length - 1) {
            typingTimeout = setTimeout(() => typeWriter(textElement, text, index + 1), 30);
        } else {
            isTyping = false; //terminou de escrever
        }
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

        const bgImage = characterArt[line.name] ? `url('${characterArt[line.name]}')` : 'none';

        //lógica de escurecer quem não está a falar
        if (line.side === "left") {
            paneLeft.classList.remove('inactive');
            paneRight.classList.add('inactive');
            portraitLeft.innerText = line.name;

            paneLeft.style.backgroundImage = bgImage;

            typeWriter(textLeft, line.text, 0);
        } else {
            paneRight.classList.remove('inactive');
            paneLeft.classList.add('inactive');
            portraitRight.innerText = line.name;

            paneRight.style.backgroundImage = bgImage;

            typeWriter(textRight, line.text, 0);
        }
    }

    document.getElementById('character-dialogue-screen').onclick = () => {
        if (isTyping) {
            clearTimeout(typingTimeout);
            const line = dialogueArray[currentDialogueIndex];

            //converte todos os \n para <br> quando o texto aparece instantaneamente
            const formattedText = line.text.replace(/\n/g, '<br>');

            if (line.side === 'left') textLeft.innerHTML = formattedText;
            else textRight.innerHTML = formattedText;

            isTyping = false;
        } else {
            currentDialogueIndex++;
            displayCurrentLine();
        }
    };

    displayCurrentLine();
}

/////////////////////////
//menu e inicio de nível
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
            showCharacterDialogue(mission1Dialogue, () => { startLevel(level); });
        }
        if (level === 1) {
            showCharacterDialogue(mission2Dialogue, () => { startLevel(level); });
        }
        if (level === 2) {
            showCharacterDialogue(mission3Dialogue, () => { startLevel(level); });
        }
        if (level === 3) {
            showCharacterDialogue(mission4Dialogue, () => { startLevel(level); });
        }
        if (level === 4) {
            showCharacterDialogue(mission5Dialogue, () => { startLevel(level); });
        }
        if (level === 5) {
            showCharacterDialogue(mission6Dialogue, () => { startLevel(level); });
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

    //reinicia os atributos do jogador, sendo o local inicial consoante a data do nível
    player.r = currentLevelData.spawn.r;
    player.c = currentLevelData.spawn.c;
    player.checkpoint = { r: player.r, c: player.c };

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

    //mostra o tutorial se o nível possuir um array de tutorial 
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
//camara, luzes e jogador
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
    inventory: [], //guarda IDs de chaves de encriptação (datapads)
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

let activeEnvMesh = null;
let hoveredWallMesh = null;

///////////////////////
//fisica e pathfinding
///////////////////////

function isWalkable(r, c) {
    if (r < 0 || r >= currentLevelData.map.length || c < 0 || c >= currentLevelData.map[0].length) return false;

    const type = currentLevelData.map[r][c];
    if (type === 1 || type === 2 || type === 8 || type === 6 || type === 5) return false;

    //portas trancadas bloqueiam movimento
    if (type === 3) {
        const door = currentLevelData.doors.find(d => d.r === r && d.c === c);
        if (door && !door.unlocked) return false;
    }

    //buracos no mapa exigem uma plataforma movível
    if (type === 4) {
        const plat = currentLevelData.platforms.find(p => p.r === r && p.c === c);
        if (!plat) return false;
    }

    //se o espaço estiver ocupado por drones ou guardas bloqueiam movimento
    if (currentLevelData.guards && currentLevelData.guards.some(g => g.r === r && g.c === c)) return false;
    if (currentLevelData.drones && currentLevelData.drones.some(d => d.active !== false && d.r === r && d.c === c)) return false;

    //Cones de visão bloqueiam movimento 
    const inVision = visionGroup.children.some(v => v.userData.isCone && v.userData.r === r && v.userData.c === c);
    if (inVision) return false;

    return true;
}

//algoritmo BFS para pathfinding
function getPath(startR, startC, targetR, targetC, maxAP) {
    //se o destino final for inválido (parede, inimigo, visão), desiste imediatamente
    if (!isWalkable(targetR, targetC)) return null;
    //se o jogador já está exatamente em cima do destino, não precisa de dar passos
    if (startR === targetR && startC === targetC) return [];

    //'queue' guarda os próximos quadrados a investigar e a rota até chegar a eles
    let queue = [{ r: startR, c: startC, path: [] }];
    //'visited' memoriza as coordenadas por onde já passámos para evitar loops infinitos
    let visited = new Set([`${startR},${startC}`]);

    while (queue.length > 0) {
        //tira o espaço mais antigo da fila para ser analisado
        let curr = queue.shift();

        //se o quadrado atual for o destino desejado, devolve caminho 
        if (curr.r === targetR && curr.c === targetC) return curr.path;

        //limita a distancia baseada nos Pontos de Ação do jogador
        if (curr.path.length >= maxAP) continue;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let d of dirs) {
            //calcula as coordenadas do quadrado vizinho
            let nr = curr.r + d[0];
            let nc = curr.c + d[1];
            //se ainda não visitámos este vizinho E ele é um local seguro para pisar:
            if (!visited.has(`${nr},${nc}`) && isWalkable(nr, nc)) {
                //marca-o como visitado para não voltarmos aqui
                visited.add(`${nr},${nc}`);
                //[...curr.path] copia a rota que fizemos até agora e acrescenta o novo passo no fim
                queue.push({ r: nr, c: nc, path: [...curr.path, { r: nr, c: nc }] });
            }
        }
    }
    return null; //não encontrou rota segura dentro do limite de AP
}

//limpa os highlights quando se põe o rato sobre uma cell e repõe o estado do mapa
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

    //função recursiva para dar um efeito de movimento passo a passo
    function nextStep() {
        if (stepIndex >= path.length) {
            isPlayerMoving = false;

            //o jogador pisou a célula de saída?
            if (currentLevelData.exit && player.r === currentLevelData.exit.r && player.c === currentLevelData.exit.c) {
                pushToLog("EXTRACTION POINT REACHED", false);
                setTimeout(() => {
                    const nextLevel = currentLevelIndex + 1;

                    //se não houver mais níveis (Fim do jogo), volta ao mapa
                    if (!LEVEL_DATA[nextLevel]) {
                        playEndingCutscene();
                        return;
                    }

                    renderer.domElement.style.display = 'none';

                    if (nextLevel === 1) {
                        showCharacterDialogue(mission2Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 2) {
                        showCharacterDialogue(mission3Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 3) {
                        showCharacterDialogue(mission4Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 4) {
                        showCharacterDialogue(mission5Dialogue, () => { startLevel(nextLevel); });
                    } else if (nextLevel === 5) {
                        showCharacterDialogue(mission6Dialogue, () => { startLevel(nextLevel); });
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

        //Calcula o ângulo exato virado para o próximo quadrado!
        player.targetRot = Math.atan2(nextC - player.c, nextR - player.r);

        //move o Jogador
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

////////////////////////////////////////////////////
//geração do mundo fisico,
//lê os dados do nível e insere meshes e objetos 3D.
/////////////////////////////////////////////////////

function buildPhysicalWorld() {
    //Antes de construir um nível novo, temos de limpar o lixo do nível anterior
    physGridGroup.clear();
    visionGroup.clear();

    //Se existir um modelo de jogador do nível anterior, apaga-o da cena principal
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

        //Esconde o braço robótico do modelo base para podermos rodá-lo inicialmente
        currentLevelData.robotArm = envMesh.getObjectByName("RoboticArm");
        if (currentLevelData.robotArm) {
            currentLevelData.robotArmTargetRot = currentLevelData.robotArm.rotation.y;
            currentLevelData.robotArm.visible = false;
        }
    }
    //Nível 2
    else if (currentLevelIndex === 2 && models.level2) {
        envMesh = models.level2.clone();
        envMesh.position.set(0, 0, 0);
        envMesh.updateMatrixWorld(true);
    }
    //Nível 3
    else if (currentLevelIndex === 3 && models.level3) {
        envMesh = models.level3.clone();
        envMesh.position.set(0, 0, 0);
        envMesh.updateMatrixWorld(true);
    }
    else if (currentLevelIndex === 5 && models.level5) {
        envMesh = models.level5.clone();
        envMesh.position.set(0, 0, 0);
        envMesh.updateMatrixWorld(true);
    }

    if (envMesh) {
        activeEnvMesh = envMesh;

        envMesh.traverse((child) => {
            if (child.isMesh && child.material) {

                let isFloor = false;
                let curr = child;
                while (curr && curr !== envMesh) {
                    if (curr.name.includes('Floor')) {
                        isFloor = true;
                        break;
                    }
                    curr = curr.parent;
                }

                //Só aplica o efeito de parede fantasma se a peça não pertencer ao chão
                if (!isFloor) {
                    child.material = child.material.clone();
                    child.material.transparent = true;

                    child.userData.isWall = true;
                    child.userData.originalOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;

                    child.renderOrder = 3;
                }
            }
        });

        physGridGroup.add(envMesh);
    } else {
        activeEnvMesh = null;
    }

    const downVector = new THREE.Vector3(0, -1, 0); //Vetor a apontar diretamente para baixo
    currentLevelData.normalMap = [];

    //geração da grelha
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
                    tileY = hits[0].point.y; //Guarda a altura (Y) deste quadrado

                    //raycaster de 3 pontos: Dispara mais dois lasers ligeiramente ao lado 
                    const hitX = new THREE.Raycaster(new THREE.Vector3(c + 0.1, 10, r), downVector).intersectObject(envMesh, true);
                    const hitZ = new THREE.Raycaster(new THREE.Vector3(c, 10, r + 0.1), downVector).intersectObject(envMesh, true);

                    if (hitX.length > 0 && hitZ.length > 0) {

                        const diffX = Math.abs(hitX[0].point.y - hits[0].point.y);
                        const diffZ = Math.abs(hitZ[0].point.y - hits[0].point.y);

                        //Só inclina se for uma rampa suave (< 0.5 unidades de altura)
                        if (diffX < 0.5 && diffZ < 0.5) {
                            const vecX = new THREE.Vector3().subVectors(hitX[0].point, hits[0].point);
                            const vecZ = new THREE.Vector3().subVectors(hitZ[0].point, hits[0].point);
                            tileNormal.crossVectors(vecZ, vecX).normalize();

                            if (tileNormal.y < 0) tileNormal.negate();
                        } else {
                            //se for demasiado íngreme mantém-se no chão
                            tileNormal.set(0, 1, 0);
                        }
                    }
                }
            }

            //guarda estes dados na memória para que os guardas e a visão saibam onde estão as rampas
            currentLevelData.heightMap[r][c] = tileY;
            currentLevelData.normalMap[r][c] = tileNormal;

            //Tiles
            //Ignora paredes (1), buracos (4) e datapads
            if (type !== 1 && type !== 4 && type !== 6) {
                const isExit = currentLevelData.exit && currentLevelData.exit.r === r && currentLevelData.exit.c === c;

                //cria o quadrado 
                const floor = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.05, 0.95),
                    new THREE.MeshStandardMaterial({
                        color: 0x000000, emissive: 0x00ffcc, emissiveIntensity: 0.5,
                        transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending
                    })
                );
                floor.position.set(c, tileY + 0.05, r); //posiciona de acordo a altura calculada pelo raycast
                floor.renderOrder = 1;
                floor.userData = { r, c, type: 'floor', isHitbox: true };

                //Desenha a borda néon do quadrado
                const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.95));
                const outlineColor = isExit ? 0x00ffcc : 0x5CC9FF; //Destaca o quadrado de saída

                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                    color: outlineColor, transparent: true, opacity: isExit ? 1.0 : 0.1, depthWrite: false
                }));

                line.rotation.x = -Math.PI / 2;
                line.position.y = 0.05;
                line.renderOrder = 2;
                line.raycast = () => { }; //Impede que o rato colida com a linha
                line.userData = { isOutline: true };

                floor.add(line);

                //aplica a inclinação detetada ao quadrado 
                const up = new THREE.Vector3(0, 1, 0);
                floor.quaternion.setFromUnitVectors(up, tileNormal);

                physGridGroup.add(floor);
            }

            //Terminais
            if (type === 2) {
                let terminal;

                const tData = currentLevelData.terminals.find(t => t.r === r && t.c === c);
                const terminalUserData = { r, c, type: 'terminal', data: tData };

                if (models.terminalGltf) {
                    terminal = SkeletonUtils.clone(models.terminalGltf.scene);
                    terminal.position.set(c, tileY, r);

                    terminal.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                            child.userData = terminalUserData;
                        }
                    });
                } else {    //fallback
                    terminal = new THREE.Mesh(
                        new THREE.BoxGeometry(0.6, 0.8, 0.6),
                        new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5, transparent: true })
                    );
                    terminal.position.set(c, tileY + 0.4, r);
                    terminal.userData = terminalUserData;
                }

                terminal.userData = terminalUserData;
                physGridGroup.add(terminal);
            }

            //Portas
            if (type === 3) {
                const physDoorGroup = new THREE.Group();

                const dData = currentLevelData.doors.find(d => d.r === r && d.c === c);

                if (dData && dData.dir === 'vertical') {
                    physDoorGroup.rotation.y = Math.PI / 2;
                } else {
                    physDoorGroup.rotation.y = 0;
                }

                let physDoorLeft, physDoorRight;

                if (models.doorGltf) {
                    physDoorGroup.position.set(c, tileY, r);
                    const doorScene = models.doorGltf.scene.clone();

                    physDoorLeft = doorScene.getObjectByName('left');
                    physDoorRight = doorScene.getObjectByName('right');
                    const physDoorSides = doorScene.getObjectByName('sides');

                    if (physDoorSides) {
                        physDoorSides.userData.isFadableRoot = true;

                        physDoorSides.traverse(child => {
                            if (child.isMesh) {
                                child.userData.isWall = true; //O rato reconhece as laterais como parede
                                child.renderOrder = 3;

                                if (child.material) {
                                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                                    const newMats = mats.map(m => {
                                        const newMat = m.clone();
                                        newMat.transparent = true;
                                        newMat.depthWrite = true;
                                        newMat.needsUpdate = true;
                                        return newMat;
                                    });
                                    child.material = Array.isArray(child.material) ? newMats : newMats[0];
                                }
                            }
                        });
                    }

                    physDoorGroup.add(doorScene);
                } else {
                    //caso o ficheiro falhe a carregar
                    physDoorGroup.position.set(c, tileY + 0.75, r);
                    const doorGeo = new THREE.BoxGeometry(0.5, 1.5, 0.2);
                    const doorMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.2, transparent: true });

                    physDoorLeft = new THREE.Mesh(doorGeo, doorMat);
                    physDoorLeft.position.set(-0.25, 0, 0);
                    physDoorLeft.userData.isWall = true; 

                    physDoorRight = new THREE.Mesh(doorGeo, doorMat.clone());
                    physDoorRight.position.set(0.25, 0, 0);
                    physDoorRight.userData.isWall = true;

                    physDoorGroup.add(physDoorLeft);
                    physDoorGroup.add(physDoorRight);
                }

                physGridGroup.add(physDoorGroup);

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
                    camMesh.position.set(c, 1.2, r); //na parede

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

                    //define rotação consoante a direção da visão
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
                const padGroup = new THREE.Group();
                const padUserData = { r, c, type: 'password' };

                //A base do datapad
                const baseMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.05, 0.4),
                    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, transparent: true })
                );
                baseMesh.userData = padUserData;

                //O ecrã do datapad
                const screenMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.25, 0.35),
                    new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 1, transparent: true })
                );
                screenMesh.rotation.x = -Math.PI / 2;
                screenMesh.position.y = 0.026;
                screenMesh.userData = padUserData;

                //Indicador visual flutuante
                const indicator = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.08),
                    new THREE.MeshBasicMaterial({ color: 0X00ffcc, wireframe: true, transparent: true, opacity: 0.8, depthTest: false })
                );
                indicator.position.y = 0.3;
                indicator.userData = { isIndicator: true, startY: indicator.position.y };

                indicator.renderOrder = 999;

                padGroup.add(baseMesh);
                padGroup.add(screenMesh);
                padGroup.add(indicator);

                //Coloca o tablet pousado na superfície detetada
                padGroup.position.set(c, tileY + 0.025, r);
                padGroup.rotation.y = Math.PI / 6;

                const pData = currentLevelData.passwords.find(p => p.r === r && p.c === c);
                if (pData) pData.mesh = padGroup;

                padUserData.data = pData;
                padGroup.userData = padUserData;
                physGridGroup.add(padGroup);
            }
        }
    }

    //Adiciona tudo à cena do jogo
    scene.add(physGridGroup);

    //Repõe a visibilidade do braço robótico
    if (currentLevelData.robotArm) {
        currentLevelData.robotArm.visible = true;
    }


    //plataformas Móveis 
    currentLevelData.platforms.forEach(plat => {

        //Cria tiles na plataforma
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 0, 0.95),
            new THREE.MeshStandardMaterial({
                color: 0x000000, emissive: 0x00ffcc, emissiveIntensity: 10,
                transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending
            })
        );
        mesh.position.set(plat.c, 0, plat.r);
        mesh.renderOrder = 1;
        mesh.userData = { r: plat.r, c: plat.c, type: 'platform', isHitbox: true };

        //Adiciona os outlines
        const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.95));
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x00aaff, transparent: true, opacity: 0.4, depthWrite: false
        }));
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0;
        line.renderOrder = 2;
        line.raycast = () => { };
        line.userData = { isOutline: true };
        mesh.add(line);

        //adiciona o modelo do contentor apenas se for a plataforma do meio
        if (plat.c === 8 || plat.c === 1) { //hard coded para o nível do container yard
            if (models.platformGltf) {
                const visualModel = SkeletonUtils.clone(models.platformGltf.scene);

                visualModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = true;
                        child.material.depthWrite = true;
                        child.userData.isWall = false;
                    }
                });
                visualModel.position.set(0, 0, 0);

                mesh.add(visualModel);
            }
        }

        plat.mesh = mesh;
        physGridGroup.add(mesh);
    });

    //Drones (não chegaram a ser ussados porque removemos o nível dos TESTING GROUNDS)
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

            //traduz a direção inicial em rotação para o modelo
            let initRot = 0;
            const dir = guard.dirs[guard.dirIdx];
            if (dir === 'up') initRot = Math.PI;
            else if (dir === 'down') initRot = 0;
            else if (dir === 'left') initRot = -Math.PI / 2;
            else if (dir === 'right') initRot = Math.PI / 2;

            let guardMesh;
            //se o ficheiro .glb do guarda carregou com sucesso, usa-o
            if (models.guard) {
                guardMesh = SkeletonUtils.clone(models.guard);
                guardMesh.scale.set(0.5, 0.5, 0.5);
                guardMesh.position.set(guard.c, guardTileY, guard.r);
            } else {
                //fallback
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

    if (models.nyxGltf) {   //físico
        physPlayerModel = SkeletonUtils.clone(models.nyxGltf.scene);
        physPlayerModel.scale.set(1, 1, 1);

        //criar o mixer e reproduzir a animação
        physPlayerMixer = new THREE.AnimationMixer(physPlayerModel);
        const idleClip = models.nyxGltf.animations[0]; //vai buscar a 1ª animação (idle)

        if (idleClip) {
            const action = physPlayerMixer.clipAction(idleClip);
            action.setLoop(THREE.LoopRepeat); //loop
            action.play();
        }

        playerGroup.add(physPlayerModel);
    } else {
        //fallback
        physBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1), new THREE.MeshStandardMaterial({ color: 0x0088ff, transparent: true }));
        physBody.position.y = 0.5;
        playerGroup.add(physBody);
    }


    if (models.netrunnerGltf) { //netspace
        netPlayerModel = SkeletonUtils.clone(models.netrunnerGltf.scene);
        netPlayerModel.scale.set(1, 1, 1);
        netPlayerModel.position.y = 0;

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

        netPlayerMixer = new THREE.AnimationMixer(netPlayerModel);
        const idleClip = models.netrunnerGltf.animations[0];

        if (idleClip) {
            const action = netPlayerMixer.clipAction(idleClip);
            action.setLoop(THREE.LoopRepeat);
            action.play(); 
        }

        playerGroup.add(netPlayerModel);
    } else {
        //Fallback
        netBody1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false }));
        netBody1.position.y = 0.5; netBody1.renderOrder = 1000;

        netBody2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, depthTest: false, depthWrite: false }));
        netBody2.position.y = 0.5; netBody2.renderOrder = 1000;

        playerGroup.add(netBody1);
        playerGroup.add(netBody2);
    }

    //Adiciona o jogador  à cena
    scene.add(playerGroup);
}

/////////////////////////////////////////
///Logica de visão e deteção de inimigos
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
                //desliga a luz se desativada 
                if (cam.mesh) {
                    if (cam.mesh.isGroup) {
                        cam.mesh.traverse(child => {
                            if (child.isMesh && child.name === 'lente_led' && child.material) {
                                child.material.emissive.setHex(0x000000);
                            }
                        });
                    } else {
                        cam.mesh.material.emissive.setHex(0x000000);
                    }
                }
            }
        });
    }

    //area dos drones (não usado)
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
                                new THREE.MeshBasicMaterial({
                                    color: 0xaa00ff,
                                    transparent: true,
                                    opacity: 0.4,
                                    side: THREE.DoubleSide,
                                    depthWrite: true,
                                })
                            );

                            const vY = currentLevelData.heightMap[vR][vC];
                            const vNormal = currentLevelData.normalMap[vR][vC];

                            if (currentLevelData.platforms) {
                                const isPlatformHere = currentLevelData.platforms.some(p => p.r === vR && p.c === vC);
                                if (isPlatformHere) {
                                    vY = 0.05;
                                    vNormal.set(0, 1, 0);
                                }
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
                    new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.4,
                        side: THREE.DoubleSide,
                        depthWrite: true,

                    })
                );

                let vY = 0;
                let vNormal = new THREE.Vector3(0, 1, 0);

                //vai buscar os dados topográficos recolhidos durante a construção do mundo
                //permitindo que a visão se adapte à altura e inclinação de rampas
                if (currentLevelData.map[vR][vC] === 4) {
                    vY = 0;
                } else if (currentLevelData.heightMap && currentLevelData.heightMap[vR]) {
                    vY = currentLevelData.heightMap[vR][vC] || 0;
                    vNormal = currentLevelData.normalMap[vR][vC] || new THREE.Vector3(0, 1, 0);
                }

                if (currentLevelData.platforms) {
                    const isPlatformHere = currentLevelData.platforms.some(p => p.r === vR && p.c === vC);
                    if (isPlatformHere) {
                        vY = 0.05; //ajuste para a altura das plataformas
                        vNormal.set(0, 1, 0);
                    }
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
            damageOverlay.classList.add('simulation'); //muda o efeito de dano para azul 
            damageOverlay.classList.add('active');

            setTimeout(() => {
                damageOverlay.classList.remove('active');
                //remove a cor azul só depois do fade out acabar
                setTimeout(() => damageOverlay.classList.remove('simulation'), 500);
            }, 150);
        }

        //retorna o jogador ao ultimo checkpoint
        player.r = player.checkpoint.r;
        player.c = player.checkpoint.c;

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

        //se o jogador estiver na plataforma, move-o com ela
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
//Geração do netspace
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
let currentArenaRadius = 1; //1 = 3x3 (standard), 2 = 5x5 (último terminal)

//luzes que apenas afetam o netspace
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

//adiciona divs no canto superior direito para representar os andares disponíveis
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

//Replica a área 3x3 (ou 5x5) à volta do terminal como sendo a grelha de Netspace
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
            //remove o modelo 3D antigo da cena, se ainda existir
            if (en.group && en.group.parent) {
                en.group.parent.remove(en.group);
            }
        });
        enemies = []; //limpa o array de inimigos
    }

    selectedTarget = null;

    //define o raio da zona do netspace
    currentArenaRadius = (terminalData.id === "FINAL") ? 2 : 1;

    //guarda quadrados seguros para poder adicionar ICE neles
    let validNetCoords = [];

    //constrói cada andar
    for (let f = 0; f < currentTotalFloors; f++) {
        const group = new THREE.Group();
        group.position.y = -f * FLOOR_SPACING;

        //3x3 quadrados ao redor do terminal ou 5x5 se último terminal
        for (let i = -currentArenaRadius; i <= currentArenaRadius; i++) {
            for (let j = -currentArenaRadius; j <= currentArenaRadius; j++) {
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

                    //guarda a opacidade e emissividade originais para os efeitos do Sonar
                    tile.userData = { x: wC, z: wR, baseOpacity: 0.1, baseEmissive: 0.1 };
                    group.add(tile);

                    //outlines para cada cell
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
        let term;
        const termUserData = { isTerminal: true, c: terminalData.c, r: terminalData.r, baseOpacity: 1.0, baseEmissive: 0.5 };

        if (models.terminalGltf) {
            term = SkeletonUtils.clone(models.terminalGltf.scene);
            term.position.set(terminalData.c, 0, terminalData.r);

            term.traverse((child) => {
                if (child.isMesh) {
                    child.renderOrder = 1000;
                    child.userData = termUserData;
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = true;
                        child.material.opacity = 1.0;
                        child.material.depthTest = true;
                        child.material.depthWrite = true;
                    }
                }
            });
        } else { //fallback
            term = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 0.6),
                new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5, transparent: true, opacity: 1.0, depthTest: false, depthWrite: false })
            );
            term.position.set(terminalData.c, 0.4, terminalData.r);
            term.renderOrder = 1000;
            term.userData = termUserData;
        }

        term.userData = termUserData;
        group.add(term);

        scene.add(group);
        netFloorGroups.push(group);
    }

    //pega nos quadrados seguros e adiciona ICE 
    if (validNetCoords.length > 0) {
        //filtra os quadrados para garantir que o inimigo não nasce em cima do próprio terminal
        let outerTiles = validNetCoords.filter(t => t.x !== terminalData.c || t.z !== terminalData.r);

        //se o terminal estiver num beco sem saída e não houver "outerTiles", usa o que houver
        if (outerTiles.length === 0) outerTiles = [...validNetCoords];

        //função que tira um tile aleatório e remove-o da lista
        const pullRandomSpawn = () => {
            if (outerTiles.length === 0) return null; //previne erros se faltarem quadrados
            const randomIndex = Math.floor(Math.random() * outerTiles.length);
            return outerTiles.splice(randomIndex, 1)[0]; //return splice remove e devolve o item
        };

        for (let f = 1; f < currentTotalFloors; f++) {

            //30% de probabilidade de aparecerem 2 ICE no terminal do final. Caso contrário, apenas 1.
            let iceCount = 1;
            if (terminalData.id === "FINAL") {
                iceCount = Math.random() < 0.30 ? 2 : 1;
            }

            for (let s = 0; s < iceCount; s++) {
                const spawnPoint = pullRandomSpawn();
                if (spawnPoint) {
                    spawnICE(f, spawnPoint.x, spawnPoint.z);
                }
            }
        }
    }

    //repõe os AP do jogador quando entra
    player.netAp = player.maxNetAp;
    document.getElementById('net-ap-display').innerText = player.netAp;

    //o jogador começa sempre no andar 0
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

    //os ICE tentam carregar o modelo 3D atribuído
    //se por acaso o ficheiro GLB não tiver sido carregado (ou houver falha)
    //têm um fallback e geram uma forma geométrica básica 

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

            const mixer = new THREE.AnimationMixer(b);
            const idleClip = models.krakenGltf.animations[0];
            if (idleClip) {
                const action = mixer.clipAction(idleClip);
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }

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

    //força os ICE a ficar desenhados por cima do ambiente 3D físico
    b.traverse((child) => {
        if (child.isMesh) {
            child.renderOrder = 1000;
            if (child.material) {
                child.material.depthTest = true;
                child.material.depthWrite = true;
                child.material.transparent = true;

                //ao invés de ter de alterar tudo em blender defino as propriedades de cor aqui
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

    //guardamos a luz no grupo para a podermos pulsar na animação
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
//interação e turn logic
/////////////////////////

//alterna entre o mundo físico e netspace
function toggleMode(mode) {
    currentMode = mode;
    const isNet = mode === 'NETRUN';

    const toggleDepth = (m) => {
        if (m.material) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach(mat => mat.depthWrite = !isNet);
        }
    };

    physGridGroup.traverse(toggleDepth);
    visionGroup.traverse(toggleDepth);

    clearHighlights();
    hoveredTile = null;

    //transições de UI através de toggles de CSS 
    document.querySelectorAll('.net-only').forEach(el => el.style.display = isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');
    document.querySelectorAll('.phys-only').forEach(el => el.style.display = !isNet ? (el.tagName === 'DIV' ? 'flex' : 'block') : 'none');

    const logCurrent = document.getElementById('log-current');
    isNet ? pushToLog("CONNECTION ESTABLISHED. BYPASS SYSTEM CORE.", true) : pushToLog("AVOID DETECTION.", false);
    logCurrent.className = isNet ? 'log-current netrun' : 'log-current';

    //guarda a posição atual como checkpoint quando se sai de um terminal
    if (!isNet && player.checkpoint) {
        player.checkpoint.r = player.r;
        player.checkpoint.c = player.c;
    }
}

//sistema de Dano
function takeDamage(amt) {
    if (player.hp <= 0) return;

    //verifica se o jogador tem scales
    if (player.statuses.scalesBarrier > 0) {
        player.statuses.scalesBarrier--; //consome a carga de scales independentemente de funcionar ou falhar
        
        //30% de probabilidade de o escudo falhar
        if (Math.random() < 0.30) {
            pushToLog(`SCALES.EXE FAILED TO BLOCK DAMAGE! (${player.statuses.scalesBarrier} SCALES LEFT)`, true);
        } else {
            pushToLog(`SCALES.EXE ABSORBED DAMAGE! (${player.statuses.scalesBarrier} SCALES LEFT)`, true);
            return; //bloqueio de dano
        }
    }

    //subtrai a vida e atualiza a healthbar
    player.hp -= amt;
    document.getElementById('hp-bar').style.width = (player.hp / player.maxHp * 100) + "%";

    pushToLog(`NEURAL SPIKE! -${amt} HP`, true);

    const damageOverlay = document.getElementById('damage-overlay');
    if (damageOverlay) {
        damageOverlay.classList.add('active');
        //remove a classe logo a seguir para o CSS tratar do fade-out
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
                //Se for um \n, muda de linha com um <br>, senão escreve a letra
                bsodText.innerHTML += msg.charAt(i) === '\n' ? '<br>' : msg.charAt(i);
                i++;
                setTimeout(typeBSOD, 50); //Velocidade do teclado
            } else {
                //depois de acabar de escrever, espera 3 segundos e reinicia o nível atual
                setTimeout(() => {
                    startLevel(currentLevelIndex);
                }, 2000);
            }
        }

        typeBSOD();
    }
}

/////////////////////////////////
//sistema de triggers do tutorial
/////////////////////////////////
function checkNetrunTriggers() {
    //só funciona se estivermos ativamente num terminal que tenha triggers configurados
    if (activeTerminal && activeTerminal.triggers) {

        //procura um trigger válido para o andar atual.
        //se o trigger não especificar 'r' ou 'c', ele dispara em qualquer quadrado desse andar!
        const activeTrigger = activeTerminal.triggers.find(t =>
            t.floor === player.floor &&
            (t.r === undefined || t.r === player.r) &&
            (t.c === undefined || t.c === player.c) &&
            !t.fired
        );

        if (activeTrigger) {
            activeTrigger.fired = true;

            //altera o state para tutorial
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

    if (activeEnvMesh) {
        let hitWall = false;
        let hitObject = null;

        const envHits = raycaster.intersectObjects(physGridGroup.children, true);

        if (envHits.length > 0) {
            //apanha o primeiro objeto que encontrar com a data isWall
            const hit = envHits.find(i => i.object.isMesh && i.object.userData && i.object.userData.isWall);

            if (hit) {
                hitWall = true;
                let topObject = hit.object;

                //Se o que tocámos faz parte de uma porta, agrupa a porta toda!
                let foundFadable = false;
                let curr = hit.object;
                while (curr && curr !== physGridGroup && curr !== activeEnvMesh) {
                    if (curr.userData && curr.userData.isFadableRoot) {
                        topObject = curr; //seleciona apenas as laterais
                        foundFadable = true;
                        break;
                    }
                    curr = curr.parent;
                }

                //se for o cenário ou mobília vai buscar o topo do grupo desse objeto
                if (!foundFadable) {
                    while (topObject.parent && topObject.parent !== activeEnvMesh && topObject.parent !== physGridGroup && topObject.parent.type !== 'Scene') {
                        topObject = topObject.parent;
                    }
                }

                hitObject = topObject;
            }
        }

        //diz ao animate() para desaparecer o grupo inteiro (ou voltar a aparecer)
        if (hitWall) {
            hoveredWallMesh = hitObject;
        } else {
            hoveredWallMesh = null;
        }
    }

    //verifica que tiles o raycast intersetou
    const intersects = raycaster.intersectObjects(physGridGroup.children, true);
    const hitTile = intersects.find(i => i.object.userData && i.object.userData.r !== undefined && i.object.userData.c !== undefined);

    if (hitTile) {
        const data = hitTile.object.userData;

        //se não for um tile da grelha ignora
        if (data.r === undefined || data.c === undefined) return;

        //só recalcula a rota se o rato mudou efetivamente para uma tile novo
        if (hoveredTile !== `${data.r},${data.c}`) {
            hoveredTile = `${data.r},${data.c}`;
            clearHighlights(); //apaga o path anterior

            const type = currentLevelData.map[data.r][data.c];
            //ignora paredes e terminais
            if (type !== 1 && type !== 2) {

                //se o jogador não tiver AP, projeta o caminho como se já tivesse o AP do próximo turno
                const projectedAp = player.ap > 0 ? player.ap : player.maxAp;
                currentPath = getPath(player.r, player.c, data.r, data.c, projectedAp);

                //se houver uma rota segura, ilumina os quadrados
                if (currentPath && currentPath.length > 0) {
                    physGridGroup.children.forEach(child => {
                        if (child.userData.type === 'floor' || child.userData.type === 'platform') {
                            const inPath = currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);
                            if (inPath) {
                                //fica Laranja se for um movimento do próximo turno, Ciano se for do atual
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

    //mundo físico
    if (currentMode === 'PHYSICAL') {
        const intersects = raycaster.intersectObjects(physGridGroup.children, true);

        //ignora as paredes e encontra o primeiro objeto (chão/terminal/datapad) com coordenadas
        const hitTile = intersects.find(i => i.object.userData && i.object.userData.r !== undefined && i.object.userData.c !== undefined);

        if (hitTile) {
            const data = hitTile.object.userData;
            const type = currentLevelData.map[data.r][data.c];

            if (type === 1) return;
            if (type === 4 && data.type !== 'platform') return;

            //interagir com terminais
            if (type === 2) {
                //necessário estar adjacente
                const dist = Math.abs(player.r - data.r) + Math.abs(player.c - data.c);
                if (dist <= 1) {
                    const tData = currentLevelData.terminals.find(t => t.r === data.r && t.c === data.c);
                    if (tData) { //Jack In: entra em netspace
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

            //lógica de Movimento
            if (currentPath && currentPath.length > 0) {
                const lastStep = currentPath[currentPath.length - 1];

                //verifica se clicámos exatamente no fim dessa rota planeada
                if (lastStep.r === data.r && lastStep.c === data.c) {

                    //se o jogador tiver 0 AP, passa o turno automaticamente antes de se mexer
                    if (player.ap <= 0) {
                        pushToLog("OUT OF AP. AUTO-ENDING TURN...", false);

                        const startR = player.r;
                        const startC = player.c;

                        //termina o turno 
                        document.getElementById('btn-end-turn').click();

                        const savedPath = currentPath;
                        currentPath = null;
                        clearHighlights();

                        setTimeout(() => {
                            //verifica se o jogador sobreviveu ao turno sem ser apanhado
                            const inVision = visionGroup.children.some(v => v.userData.r === player.r && v.userData.c === player.c);
                            if (player.r === startR && player.c === startC && !inVision) {
                                executePathMovement(savedPath);
                            }
                        }, 400);

                        return;
                    }

                    //se tinha AP normal, o movimento é imediato
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
        const intersects = raycaster.intersectObjects(netFloorGroups[player.floor].children, true);
        //encontra o primeiro objeto útil (terminal/chão)
        const hit = intersects.find(i => i.object.userData && (i.object.userData.isTerminal || i.object.userData.x !== undefined));
        if (hit) {
            const data = intersects[0].object.userData;

            //Terminal
            if (data.isTerminal) {
                if (player.floor === currentTotalFloors - 1) {

                    //não pode completar o terminal se estiver em combate
                    const inCombat = enemies.some(en => en.data.active && en.data.isAlerted);
                    if (inCombat) {
                        pushToLog("ACCESS DENIED: COMBAT DETECTED. PURGE ICE FIRST.", true);
                        return;
                    }

                    const nextLevel = currentLevelIndex + 1;
                    if (!LEVEL_DATA[nextLevel]) {
                        //se for o último nível, dá play ao bad ending
                        playBadEndingCutscene();
                        return;
                    }

                    let successMessage = "";

                    //executa a ação programada no nível para este terminal

                    if (activeTerminal.action === "unlock_door") {
                        const targetDoor = currentLevelData.doors.find(d => d.id === activeTerminal.targetId);
                        if (targetDoor) {
                            targetDoor.unlocked = true;

                            //deprecated
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

                    } else if (activeTerminal.action === "rotate_arm") {    //primeiro nível
                        if (currentLevelData.robotArm) {
                            currentLevelData.robotArmTargetRot -= Math.PI; //roda o braço
                            currentLevelData.map[8][7] = 0; //liberta as células na data
                            currentLevelData.map[7][7] = 0;
                        }
                        successMessage = "CORE COMPROMISED. MACHINERY OVERRIDE ENGAGED.";

                    } else if (activeTerminal.action === 'disable_drone') { //não usado devido à remoção do nível 4
                        //lista de targets
                        const targets = Array.isArray(activeTerminal.targetId) ? activeTerminal.targetId : [activeTerminal.targetId];

                        let disabledCount = 0;

                        //percorre todos os IDs de drones dados pelo terminal
                        targets.forEach(id => {
                            const targetDrone = currentLevelData.drones.find(d => d.id === id);
                            if (targetDrone) {
                                targetDrone.active = false;

                                //efeito visual de desligar
                                if (targetDrone.mesh) {
                                    targetDrone.mesh.material.emissive.setHex(0x111111);
                                    targetDrone.mesh.material.opacity = 0.3;
                                    targetDrone.mesh.position.y = 0.1; //drone cai no chão
                                }
                                disabledCount++;
                            }
                        });

                        if (disabledCount > 0) {
                            pushToLog(`CORE COMPROMISED. ${disabledCount} AUTOMATED DRONE OFFLINE.`, true);
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

            //move 1 cell de cada vez
            if (dist === 1) {
                //passiva do Scorpion (se estiver vivo no mesmo andar, impede de andar)
                if (player.statuses.scorpionActive) {
                    pushToLog("SCORPION ICE: MOVEMENT ROOTED!", true);
                    return;
                }

                player.targetRot = Math.atan2(data.x - player.c, data.z - player.r);

                //move e consome NA
                player.c = data.x;
                player.r = data.z;
                selectedTarget = null; //o movimento anula a seleção do alvo
                consumeNetAction(1);

            } else if (dist > 1) {
                pushToLog("INVALID MOVE. SELECT ADJACENT TILE.", true);
            }
        }
    }
});

//barra de espaço passa o turno
window.addEventListener('keydown', (e) => {
    if (appState !== 'GAME') return;

    if (e.code === 'Space') {
        e.preventDefault();  //impede o ecrã de deslizar para baixo no browser
        document.getElementById('btn-end-turn').click();
    }
});

///////////////////////////////
//gestão de turnos e IA de ICE
///////////////////////////////

//remove NA. Quando chega a 0 acaba o turno e é a vez do inimigo agir.
function consumeNetAction(cost = 1) {
    player.netAp -= cost;
    document.getElementById('net-ap-display').innerText = player.netAp;

    //turno do inimigo inicia quando as ações esgotam
    if (player.netAp <= 0) {
        triggerNetAction();

        //repõe os Pontos de Ação descontando a penalidade do Wisp se existir
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

        //sistema de aggro
        if (en.data.floor === player.floor) en.data.isAlerted = true;

        if (en.data.isAlerted && en.data.floor === player.floor) {

            //ativa passivas
            if (en.data.type === 'Kraken') player.statuses.krakenActive = true;
            if (en.data.type === 'Scorpion') player.statuses.scorpionActive = true;

            //ICE não podem sair da grelha nem pisar no terminal
            const isValidIceTile = (x, z) => {
                if (z < 0 || z >= currentLevelData.map.length || x < 0 || x >= currentLevelData.map[0].length) return false;

                if (activeTerminal && (Math.abs(x - activeTerminal.c) > currentArenaRadius || Math.abs(z - activeTerminal.r) > currentArenaRadius)) return false;

                if (activeTerminal && x === activeTerminal.c && z === activeTerminal.r) return false;

                const type = currentLevelData.map[z][x];
                if (type === 1 || type === 4) return false;

                return true;
            };

            //pathfinding do ICE até ao jogador
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

            //se estiver adjecente ao jogador ataca
            if (newDistX <= 1 && newDistZ <= 1) {
                takeDamage(1);

                //lógica de efeitos de ataque por classe de ICE
                if (en.data.type === 'Asp') {
                    //escolhe uma das habilidades de batalha para desativar
                    const targetable = ['swordfish', 'harpoon', 'scales', 'swim'];
                    const hitProg = targetable[Math.floor(Math.random() * targetable.length)];

                    player.statuses.disabledPrograms[hitProg] = 3;
                    pushToLog(`ASP VIRUS: ${hitProg.toUpperCase()}.EXE CORRUPTED!`, true);

                } else if (en.data.type === 'Wisp') {
                    //remove NA no próximo turno
                    if (player.statuses.netApPenalty < 1) {
                        player.statuses.netApPenalty = 1;
                        pushToLog("WISP HIT: NET ACTION DRAINED!", true);
                    }
                } else if (en.data.type === 'Hellhound') {
                    //faz o jogador arder por 4 turnos
                    player.statuses.burning = 4;
                    pushToLog("HELLHOUND: NEURAL FIRE DETECTED!", true);
                }

                //faz o ICE brilhar durante 200ms
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

//atualiza a representação visual da architecture
function updateNetUI() {
    const sc = document.getElementById('stack-container');
    sc.innerHTML = '';

    for (let i = 0; i < currentTotalFloors; i++) {
        const layer = document.createElement('div');
        layer.className = 'stack-layer';
        layer.id = `layer-${i}`;

        //ilumina o andar onde o jogador se encontra
        if (i === player.floor) {
            layer.classList.add('active');
        }

        //fica vermelho se houver um ICE acordado a vigiar esse andar
        const enemyPresent = enemies.some(en => en.data.active && en.data.floor === i && en.data.isAlerted);
        if (enemyPresent) {
            layer.classList.add('detected');
        }

        //tranca o andar se o núcleo precise de um Datapad para entrar
        const isLocked = (i === currentTotalFloors - 1) && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith);
        if (isLocked) {
            layer.classList.add('locked');
        }

        sc.appendChild(layer);
    }
}

//verificação antes de o jogador andar para cima/baixo num terminal (Ascend/Dive)
function canChangeFloor(targetFloor) {
    //evita andar para cima de um monstro que esteja por cima/baixo do jogador
    const isIceOccupied = enemies.some(en => en.data.active && en.data.floor === targetFloor && en.data.x === player.c && en.data.z === player.r);
    if (isIceOccupied) return false;

    //impede descer para a posição do terminal (failsafe porque não se pode ir para a posição do terminal em primeiro lugar)
    if (targetFloor === currentTotalFloors - 1 && player.c === activeTerminal.c && player.r === activeTerminal.r) return false;

    return true;
}

//botão ASCEND (subir para o andar anterior)
document.getElementById('btn-up').onclick = () => {
    //kraken impede mudar de andar
    if (player.statuses.krakenActive) { pushToLog("KRAKEN ICE: ELEVATION BLOCKED!", true); return; }

    //verifica se não estamos já no topo (0) e se o tile de destino no andar de cima está livre
    if (player.floor > 0 && canChangeFloor(player.floor - 1)) {
        player.floor--;

        //ICE que já esteja alerta, perseguem o jogador para o novo andar
        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        //alerta qualquer ICE no novo andar
        enemies.forEach(en => { if (en.data.active && en.data.floor === player.floor) en.data.isAlerted = true; });

        //atualiza o UI e consome NA
        updateNetUI();
        consumeNetAction(1);

        checkNetrunTriggers();
    }

    //bloqueado por ICE
    else if (player.floor > 0) {
        pushToLog("ERROR: ELEVATION BLOCKED BY ICE.", true);
    }
};

//botão DIVE (descer para o andar seguinte)
document.getElementById('btn-down').onclick = () => {
    //kraken impede mudar de andar
    if (player.statuses.krakenActive) { pushToLog("KRAKEN ICE: DIVE BLOCKED!", true); return; }

    //se esse terminal exige uma chave que o jogador não tem no inventário 
    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        pushToLog("ERROR: DECRYPTION KEY REQUIRED TO ACCESS CORE.", true);
        return;
    }

    //verifica se não estamos já no fundo e se o tile de destino no andar de baixo está livre
    if (player.floor < currentTotalFloors - 1 && canChangeFloor(player.floor + 1)) {
        player.floor++;

        //ICE que já esteja alerta, perseguem o jogador para o novo andar
        enemies.forEach(en => { if (en.data.active && en.data.isAlerted) en.data.floor = player.floor; });

        //alerta qualquer ICE no novo andar
        enemies.forEach(en => { if (en.data.active && en.data.floor === player.floor) en.data.isAlerted = true; });

        //atualiza o UI e consome NA
        updateNetUI();
        consumeNetAction(1);
        checkNetrunTriggers();
    }

    //bloqueado por ICE
    else if (player.floor < currentTotalFloors - 1) {
        pushToLog("ERROR: DIVE BLOCKED BY ICE.", true);
    }
};

///////////////////////////////////////
//habilidades e programas de netrunning
///////////////////////////////////////

//SONAR.EXE: Revela todos os andares
document.getElementById('btn-sonar').onclick = () => {
    if (currentMode !== 'NETRUN' || isScanning) return;

    isScanning = true;
    pushToLog("SONAR.EXE: SCANNING ARCHITECTURE...", true);

    //percorre todos os inimigos e ilumina os andares onde eles se encontram
    enemies.forEach(en => {
        if (en.data.active) {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.add('scanning-active'); //ativa a animação de pulsação CSS
                layer.classList.add('detected');        //pinta o andar de vermelho
            }
        }
    });

    //o efeito dura 3 segundos antes de desaparecer
    setTimeout(() => {
        isScanning = false;
        enemies.forEach(en => {
            const layer = document.getElementById(`layer-${en.data.floor}`);
            if (layer) {
                layer.classList.remove('scanning-active');
                //mantém o realce apenas se o inimigo já estivesse alerta naturalmente
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

    //verifica se o programa foi corrompido por um Asp
    if (player.statuses.disabledPrograms.scales > 0) {
        pushToLog(`ERROR: SCALES.EXE REBOOTING (${player.statuses.disabledPrograms.scales} TURNS)`, true);
        return;
    }

    //absorve os próximos 2 ataques recebidos
    player.statuses.scalesBarrier = 2;
    pushToLog("SCALES.EXE: ABSORB NEXT 2 SPIKES.", true);

    consumeNetAction(1);
};

//SWIM.EXE: 30% de chance de fugir a inimigos para o nível inferior
document.getElementById('btn-swim').onclick = () => {
    if (currentMode !== 'NETRUN') return;
    if (player.statuses.krakenActive) { pushToLog("SWIM.EXE FAILED: KRAKEN ROOTED YOU.", true); return; }

    //verifica se o programa foi corrompido por um Asp
    if (player.statuses.disabledPrograms.swim > 0) {
        pushToLog(`ERROR: SWIM.EXE REBOOTING (${player.statuses.disabledPrograms.swim} TURNS)`, true);
        return;
    }

    //o jogador não pode mergulhar para um andar trancado se não tiver a chave
    if (player.floor + 1 === currentTotalFloors - 1 && activeTerminal.lockedWith && !player.inventory.includes(activeTerminal.lockedWith)) {
        pushToLog("SWIM.EXE FAILED: DECRYPTION KEY REQUIRED.", true);
        return;
    }

    if (player.floor < currentTotalFloors - 1) {
        //verifica se a cell não está ocupada
        if (!canChangeFloor(player.floor + 1)) {
            pushToLog("SWIM.EXE FAILED: CELL OCCUPIED.", true); return;
        }

        if (Math.random() > 0.30) {
            pushToLog("SWIM.EXE FAILED: EVASION UNSUCCESSFUL. ICE INTERCEPTED.", true);
            consumeNetAction(1); //consome 1 NetAction na mesma
            return;
        }

        player.floor++;

        //foge dos inimigos e perde o aggro
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
        //fallback
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

///////////////////////
//botão de fim de turno
///////////////////////

document.getElementById('btn-end-turn').onclick = () => {
    //impede o fim do turno se o jogador ainda estiver a meio de uma animação de movimento
    if (isPlayerMoving) return;

    if (currentMode === 'PHYSICAL') {
        //repõe os Pontos de Ação (AP) físicos
        player.ap = player.maxAp;
        document.getElementById('ap-display').innerText = player.ap;

        //atualiza o estado de todos os guardas
        if (currentLevelData.guards) {
            currentLevelData.guards.forEach(guard => {
                if (guard.path) {
                    //guardas em movimento avançam para o próximo passo da sua lista
                    guard.pathIdx = (guard.pathIdx + 1) % guard.path.length;
                    const step = guard.path[guard.pathIdx];

                    guard.r = step.r;
                    guard.c = step.c;

                    //define a rotação do modelo 3D baseada na direção do path
                    if (step.dir === 'up') guard.targetRot = Math.PI;
                    else if (step.dir === 'down') guard.targetRot = 0;
                    else if (step.dir === 'left') guard.targetRot = -Math.PI / 2;
                    else if (step.dir === 'right') guard.targetRot = Math.PI / 2;

                    guard.dirs = [step.dir];
                    guard.dirIdx = 0;
                } else if (guard.dirs) {
                    //guardas estáticos apenas rodam para a próxima direção configurada
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

function playEndingCutscene() {
    renderer.domElement.style.display = 'none';

    const script = [
        { side: "right", name: "Eel", text: "Wait, Nyx. What are you doing? \nYou didn't get the data!" },
        { side: "left", name: "Nyx", text: "It's a trap." },
        { side: "left", name: "Nyx", text: "The ICE was too predictable. The physical patrols left deliberate blind spots so we could get through." },
        { side: "left", name: "Nyx", text: "They wanted us to get this far. They were watching." },
        { side: "right", name: "Snapper", text: "Are you crazy? We are so close! Turn back!" },
        { side: "left", name: "Nyx", text: "I'm getting out for your sake too, if they get me they can get you guys as well." },
        { side: "right", name: "SYSTEM", text: "WARNING: \nCONNECTION TERMINATED." },
    ];

    //usa a função padrão de diálogos e volta ao início quando terminar
    showCharacterDialogue(script, () => {
        location.reload();
    });
}

function playBadEndingCutscene() {
    renderer.domElement.style.display = 'none';

    const script = [
        { side: "right", name: "SYSTEM", text: "SYSTEM OVERRIDE SUCCESSFUL.\nACCESSING MAINFRAME..." },
        { side: "right", name: "SYSTEM?", text: "TRACE COMPLETE. TARGET IS ISOLATED IN THE CONTROL TOWER" },
        { side: "right", name: "SYSTEM?", text: "SECURITY TEST COMPLETE. VULNERABILITIES LOGGED." },
        { side: "right", name: "SYSTEM?", text: "TANK YOU FOR YOUR PARTICIPATION. GOODBYE RUNNER" },
        { side: "right", name: "Eel", text: "SHIT IT'S A TRAP! GET THE DATA AND SCRAM!" },
        { side: "right", name: "SYSTEM", text: "WARNING: \nDOWNLOAD BLOCKED." },
        { side: "right", name: "Snapper", text: "FORGET THE DATA GET OUT OF THERE!" },
        { side: "right", name: "SYSTEM", text: "WARNING: \nDOOR BREACH DETECTED IN PHYSICAL SPACE." },
        { side: "right", name: "GUARD", text: "I found the target. Roger. Opening fire!" },
        { side: "right", name: "SYSTEM", text: "WARNING: \nVITALS CRITICAL..." },
        { side: "right", name: "SYSTEM", text: "WARNING: \nCONNECTION TERMINATED." },
    ];

    //usa a função padrão de diálogos e volta ao início quando terminar
    showCharacterDialogue(script, () => {
        location.reload();
    });
}

////////////////////////////////////////
//responsável estritamente pelo tweening
////////////////////////////////////////

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (netPlayerMixer) {
        netPlayerMixer.update(delta);
    }

    if (physPlayerMixer) {
        physPlayerMixer.update(delta);
    }

    if (swordfishMixer) {
        swordfishMixer.update(delta);
    }

    if (typeof activeSwordfish !== 'undefined' && activeSwordfish) {
        const age = Date.now() - activeSwordfish.userData.spawnTime;

        activeSwordfish.traverse((child) => {
            if (child.isMesh && child.material) {
                if (age < 150) {
                    //fade in 
                    child.material.opacity = age / 150;
                } else if (age > 600) {
                    //fade out 
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
                        //fade out 
                        mat.opacity = Math.max(0, 1.0 - ((age - 200) / 250));
                    } else {
                        mat.opacity = 1.0;
                    }
                });
            }
        });
    }

    //só processa animações se o jogador estiver num nível ou tutorial
    if (appState !== 'GAME' && appState !== 'TUTORIAL') return;

    //define a opacidade base do mundo físico: 
    //se o jogador estiver Netrunning, o mundo real fica quase invisível (0.15)
    const targetPhysOp = currentMode === 'NETRUN' ? 0.05 : 1.0;

    //tweening visual 
    physGridGroup.children.forEach(child => {
        let targetOp = targetPhysOp;

        //verifica se este objeto é o terminal em que o jogador está de momento
        const isActiveTerminal = (currentMode === 'NETRUN' && child.userData.type === 'terminal' && child.userData.data && activeTerminal && child.userData.data.id === activeTerminal.id);

        child.traverse(m => {
            if ((m.isMesh || m.isLine) && m.material) {
                const mats = Array.isArray(m.material) ? m.material : [m.material];

                mats.forEach(mat => {
                    //garante que todos os materiais suportam transparência para as transições
                    if (mat.transparent === false) mat.transparent = true;

                    let finalTargetOp = targetOp;

                    //verifica se a peça atual faz parte do grupo que o rato está acima
                    let isHovered = false;
                    let curr = m;
                    while (curr) {
                        if (curr === hoveredWallMesh) {
                            isHovered = true;
                            break;
                        }
                        curr = curr.parent;
                    }

                    //o terminal ativo no Netspace deve manter-se 100% visível
                    if (isActiveTerminal) {
                        finalTargetOp = 1.0;
                    }
                    else if (isHovered) {
                        finalTargetOp = 0.05;
                    }
                    //tiles
                    else if (m.userData.isHitbox) {
                        const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;
                        const inPath = currentPath && currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);

                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.3; //no Netspace, o chão físico é quase transparente
                        } else if (isExit || inPath) {
                            finalTargetOp = 0.5; //realça a saída ou o caminho planeado
                        } else {
                            finalTargetOp = 0.0; //em chão normal apenas a borda aparece
                        }
                    }
                    //outlines
                    else if (m.userData.isOutline) {
                        if (currentMode === 'NETRUN') {
                            finalTargetOp = 0.0; //em Netspace remove os outlines de tiles no mundo fisico
                        } else {
                            const isExit = currentLevelData.exit && currentLevelData.exit.r === child.userData.r && currentLevelData.exit.c === child.userData.c;

                            //verifica se este quadrado faz parte da rota planeada
                            const inPath = currentPath && currentPath.some(p => p.r === child.userData.r && p.c === child.userData.c);

                            if (isExit) {
                                finalTargetOp = 1.0;
                            } else if (inPath) {
                                finalTargetOp = 0.7; //a linha fica realçada se estiver no caminho do jogador
                            } else {
                                finalTargetOp = 0.4;
                            }
                        }
                    }

                    //aproxima a opacidade atual da opacidade desejada em 10% por frame
                    if (mat.opacity !== undefined) {
                        let fadeSpeed = 0.1;
                        if (m.userData.isWall) {
                            if (finalTargetOp > mat.opacity) {
                                fadeSpeed = 0.10; //fade in mais lento
                            } else {
                                fadeSpeed = 0.20; //fade out muito mais rápido
                            }
                        }

                        mat.opacity += (finalTargetOp - mat.opacity) * fadeSpeed;


                    }
                    //ajusta o brilho baseado na opacidade
                    if (mat.emissive && !m.isLine) {
                        const maxGlow = (child.userData && child.userData.type === 'camera') ? 2.0 : 0.5;
                        mat.emissiveIntensity = mat.opacity * maxGlow;
                    }
                });
            }
        });
    });

    //alteração da opacidade do corpo físico do jogador
    if (physBody && physBody.material) {
        physBody.material.opacity += (targetPhysOp - physBody.material.opacity) * 0.1;
    }

    //se o modelo 3D carregou, aplica a opacidade a todas as peças dele
    if (physPlayerModel) {
        physPlayerModel.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.opacity += (targetPhysOp - child.material.opacity) * 0.1;
            }
        });
    }

    //suaviza a alteração da opacidade dos cones de visao ds inimigos
    visionGroup.children.forEach(child => {
        if (child.material) {
            const targetOp = child.userData.isCone
                ? (currentMode === 'NETRUN' ? 0.05 : 0.4)
                : targetPhysOp;
            child.material.opacity += (targetOp - child.material.opacity) * 0.1;
        }
    });

    //movimento suave do jogador
    playerGroup.position.x += (player.c - playerGroup.position.x) * 0.2;
    playerGroup.position.z += (player.r - playerGroup.position.z) * 0.2;

    //rotação do jogador
    if (player.targetRot !== undefined) {
        //calcula a distância mais curta para a nova rotação
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

        if (currentLevelData.platforms) {
            const activePlatform = currentLevelData.platforms.find(p => p.r === player.r && p.c === player.c);
            if (activePlatform && activePlatform.mesh) {
                targetY = activePlatform.mesh.position.y;
            }
        }
    }
    playerGroup.position.y += (targetY - playerGroup.position.y) * 0.2;

    //gestão de visibilidade do jogador fisico ou virtual
    if (currentMode === 'NETRUN') {
        if (physBody) physBody.visible = false;
        if (physPlayerModel) physPlayerModel.visible = false; //esconde o modelo físico

        if (netPlayerModel) netPlayerModel.visible = true;
        if (netBody1) netBody1.visible = true;
        if (netBody2) {
            netBody2.visible = true;
            netBody2.rotation.y += 0.02;
        }

        //efeito visual de ataque
        netSlashEffect.visible = true;
        if (netSlashMat.opacity > 0) {
            netSlashEffect.scale.x += 0.2;
            netSlashEffect.scale.y += 0.2;
            netSlashMat.opacity -= 0.05;
        }

        //segue o jogador com uma luz virtual de modo a manter a iluminação constante
        netLight.position.set(playerGroup.position.x, playerGroup.position.y + 5, playerGroup.position.z);
        netLight.visible = true;
    } else {
        //no mundo fisico retira a visibilidade aos efeitos de netspace
        if (physBody) physBody.visible = true;
        if (physPlayerModel) physPlayerModel.visible = true; //mostra o modelo físico

        if (netPlayerModel) netPlayerModel.visible = false;
        if (netBody1) netBody1.visible = false;
        if (netBody2) netBody2.visible = false;
        netSlashEffect.visible = false;
        netLight.visible = false;
    }

    //movimento suave da câmara
    camera.position.x += ((player.c + 10) - camera.position.x) * 0.1;
    camera.position.z += ((player.r + 10) - camera.position.z) * 0.1;
    camera.position.y += (10 - camera.position.y) * 0.1;

    if (cameraShakeTime > 0) {
        cameraShakeTime -= delta;

        //aplica um desvio aleatório à posição da câmara
        if (cameraShakeTime > 0) {
            camera.position.x += (Math.random() - 0.5) * cameraShakeIntensity;
            camera.position.z += (Math.random() - 0.5) * cameraShakeIntensity;

            //diminui a intensidade gradualmente
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
                //movimento suave do guarda entre quadrados
                if (guard.c !== undefined && guard.r !== undefined) {
                    guard.mesh.position.x += (guard.c - guard.mesh.position.x) * 0.2;
                    guard.mesh.position.z += (guard.r - guard.mesh.position.z) * 0.2;
                }
            }
        });
    }

    //animação de abertura das portas (deslizar para os lados)
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

    physGridGroup.children.forEach(child => {
        if (child.userData && child.userData.type === 'password' && child.visible) {
            child.children.forEach(m => {
                if (m.userData.isIndicator) {
                    m.rotation.y += 0.04;
                    m.rotation.x += 0.02;
                    m.position.y = m.userData.startY + Math.sin(Date.now() * 0.004) * 0.15;
                }
            });
        }
    });

    //inimigos e efeitos em netspace
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

                //brilha mais intensamente se o jogador estiver perto
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

                //atualiza a intensidade da luz que criámos
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

            //reduz a opacidade dos andares distantes
            g.traverse(t => {
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
        //esconde tudo o que é virtual se o modo for Físico
        netFloorGroups.forEach(g => g.visible = false);
        enemies.forEach(en => en.group.visible = false);
    }

    //renderiza a cena final com a câmara atualizada
    renderer.render(scene, camera);

}

//inicia o ciclo de animação
animate();