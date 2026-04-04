export const introDialogue = [
    { speaker: "", text: "In the time of The Red, Portugal is mostly owned by corporations, leaving only a few settlements that still belong to Portuguese people.", showMap: true, activeLayers: [] },
    { speaker: "", text: "One of these is in Matosinhos, Porto.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Stuck between Militech and ASec...", showMap: true, activeLayers: ['map-matosinhos', 'map-militech', 'map-asec'] },
    { speaker: "", text: "...Matosinhos is a small community created by old fishermen turned to contraband.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Although not controlled, it depends financially on the corporations. It's divided into two groups: DeadFish, who witnessed the 4th corporate war, and NetFish, the ones born after.", showMap: true, activeLayers: [] },
    { speaker: "", text: "You are Nyx, a Netrunner from NetFish tired of depending on corporations for survival", showMap: false, activeLayers: [] },
    { speaker: "", text: "Your group plans a heist on Militech's side of the port of Leças to steal valuable information and get rich selling it to the highest bidder to free yourself from the corporations", showMap: false, activeLayers: [] }
];

export const mission1Dialogue = [
    { side: "right", name: "HANDLER", text: "Listen up, Nyx. We're both tired of depending on corps for survival." },
    { side: "left", name: "NYX", text: "Tell me about it. What's the target?" },
    { side: "right", name: "HANDLER", text: "A Militech facility at the port of Leças. There's valuable data inside. We steal it, sell it to the highest bidder, and buy our freedom." },
    { side: "left", name: "NYX", text: "I'm at the perimeter now. Jacking in." }
];

export const mission2Dialogue = [
    { side: "right", name: "HANDLER", text: "Good job on the entry. You are in the administrative wing." },
    { side: "left", name: "NYX", text: "It's crawling with guards. And I see a camera grid." },
    { side: "right", name: "HANDLER", text: "Find the local security terminal to blind the cameras." }
];