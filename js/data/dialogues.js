//diálogo da secção introdutória ao premir new game
export const introSequence = [
    { speaker: "", text: "In the time of The Red, Portugal is mostly owned by corporations, leaving only a few settlements that still belong to Portuguese people.", showMap: true, activeLayers: [] },
    { speaker: "", text: "One of these is in Matosinhos, Porto.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Stuck between Militech and ASec...", showMap: true, activeLayers: ['map-matosinhos', 'map-militech', 'map-asec'] },
    { speaker: "", text: "...Matosinhos is a small community created by old fishermen turned to contraband.", showMap: true, activeLayers: ['map-matosinhos'] },
    { speaker: "", text: "Although not controlled, it depends financially on the corporations. It's divided into two groups: DeadFish, who witnessed the 4th corporate war, and NetFish, the ones born after.", showMap: true, activeLayers: [] },
    { speaker: "", text: "You are Nyx, a Netrunner from NetFish tired of depending on corporations for survival", showMap: false, activeLayers: [] },
    { speaker: "", text: "Your group plans a heist on Militech's side of the port of Leças to steal valuable information and get rich selling it to the highest bidder, freeing yourself from the corporations", showMap: false, activeLayers: [] }
];

//diálogo antes da 1ª missao
export const mission1Dialogue = [
    { side: "left", name: "Nyx", text: "Guys I got the keycard, it will be easy to pass Militech checkpoints. We should have a day before they notice something wrong." },
    { side: "right", name: "Snapper", text: "So... are you ready Nyx? After passing the control points, you will infiltrate the port through the staff entrance and pass through 3 restricted areas until you reach the control tower server." },
    { side: "left", name: "Nyx", text: "I've been ready for a long time, let's finally oppose these corporations instead of standing by like deadfish. When we sell Militch's information we will have enough money to impose our freedom." },
    { side: "right", name: "Snapper", text: "Maria said that an aerozep should leave near the tower in 5 hours. You have to get the information before you leave the port in it, she's already on her way to the landing point to pick you up later." },
    { side: "right", name: "Eel", text: "Hey Nyx, I've made some improvements to your cyberdeck, it will help you get through the restricted areas without being seen. Do a test netrun on the base computer architecture to make sure everything is ok." },
    { side: "right", name: "Eel", text: "I added a few obstacles and a simulated guard so you can get a more realistic experience" },
    { side: "left", name: "Nyx", text: "Thanks Eel, today Netfish will change the destiny of Matosinhos." },
];

//diálogo antes da 1ª missao
export const mission2Dialogue = [
    { side: "right", name: "Guard", text: "Stop! The scanner is not identifying you, nor the vehicle, with authorized passage." },
    { side: "left", name: "Nyx", text: "Sorry sir, I'm new here, here's my keycard to check." },
    { side: "right", name: "Guard", text: "Let me see. Ahm… Fernanda Santos… 25 years old… maintenance service… everything seems to be ok. When you get to the staff area, ask someone to fix the problem with the identification." },
    { side: "left", name: "Nyx", text: "Will do. Thank you sir." },
    { side: "left", name: "Nyx", text: "Guys, can you hear me? I'm inside the port." },
    { side: "right", name: "Snapper", text: "Loud and clear, now go through the manufacturing facility, there shouldn't be any complicated systems, just don't get caught." },

];

// ... 2ª
export const mission3Dialogue = [
    { side: "left", name: "Nyx", text: "That place was huge, it had several manufacturing sectors, from weapons to processed food." },
    { side: "right", name: "Snapper", text: "Militech uses the port as a logistics center for its operations in Europe, they have equipment there to support an army for years. Imagine if we had access to all of this." },
    { side: "left", name: "Nyx", text: "I think I'm arriving at the administrative building." },
    { side: "right", name: "Snapper", text: "From here you should start to find blocked architectures. Usually someone leaves the password nearby. It's a common security flaw, luckily for us." },

];

// ... 3ª
export const mission4Dialogue = [
    { side: "left", name: "Nyx", text: "I'm on my way to the container yard, I wonder why they still have these ship to shore cranes." },
    { side: "right", name: "Eel", text: "Even with the naval mines that Arasaka left the world during the war, transport by boat still happens along the coast, but more and more things are transported by aerozep." },
    { side: "left", name: "Nyx", text: "And to think that Arasaka was everywhere in Portugal before the war... but it probably wouldn't be any different than it is now if they stayed." },
    { side: "right", name: "Eel", text: "Arasaka, ASec, Militech all the same thing." },
    { side: "right", name: "Snapper", text: "The only difference is the name, they all do the same shit." },
    { side: "left", name: "Nyx", text: "I know I know... it won't be long before we're free from all of them." },
    { side: "left", name: "Nyx", text: "I'm heading into the container yard, let's hope this works out" },

];

//não usado

export const mission5Dialogue = [
    { side: "left", name: "Nyx", text: "I almost fell out of one of the containers, now I just have to go through the testing grounds and reach the tower, I'm almost there." },
    { side: "right", name: "Eel", text: "They must have experimental drones there, I'd love to see them." },
    { side: "left", name: "Nyx", text: "I'd rather not." }
];


// ... 4ª
export const mission6Dialogue = [
    { side: "left", name: "Nyx", text: "I almost fell out of one of those containers." },
    { side: "right", name: "Eel", text: "Still here though. So everything's fine!" },
    { side: "left", name: "Nyx", text: "Yeah, true I guess." },
    { side: "right", name: "Snapper", text: "Only the tower left, the exit aerozep will leave soon so don't take too long, get in, grab the data and get out." },
    { side: "left", name: "Nyx", text: "No worries this is what I do best, won't be long before we're swimming in cash" },
    { side: "right", name: "Eel", text: "I'm sort of surprised it's going so well" },
    { side: "left", name: "Nyx", text: "Don't jinx it" },
];