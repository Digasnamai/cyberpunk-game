// Blueprints e data para cada nível

export const LEVEL_DATA = {
    0: {
        // O jogador nasce num ambiente seguro
        spawn: { r: 1, c: 1 },

        // Mensagem de Boas-Vindas (Aparece logo que o nível carrega)
        tutorial: [
            {
                title: "TRAINING LEVEL",
                text: "Welcome to the VR Training Simulator. Your objective is to reach the extraction point.<br><br>Move by clicking on the cyan tiles. Every step uses <b>Action Points (AP)</b>. If you run out, <b>end your turn using spacebar</b>.",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            }
        ],

        // O Mapa (Formato de corredor para forçar a aprendizagem)
        // 0: Chão, 1: Parede, 2: Terminal, 3: Porta, 5: Câmara, 6: Datapad
        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //0
            [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], //1 (Spawn a 1,1. Datapad a 1,5)
            [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], //2 (Guarda a 2,5. Impede o acesso ao Datapad)
            [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 3, 0, 0], //3 (Terminal a 3,8. Porta a 3,10. Saída a 3,11)
            [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0], //4
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //5
        ],

        // === AS ZONAS DE GATILHO (Mid-level pop-ups) ===
        triggers: [
            {
                // Dispara mesmo antes de o jogador chegar à zona de perigo do guarda
                r: 3, c: 3, fired: false,
                title: "THREAT AVOIDANCE",
                text: "Red cells indicate enemy Line of Sight. If a guard sees you, you will be reset to the start of the level.<br><br><b>End your turn (spacebar)</b>  to let the security guard look the other way, then sneak past it",
                mediaType: "image", mediaSrc: "media/placeholder.png"
            },
            {
                // Dispara quando o jogador chega perto do terminal
                r: 3, c: 7, fired: false,
                title: "NETRUNNING & COMBAT",
                text: "Physical doors can be locked and opening them requires you to hack the nearby terminal.<br><br>Click the <b>Terminal</b> to enter it's Net Architecture, reach the bottom floor and click on the Core to open the door.",
                mediaType: "image", mediaSrc: "media/placeholder.png"
            }
        ],

        // Guarda estático que roda 90 graus por turno. 
        // O jogador tem de "passar o turno" até ele olhar para a parede para poder roubar o Datapad.
        guards: [
            { r: 2, c: 5, dirs: ['down', 'left', 'up', 'right'], dirIdx: 0 }
        ],

        // O Terminal ensina a descer 1 andar e a lutar contra 1 monstro antes de abrir a porta
        terminals: [
            {
                id: "T_TUTORIAL", r: 3, c: 8, action: "unlock_door", targetId: "DOOR_TUTORIAL", floors: 2,
                // GATILHOS EXCLUSIVOS DESTE NETRUN
                triggers: [
                    {
                        // isto dispara imediatamente quando ele entra no Netrun.
                        floor: 0, fired: false,
                        pages: [
                            {
                                title: "THE NET ARCHITECTURE",
                                text: "Welcome to the Net Architecture.<br><br>You are currently on the top floor of this architecture. Your physical body is safe but Internal Countermeasure Electronics or <b>ICE</b> programs will hunt you here.",
                                mediaType: "image", mediaSrc: "media/placeholder.png"
                            },
                            {
                                title: "MOVEMENT",
                                text: "You can think of a net architecture like an elevator that moves between floors, your goal is to reach the bottom floor to hack it.<br><br>You can move arround by <b>pressing adjacent tiles</b>. To move between floors you can use <b>'ASCEND'</b> to go up and <b>'DIVE'</b> to go down.",
                                mediaType: "image",
                                mediaSrc: "media/placeholder.png"
                            },
                            {
                                title: "NET UI",
                                text: "On the <b>left side</b> of the screen you'll find the <b>list of programs</b> you can use and on the <b>right side</b> the <b>layout of the Architecture</b>, each layer is a floor and the one that's moved to the side is the one you're currently on.",
                                mediaType: "image",     
                                mediaSrc: "media/placeholder.png"
                            },
                            {
                                title: "NET COMBAT [1/2]",
                                text: "In order to combat ICE you are equiped with different types of programs. <b>SONAR</b> scans the architecture allowing you to see different floors and where ICE are. <b>SWIM</b> let's you escape an enemy into the floor below.",
                                mediaType: "image",
                                mediaSrc: "media/placeholder.png"
                            },
                            {
                                title: "NET COMBAT [2/2]",
                                text: "You can use <b>SWORDFISH</b> to fight ICE at close range or <b>HARPOON</b> for longer distances, you can also use <b>SCALES</b> to defend yourself. <br><br> Each ICE has a different effect so pay attention to the log at the bottom of the screen to get info on what's happening.",
                                mediaType: "image",
                                mediaSrc: "media/placeholder.png"
                            },
                        ]
                    },
                    {
                        // Como omitimos o 'r' e o 'c', isto dispara mal o jogador 
                        // use o botão DIVE para chegar ao Piso 1 (L_02), independentemente de onde esteja a pisar.
                        floor: 1, fired: false,
                        title: "ICE ENCOUNTER",
                        text: "You dived to the Core floor but it is protected by an ICE!<br><br> Move close to it and click the <b>SWORDFISH</b> program on the left to attack it and defeat it. <br><br>Next, click on the glowing Core to hack the door and Jack Out.",
                        mediaType: "image", mediaSrc: "media/placeholder.png"
                    }
                ]
            }
        ],

        // A porta bloqueada que protege a saída
        doors: [
            { id: "DOOR_TUTORIAL", r: 3, c: 10, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        // O ponto de vitória
        exit: { r: 3, c: 12 },

        cameras: [], platforms: [], drones: []
    },

    1: {

        //posição inicial do jogador 
        spawn: { r: 0, c: 0 },

        //informação de tutorial ligada a este nível
        tutorial: [],
        /*
            {
                title: "MOVEMENT [1/5]",
                text: "Click on tiles to move arround. Action points limit your movement per turn.",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
            {
                title: "NETRUNNING [2/5]",
                text: "Your path might be blocked by several obstacles, in order to deactivate them you must access a terminal, move to the bottom of it's 'NET Architecture' using 'ASCEND' and 'DIVE' and interact with it again",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
            {
                title: "NET PROGRAMS [3/5]",
                text: "In order to combat ICE you are equiped with different programs, 'SONAR' scans the architecture allowing you to see different floors, 'SWIM' let's you escape an enemy into the floor below",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
            {
                title: "NET COMBAT [4/5]",
                text: "There are different types of ICE and each has it's own effects, in order to combat them you can use 'SWORDFISH' to damage them at close range or 'HARPOON' for longer ranges, you can also use 'SCALES' to defend yourself",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
            {
                title: "STEALTH [5/5]",
                text: "In the physical space avoid the red visual cones of security guards and cameras. Detection resets you to the start of the level.",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            }
        ],
        */

        // Layout

        // 0 = célula livre
        // 1 = parede/obstáculo
        // 2 = terminal
        // 3 = Porta
        // 4 = espaço vazio (pode ser atravessado ao usar uma plataforma movível)
        // 5 = camara
        // 6 = Datapad 
        // 8 = Braço de robo

        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1], //0
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 2, 1, 1], //1
            [0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1], //2
            [1, 3, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1], //3
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0], //4
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0], //5
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0], //6
            [0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1, 0, 0], //7
            [1, 1, 1, 0, 0, 2, 0, 8, 0, 0, 0, 0, 0, 0, 1, 0, 0], //8
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], //9
        ],

        //Define a posição dos guardas e as direções para onde sse vira
        guards: [
            { r: 6, c: 1, dirs: ['up', 'right', 'down', 'left'], dirIdx: 0 },
            { r: 1, c: 10, dirs: ['down', 'right'], dirIdx: 0 }, // New Guard 1
            { r: 5, c: 12, dirs: ['left', 'up', 'right', 'down'], dirIdx: 0 }  // New Guard 2
        ],

        //posição da saida
        exit: { r: 8, c: 16 },

        //"action" determina que tipo de ação deve acontecer após o jogador chegar ao fim do terminal
        //"targetId" é a referência para a porta, camara ou objeto onde atuar
        //"floors" determina quantos n´íveis tem a architecture
        terminals: [
            { id: "T1", r: 2, c: 2, action: "unlock_door", targetId: "D1", floors: 2 },
            { id: "T2", r: 1, c: 14, action: "unlock_door", targetId: "D2", floors: 3 },
            { id: "T3", r: 8, c: 5, action: "rotate_arm", targetId: "RoboticArm", floors: 3 }
        ],

        //bloqueiam movimento até serem desbloquadas por um terminal
        doors: [
            { id: "D1", r: 3, c: 1, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D2", r: 5, c: 14, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        //mecãnicas não utilizadas neste nível 
        cameras: [],
        platforms: [],
        drones: []
    },
    2: {
        spawn: { r: 5, c: 0 },

        tutorial: [
            {
                title: "LOCKED LEVELS",
                text: "Levels inside an architecture might be locked, you must look for a decryption key to proceed",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
        ],

        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 
            [0, 0, 0, 0, 1, 0, 0, 2, 1, 0, 6, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], //0
            [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], //1
            [0, 1, 1, 0, 3, 0, 0, 1, 1, 0, 0, 0, 1, 5, 0, 0, 1, 0, 0, 0, 1], //2
            [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 5, 1, 1, 1, 0, 1, 1, 3, 1, 1], //3
            [1, 1, 0, 1, 1, 2, 5, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 2, 1], //4
            [0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //5
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], //6
            [0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1], //7
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 0, 0, 1, 0, 1, 1, 1]  //8

        ],

        //comportamento mais avançado para os guardas
        //em vez de apenas terem direções onde olhar agora têm um caminho que seguem em loop
        guards: [

            {
                r: 0, c: 0,
                path: [
                    { r: 0, c: 0, dir: 'right' }, { r: 0, c: 1, dir: 'right' },
                    { r: 0, c: 2, dir: 'right' }, { r: 0, c: 3, dir: 'down' },
                    { r: 1, c: 3, dir: 'down' }, { r: 2, c: 3, dir: 'down' },
                    { r: 3, c: 3, dir: 'left' }, { r: 3, c: 2, dir: 'left' },
                    { r: 3, c: 1, dir: 'left' }, { r: 3, c: 0, dir: 'up' },
                    { r: 2, c: 0, dir: 'up' }, { r: 1, c: 0, dir: 'up' },
                ],
                pathIdx: 0, targetRot: 0
            },

            {
                r: 8, c: 6,
                path: [
                    { r: 8, c: 6, dir: 'left' },
                    { r: 8, c: 5, dir: 'left' }, { r: 8, c: 4, dir: 'left' },
                    { r: 8, c: 3, dir: 'left' }, { r: 8, c: 2, dir: 'up' },
                    { r: 7, c: 2, dir: 'up' }, { r: 6, c: 2, dir: 'up' },
                    { r: 5, c: 2, dir: 'up' }, { r: 4, c: 2, dir: 'down' },
                    { r: 5, c: 2, dir: 'down' }, { r: 6, c: 2, dir: 'down' },
                    { r: 7, c: 2, dir: 'down' }, { r: 8, c: 2, dir: 'right' },
                    { r: 8, c: 3, dir: 'right' }, { r: 8, c: 4, dir: 'right' },
                    { r: 8, c: 5, dir: 'right' },
                ],
                pathIdx: 0, targetRot: Math.PI / 2
            },

            {
                r: 1, c: 15,
                path: [
                    { r: 1, c: 15, dir: 'down' }, { r: 2, c: 15, dir: 'down' },
                    { r: 3, c: 15, dir: 'down' }, { r: 4, c: 15, dir: 'down' },
                    { r: 5, c: 15, dir: 'up' }, { r: 4, c: 15, dir: 'up' },
                    { r: 3, c: 15, dir: 'up' }, { r: 2, c: 15, dir: 'up' }
                ],
                pathIdx: 0, targetRot: 0
            }
        ],

        exit: { r: 1, c: 20 },


        //camaras emitem uma linha de visão numa direção podendo ser desativadas por um terminal
        cameras: [
            { id: "C1", r: 2, c: 13, dirs: ['right'], dirIdx: 0, active: true, mesh: null },
            { id: "C2", r: 3, c: 11, dirs: ['left'], dirIdx: 0, active: true, mesh: null },
            { id: "C3", r: 4, c: 6, dirs: ['down'], dirIdx: 0, active: true, mesh: null }
        ],

        terminals: [
            { id: "T1", r: 4, c: 5, action: "unlock_door", targetId: "D1", floors: 2 },
            //este terminal tem um layer bloqueado requerindo ao utilizador encontrar o Datapad para progredir
            { id: "T2", r: 4, c: 19, action: "unlock_door", targetId: "D2", floors: 4, lockedWith: "PASS_T2" },
            { id: "T3", r: 0, c: 7, action: "disable_camera", targetId: "C3", floors: 2 },
            { id: "T4", r: 8, c: 13, action: "disable_camera", targetId: "C2", floors: 3 },

        ],
        //Datapad necessário para desbloquear um layer num terminal
        passwords: [
            { r: 0, c: 10, id: "PASS_T2", mesh: null }
        ],
        doors: [
            { id: "D1", r: 2, c: 4, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D2", r: 3, c: 18, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null },
        ],

        platforms: [], drones: []
    },

    6: {

        spawn: { r: 1, c: 0 },

        tutorial: [
            {
                title: "INTEGRATED SYSTEMS",
                text: "This area combines all security measures for testing purposes",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            },
        ],

        // Legenda: 0:Chão, 1:Parede, 2:Terminal, 3:Porta, 4:Vazio, 5:Câmara, 6:Datapad

        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
            [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], //0
            [0, 0, 0, 1, 0, 0, 0, 1, 6, 0, 0, 1, 0, 0, 0, 1], //1
            [0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0], //2
            [5, 1, 0, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0], //3
            [0, 0, 0, 1, 1, 4, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1], //4
            [0, 2, 0, 1, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //5 (Saída na col 15)
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //6
        ],

        //Um guarda estático e um drone em patrulha
        guards: [
            { r: 0, c: 4, dirs: ['down', 'right'], dirIdx: 0 }
        ],

        drones: [
            {
                r: 5, c: 8,
                path: [[5, 8], [5, 9], [5, 10], [5, 11], [5, 10], [5, 9]],
                pathIdx: 0, forward: true, mesh: null
            }
        ],

        //1 camara de Vigilância
        cameras: [
            { id: "C_TEST", r: 3, c: 0, dirs: ['right'], dirIdx: 0, active: true, mesh: null }
        ],

        //portas
        doors: [
            { id: "D_HACK", r: 3, c: 3, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D_FINAL", r: 4, c: 10, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        //plataforma
        platforms: [
            {
                r: 3, c: 5,
                path: [[3, 5], [4, 5], [5, 5]], // Move-se verticalmente para criar uma ponte
                pathIdx: 0, forward: true, mesh: null
            }
        ],

        //1 Datapad
        passwords: [
            { r: 1, c: 8, id: "KEY_OMEGA", mesh: null }
        ],

        terminals: [
            // T1 abre a primeira porta
            { id: "T_START", r: 5, c: 1, action: "unlock_door", targetId: "D_HACK", floors: 2 },
            // T_CORE exige o Datapad "KEY_OMEGA" para progredir
            { id: "T_CORE", r: 3, c: 14, action: "unlock_door", targetId: "D_FINAL", floors: 3, lockedWith: "KEY_OMEGA" }
        ],

        exit: { r: 5, c: 15 }
    }
};