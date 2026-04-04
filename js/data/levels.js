export const LEVEL_DATA = {
    1: {

        spawn: { r: 0, c: 0 },
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

        // Primary Guard (Middle-Left)
        guards: [
            { r: 6, c: 1, dirs: ['up', 'right', 'down', 'left'], dirIdx: 0 },
            { r: 1, c: 10, dirs: ['down', 'right'], dirIdx: 0 }, // New Guard 1
            { r: 5, c: 12, dirs: ['left', 'up', 'right', 'down'], dirIdx: 0 }  // New Guard 2
        ],
        // Assuming the Blue Circle is the Spawn, and Exit is at the end of the right corridor
        exit: { r: 8, c: 16 },

        terminals: [
            { id: "T1", r: 2, c: 2, action: "unlock_door", targetId: "D1", floors: 2 },
            { id: "T2", r: 1, c: 14, action: "unlock_door", targetId: "D2", floors: 3 },
            { id: "T3", r: 8, c: 5, action: "rotate_arm", targetId: "RoboticArm", floors: 3 }
        ],

        doors: [
            { id: "D1", r: 3, c: 1, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D2", r: 5, c: 14, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null }
        ],

        cameras: [],
        platforms: [],
        drones: []
    },
    2: {
        // Paste the Corporate Office map array here when you are ready to implement it!
        spawn: { r: 5, c: 0 },
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

        guards: [
            // Guard 1: Patrols the top-left hallway vertically
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
            // Guard 2: Paces horizontally in the large bottom-middle area
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
            // Guard 3: Guards the hallway leading to the Exit
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
        cameras: [
            { id: "C1", r: 2, c: 13, dirs: ['right'], dirIdx: 0, active: true, mesh: null },
            { id: "C2", r: 3, c: 11, dirs: ['left'], dirIdx: 0, active: true, mesh: null },
            { id: "C3", r: 4, c: 6, dirs: ['down'], dirIdx: 0, active: true, mesh: null }
        ],

        terminals: [
            { id: "T1", r: 4, c: 5, action: "unlock_door", targetId: "D1", floors: 2 },
            { id: "T2", r: 4, c: 19, action: "unlock_door", targetId: "D2", floors: 4, lockedWith: "PASS_T2" },
            { id: "T3", r: 0, c: 7, action: "disable_camera", targetId: "C3", floors: 2 },
            { id: "T4", r: 8, c: 13, action: "disable_camera", targetId: "C2", floors: 3 },

        ],
        passwords: [
            { r: 0, c: 10, id: "PASS_T2", mesh: null }
        ],
        doors: [
            { id: "D1", r: 2, c: 4, dir: 'vertical', unlocked: false, leftMesh: null, rightMesh: null },
            { id: "D2", r: 3, c: 18, dir: 'horizontal', unlocked: false, leftMesh: null, rightMesh: null },
        ],
        exit: { r: 1, c: 20 },
        platforms: [], drones: []
    }
};