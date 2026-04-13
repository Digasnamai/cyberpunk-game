//diálogo da secção introdutória ao premir new game
export const introSequence = [
    { speaker: "", text: "In the time of The Red, Portugal is mostly owned by corporations, leaving only a few settlements that still belong to Portuguese people.", showMap: true, activeLayers: [] },
    { speaker: "", text: "One of these is in Matosinhos, Porto.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Stuck between Militech and ASec...", showMap: true, activeLayers: ['map-matosinhos', 'map-militech', 'map-asec'] },
    { speaker: "", text: "...Matosinhos is a small community created by old fishermen turned to contraband.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Although not controlled, it depends financially on the corporations. It's divided into two groups: DeadFish, who witnessed the 4th corporate war, and NetFish, the ones born after.", showMap: true, activeLayers: [] },
    { speaker: "", text: "You are Nyx, a Netrunner from NetFish tired of depending on corporations for survival", showMap: false, activeLayers: [] },
    { speaker: "", text: "Your group plans a heist on Militech's side of the port of Leças to steal valuable information and get rich selling it to the highest bidder freeing yourself from the corporations", showMap: false, activeLayers: [] }
];

//diálogo antes da 1ª missao
export const mission1Dialogue = [
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" },
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" },
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" }
];

//diálogo antes da 2ª missao
export const mission2Dialogue = [
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" },
    { side: "right", name: "Character", text: "Dialogue 1" }
];

export const mission3Dialogue = [
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" },
    { side: "right", name: "Character", text: "Dialogue 1" }
];

export const mission4Dialogue = [
    { side: "right", name: "Character", text: "Dialogue 1" },
    { side: "left", name: "NYX", text: "Dialogue 2" },
    { side: "right", name: "Character", text: "Dialogue 1" }
];