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
            [1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], //2 (Guarda a 2,5. Impede o acesso ao Datapad)
            [1, 1, 1, 0, 0, 0, 0, 0, 2, 0, 3, 0, 0], //3 (Terminal a 3,8. Porta a 3,10. Saída a 3,11)
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
    3: {
        spawn: { r: 5, c: 0 },

        tutorial: [
            {
                title: "MOVING PLATFORMS",
                text: "You can move on top of moving platforms to cross gaps. Each time they move the player will follow.",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            }
        ],

        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 0, 1, 0, 0, 0, 0, 1, 1], //0
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 0, 1, 0, 1, 0, 0, 1, 1], //1
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 0, 1, 0, 1, 0, 0, 0, 0], //2
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 0, 3, 0, 1, 1, 0, 0, 2], //3
            [0, 0, 0, 0, 0, 1, 1, 4, 4, 4, 0, 1, 0, 0, 0, 0, 0, 0], //4
            [0, 0, 0, 0, 0, 1, 1, 4, 4, 4, 0, 1, 1, 1, 1, 1, 1, 1], //5
            [0, 0, 0, 0, 0, 1, 1, 4, 4, 4, 0, 0, 0, 0, 1, 0, 2, 0], //6
            [1, 1, 1, 0, 0, 1, 1, 4, 4, 4, 1, 1, 1, 0, 1, 0, 0, 0], //7
            [1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 1, 1, 1, 0, 0, 0, 0, 0], //8
            [1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 1, 1, 1, 0, 1, 0, 0, 1], //9
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //10
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 5, 1, 1, 1, 1, 1, 1, 1], //11
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //12
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1, 0, 0, 0, 0, 0, 1], //13
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1, 0, 0, 1, 0, 0, 0], //14
            [1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1, 0, 0, 1, 0, 0, 0], //15
            [1, 1, 1, 1, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 1, 0, 0, 2], //16
            [1, 1, 1, 1, 0, 0, 0, 4, 4, 4, 0, 1, 1, 0, 1, 1, 0, 0], //17
            [1, 1, 1, 1, 2, 0, 0, 4, 4, 4, 0, 1, 0, 0, 0, 1, 0, 1], //18
            [1, 1, 1, 1, 0, 0, 0, 4, 4, 4, 0, 1, 0, 0, 0, 0, 0, 5], //19
            [1, 1, 1, 1, 3, 1, 1, 4, 4, 4, 1, 1, 1, 0, 0, 0, 1, 1], //20
            [1, 1, 1, 1, 0, 0, 1, 4, 4, 4, 1, 1, 1, 0, 6, 0, 1, 1], //21
            [4, 4, 4, 1, 0, 0, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //22
            [4, 4, 4, 0, 0, 0, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //23
            [4, 4, 4, 0, 0, 0, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //24
            [4, 4, 4, 0, 0, 0, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1], //25
            [4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //26
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //27
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //28

        ],

        guards: [
            {
                r: 1, c: 14,
                path: [{ r: 1, c: 14, dir: 'up' }, { r: 0, c: 14, dir: 'left' },
                { r: 0, c: 13, dir: 'left' }, { r: 0, c: 12, dir: 'down' },
                { r: 1, c: 12, dir: 'down' }, { r: 2, c: 12, dir: 'down' },
                { r: 3, c: 12, dir: 'down' }, { r: 4, c: 12, dir: 'right' },
                { r: 4, c: 13, dir: 'right' }, { r: 4, c: 14, dir: 'right' },
                { r: 4, c: 15, dir: 'up' }, { r: 3, c: 15, dir: 'up' },
                { r: 2, c: 15, dir: 'left' }, { r: 2, c: 14, dir: 'up' },
                ],
                pathIdx: 0, targetRot: Math.PI / 2
            },
            {
                r: 9, c: 13,
                dirs: ['left', 'up'],
                dirIdx: 0
            },
            {
                r: 19, c: 13,
                dirs: ['right', 'up'],
                dirIdx: 0
            },
            {
                r: 8, c: 4,
                dirs: ['up', 'right'],
                dirIdx: 0
            },
        ],

        cameras: [
            { id: "C_MID", r: 11, c: 10, dirs: ['left'], dirIdx: 0, active: true, mesh: null }, // Vigia a fronteira do fosso
            { id: "C_BOT", r: 19, c: 17, dirs: ['left'], dirIdx: 0, active: true, mesh: null }  // Vigia o corredor inferior direito
        ],

        platforms: [
            {
                r: 11, c: 7,
                path: [
                    [11, 7], [10, 7], [9, 7], [8, 7], [7, 7], [6, 7], [5, 7], [4, 7], [3, 7], [2, 7], [1, 7], [0, 7],
                    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 11, c: 8,
                path: [
                    [11, 8], [10, 8], [9, 8], [8, 8], [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
                    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 11, c: 9,
                path: [
                    [11, 9], [10, 9], [9, 9], [8, 9], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9], [2, 9], [1, 9], [0, 9],
                    [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 12, c: 7,
                path: [
                    [12, 7], [13, 7], [14, 7], [15, 7], [16, 7], [17, 7], [18, 7], [19, 7], [20, 7], [21, 7], [22, 7], [23, 7],
                    [22, 7], [21, 7], [20, 7], [19, 7], [18, 7], [17, 7], [16, 7], [15, 7], [14, 7], [13, 7], [12, 7],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 12, c: 8,
                path: [
                    [12, 8], [13, 8], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8], [19, 8], [20, 8], [21, 8], [22, 8], [23, 8],
                    [22, 8], [21, 8], [20, 8], [19, 8], [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 12, c: 9,
                path: [
                    [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9], [18, 9], [19, 9], [20, 9], [21, 9], [22, 9], [23, 9],
                    [22, 9], [21, 9], [20, 9], [19, 9], [18, 9], [17, 9], [16, 9], [15, 9], [14, 9], [13, 9], [12, 9],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 22, c: 2,
                path: [
                    [22, 2], [23, 2], [24, 2], [25, 2], [26, 2], [25, 2], [24, 2], [23, 2], [22, 2],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 22, c: 1,
                path: [
                    [22, 1], [23, 1], [24, 1], [25, 1], [26, 1], [25, 1], [24, 1], [23, 1], [22, 1],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
            {
                r: 22, c: 0,
                path: [
                    [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [25, 0], [24, 0], [23, 0], [22, 0],
                ],
                pathIdx: 0, forward: true, mesh: null
            },
        ],

        passwords: [
            { r: 21, c: 14, id: "KEY_OMEGA", mesh: null }
        ],

        doors: [
            { id: "D_TOP", r: 3, c: 11, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D_BOT", r: 20, c: 4, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        terminals: [
            { id: "T_TR_1", r: 3, c: 17, action: "disable_camera", targetId: "C_MID", floors: 2 },
            { id: "T_TR_2", r: 6, c: 16, action: "unlock_door", targetId: "D_TOP", floors: 3 },
            { id: "T_BR", r: 16, c: 17, action: "disable_camera", targetId: "C_BOT", floors: 3 },
            { id: "T_BL", r: 18, c: 4, action: "unlock_door", targetId: "D_BOT", floors: 3, lockedWith: "KEY_OMEGA" }
        ],

        exit: { r: 28, c: 1 },

        triggers: [],
        drones: []
    },

    4: {
        spawn: { r: 12, c: 0 },

        tutorial: [
            {
                title: "DRONES",
                text: "This sector is heavily guarded by automated Drones. They follow strict, pre-programmed paths. Find an associated terminal to disable them",
                mediaType: "image",
                mediaSrc: "media/placeholder.png"
            }
        ],

        map: [
        //   0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //0
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //1
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //2
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //3
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //4
            [1, 2, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //5
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //6
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 6, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //7
            [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //8
            [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //9
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //10
            [1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //12
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //13
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], //14
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], //15
            [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //16
            [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], //17
            [1, 0, 0, 2, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], //18
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1], //19
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0], //20
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1], //21
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1], //22
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 1], //23
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 1, 1, 1, 1, 0, 0, 0, 1], //24
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], //25
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], //26
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], //27
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], //28
            [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], //29
            [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //30
            [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 5, 0, 0, 0, 0, 0, 6, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  //31
        ],

        guards: [
            {
                r: 1, c: 3,
                path: [
                    { r: 1, c: 3, dir: 'down' }, { r: 2, c: 3, dir: 'down' },
                    { r: 3, c: 3, dir: 'down' }, { r: 4, c: 3, dir: 'right' },
                    { r: 4, c: 4, dir: 'right' }, { r: 4, c: 5, dir: 'up' },
                    { r: 3, c: 5, dir: 'up' }, { r: 2, c: 5, dir: 'up' },
                    { r: 1, c: 5, dir: 'down' }, { r: 2, c: 5, dir: 'down' },
                    { r: 3, c: 5, dir: 'down' }, { r: 4, c: 5, dir: 'left' },
                    { r: 4, c: 4, dir: 'left' }, { r: 4, c: 3, dir: 'up' },
                    { r: 3, c: 3, dir: 'up' }, { r: 2, c: 3, dir: 'up' },
                ],

                pathIdx: 0, targetRot: 0
            },
            {
                r: 16, c: 1, path: [
                    { r: 16, c: 1, dir: 'down' }, { r: 17, c: 1, dir: 'down' },
                    { r: 18, c: 1, dir: 'down' }, { r: 19, c: 1, dir: 'down' },
                    { r: 20, c: 1, dir: 'down' }, { r: 21, c: 1, dir: 'down' },
                    { r: 22, c: 1, dir: 'down' }, { r: 23, c: 1, dir: 'down' },
                    { r: 24, c: 1, dir: 'down' }, { r: 25, c: 1, dir: 'down' },
                    { r: 26, c: 1, dir: 'down' }, { r: 27, c: 1, dir: 'down' },
                    { r: 28, c: 1, dir: 'right' }, { r: 28, c: 2, dir: 'right' },
                    { r: 28, c: 3, dir: 'right' }, { r: 28, c: 4, dir: 'right' },
                    { r: 28, c: 5, dir: 'up' }, { r: 27, c: 5, dir: 'up' },
                    { r: 26, c: 5, dir: 'up' }, { r: 25, c: 5, dir: 'up' },
                    { r: 24, c: 5, dir: 'up' }, { r: 23, c: 5, dir: 'up' },
                    { r: 22, c: 5, dir: 'up' }, { r: 21, c: 5, dir: 'up' },
                    { r: 20, c: 5, dir: 'up' }, { r: 19, c: 5, dir: 'up' },
                    { r: 18, c: 5, dir: 'up' }, { r: 17, c: 5, dir: 'up' },
                    { r: 16, c: 5, dir: 'left' }, { r: 16, c: 4, dir: 'left' },
                    { r: 16, c: 3, dir: 'left' }, { r: 16, c: 2, dir: 'left' },
                ],

                pathIdx: 0, targetRot: Math.PI
            },

            {
                r: 23, c: 11, path: [
                    { r: 23, c: 11, dir: 'right' }, { r: 23, c: 12, dir: 'right' },
                    { r: 23, c: 13, dir: 'right' }, { r: 23, c: 14, dir: 'right' },
                    { r: 23, c: 15, dir: 'right' }, { r: 23, c: 16, dir: 'right' },
                    { r: 23, c: 17, dir: 'right' }, { r: 23, c: 18, dir: 'right' },
                    { r: 23, c: 19, dir: 'right' }, { r: 23, c: 20, dir: 'left' },
                    { r: 23, c: 19, dir: 'left' }, { r: 23, c: 18, dir: 'left' },
                    { r: 23, c: 17, dir: 'left' }, { r: 23, c: 16, dir: 'left' },
                    { r: 23, c: 15, dir: 'left' }, { r: 23, c: 14, dir: 'up' },
                    { r: 22, c: 14, dir: 'up' }, { r: 21, c: 14, dir: 'up' },
                    { r: 20, c: 14, dir: 'up' }, { r: 19, c: 14, dir: 'up' },
                    { r: 18, c: 14, dir: 'down' }, { r: 19, c: 14, dir: 'down' },
                    { r: 20, c: 14, dir: 'down' }, { r: 21, c: 14, dir: 'down' },
                    { r: 22, c: 14, dir: 'down' }, { r: 23, c: 14, dir: 'left' },
                    { r: 23, c: 13, dir: 'left' }, { r: 23, c: 12, dir: 'left' },
                ],
                pathIdx: 0, targetRot: Math.PI
            },
            {
                r: 25, c: 22, path: [
                    { r: 25, c: 22, dir: 'right' }, { r: 25, c: 23, dir: 'right' },
                    { r: 25, c: 24, dir: 'right' }, { r: 25, c: 25, dir: 'right' },
                    { r: 25, c: 26, dir: 'right' }, { r: 25, c: 27, dir: 'right' },
                    { r: 25, c: 28, dir: 'right' }, { r: 25, c: 29, dir: 'up' },
                    { r: 24, c: 29, dir: 'up' }, { r: 23, c: 29, dir: 'left' },
                    { r: 23, c: 28, dir: 'left' }, { r: 23, c: 27, dir: 'left' },
                    { r: 23, c: 26, dir: 'left' }, { r: 23, c: 25, dir: 'left' },
                    { r: 23, c: 24, dir: 'left' }, { r: 23, c: 23, dir: 'left' },
                    { r: 23, c: 22, dir: 'right' }, { r: 23, c: 23, dir: 'right' },
                    { r: 23, c: 24, dir: 'right' }, { r: 23, c: 25, dir: 'right' },
                    { r: 23, c: 26, dir: 'right' }, { r: 23, c: 27, dir: 'right' },
                    { r: 23, c: 28, dir: 'right' }, { r: 23, c: 29, dir: 'down' },
                    { r: 24, c: 29, dir: 'down' }, { r: 25, c: 29, dir: 'left' },
                    { r: 25, c: 28, dir: 'left' }, { r: 25, c: 27, dir: 'left' },
                    { r: 25, c: 26, dir: 'left' }, { r: 25, c: 25, dir: 'left' },
                    { r: 25, c: 24, dir: 'left' }, { r: 25, c: 23, dir: 'left' },

                ], pathIdx: 0, targetRot: Math.PI / 2
            },
            {
                r: 28, c: 36, path: [
                    { r: 28, c: 36, dir: 'right' }, { r: 28, c: 37, dir: 'right' },
                    { r: 28, c: 38, dir: 'right' }, { r: 28, c: 39, dir: 'up' },
                    { r: 27, c: 39, dir: 'up' }, { r: 26, c: 39, dir: 'left' },
                    { r: 26, c: 38, dir: 'left' }, { r: 26, c: 37, dir: 'left' },
                    { r: 26, c: 36, dir: 'right' }, { r: 26, c: 37, dir: 'right' },
                    { r: 26, c: 38, dir: 'right' }, { r: 26, c: 39, dir: 'down' },
                    { r: 27, c: 39, dir: 'down' }, { r: 28, c: 39, dir: 'left' },
                    { r: 28, c: 38, dir: 'left' }, { r: 28, c: 37, dir: 'left' },

                ], pathIdx: 0, targetRot: Math.PI / 2
            }
        ],

        drones: [
            {
                id: "DRONE_1", active: true,
                r: 1, c: 10,
                path: [
                    [1, 10], [2, 10], [3, 10], 
                    [4, 10], [5, 10], [6, 10], 
                    [7, 10], [8, 10], [9, 10], 
                    [10, 10], [9, 10], [8, 10], 
                    [7, 10], [6, 10], [5, 10], 
                    [4, 10], [3, 10], [2, 10], [1, 10]
                ], pathIdx: 0, forward: true, mesh: null
            },
            {
                id: "DRONE_2", active: true,
                r: 16, c: 31,
                path: [
                    [16, 31], [17, 31], [18, 31], 
                    [19, 31], [20, 31], [21, 31], 
                    [22, 31], [23, 31], [24, 31], 
                    [25, 31], [26, 31], [27, 31], 
                    [28, 31], [29, 31], [28, 31], 
                    [27, 31], [26, 31], [25, 31], 
                    [24, 31], [23, 31], [22, 31], 
                    [21, 31], [20, 31], [19, 31], 
                    [18, 31], [17, 31], [16, 31]
                ], pathIdx: 0, forward: true, mesh: null
            },
            {
                id: "DRONE_3", active: true,
                r: 16, c: 34,
                path: [
                    [16, 34], [17, 34], [18, 34], 
                    [19, 34], [18, 34], [17, 34], [16, 34]
                ], pathIdx: 0, forward: true, mesh: null
            },
            {
                id: "DRONE_4", active: true,
                r: 16, c: 37,
                path: [
                    [16, 37], [17, 37], [18, 37], 
                    [19, 37], [20, 37], [21, 37], 
                    [20, 37], [19, 37], [18, 37], 
                    [17, 37], [16, 37]
                ], pathIdx: 0, forward: true, mesh: null
            },
            {
                id: "DRONE_5", active: true,
                r: 16, c: 42,
                path: [
                    [16, 42], [16, 43], [16, 44], 
                    [16, 45], [16, 46], [16, 47], 
                    [16, 48], [16, 47], [16, 46], 
                    [16, 45], [16, 44], [16, 43], [16, 42]
                ], pathIdx: 0, forward: true, mesh: null
            },
            {
                id: "DRONE_6", active: true,
                r: 21, c: 47,
                path: [
                    [21, 47], [22, 47], [21, 47]
                ], pathIdx: 0, forward: true, mesh: null
            }
        ],

        cameras: [
            { id: "C_TOP", r: 12, c: 20, dirs: ['down'], dirIdx: 0, active: true, mesh: null },
            { id: "C_BOT", r: 31, c: 11, dirs: ['up'], dirIdx: 0, active: true, mesh: null }
        ],

        // KEY_BETA ajustada para a verdadeira posição do '6' na matriz
        passwords: [
            { r: 7, c: 20, id: "KEY_ALPHA", mesh: null },
            { r: 31, c: 17, id: "KEY_BETA", mesh: null }
        ],

        // D_RIGHT_1 e D_RIGHT_2 ajustadas para a verdadeira posição do '3' na matriz
        doors: [
            { id: "D_TOP_LEFT", r: 11, c: 8, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D_MID_VERT", r: 16, c: 12, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D_RIGHT_1", r: 20, c: 40, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D_RIGHT_2", r: 20, c: 48, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        terminals: [
            { id: "T_1", r: 5, c: 1, action: "disable_camera", targetId: "C_TOP", floors: 2 },
            { id: "T_2", r: 18, c: 3, action: "unlock_door", targetId: "D_TOP_LEFT", floors: 2, lockedWith: "KEY_BETA" },
            { id: "T_3", r: 9, c: 13, action: "disable_drone", targetId: "DRONE_1", floors: 3 },
            { id: "T_4", r: 19, c: 17, action: "unlock_door", targetId: "D_MID_VERT", floors: 3, lockedWith: "KEY_ALPHA" },
            { id: "T_5", r: 28, c: 26, action: "disable_drone", targetId: ["DRONE_2","DRONE_3", "DRONE_4"], floors: 4 },
            { id: "T_6", r: 16, c: 39, action: "disable_drone", targetId: "DRONE_6", floors: 2},
            { id: "T_7", r: 24, c: 40, action: "unlock_door", targetId: "D_RIGHT_1", floors: 2 },
            { id: "T_8", r: 23, c: 47, action: "unlock_door", targetId: "D_RIGHT_2", floors: 2 }
        ],

        exit: { r: 20, c: 49 },

        triggers: [],
        platforms: []
    },

    5: {
        spawn: { r: 3, c: 15 },

        tutorial: [
        ],

        map: [
            //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //0
            [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], //1
            [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], //2
            [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //3
            [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], //4
            [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], //5 
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  //6
        ],

        guards: [],

        drones: [],

        cameras: [],

        doors: [],

        platforms: [],

        passwords: [],

        terminals: [
            { id: "FINAL", r: 3, c: 1, action: "ending", targetId: "D_HACK", floors: 10 },
        ],

        exit: { r: 3, c: 15 }
    }
};