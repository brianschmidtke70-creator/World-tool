// world_tools.js
// Sandboxels mod for neal.fun/sandboxels
// Gravity, straight builder, food, usable room decor, companions with more jobs, day and night.

var worldGravity = "down";
var worldGravityPower = 1;
var rulerStart = null;
var dayTime = 0;
var dayLength = 240;
var lampOn = true;

function worldLog(text) {
    if (typeof logMessage === "function") logMessage(text);
    else console.log(text);
}

function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
    var b = Math.max(0, Math.min(255, (n & 255) + amount));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function grain(hex) {
    var n = Math.floor(Math.random() * 28) - 14;
    return [shade(hex, n), shade(hex, n + 8), shade(hex, n - 8), hex];
}

if (typeof validateMoves === "function") {
    validateMoves(function(pixel, nx, ny) {
        if (!pixel) return true;
        var info = elements[pixel.element];
        if (info && (info.isGas || info.ignoreGravity)) return true;
        if (worldGravity === "down") return true;
        var tryingToFall = ny > pixel.y && nx === pixel.x;
        if (!tryingToFall) return true;
        if (worldGravity === "off") return false;
        var dx = 0;
        var dy = 0;
        if (worldGravity === "up") dy = -1;
        else if (worldGravity === "left") dx = -1;
        else if (worldGravity === "right") dx = 1;
        else dy = 1;
        if (Math.random() > worldGravityPower) return true;
        return [pixel.x + dx, pixel.y + dy];
    });
}

function setGravity(dir) {
    worldGravity = dir;
    worldLog("Gravity is now: " + dir);
}

elements.gravity_down = { color: "#88ccff", category: "tools", tool: function() { setGravity("down"); } };
elements.gravity_up = { color: "#ffcc88", category: "tools", tool: function() { setGravity("up"); } };
elements.gravity_left = { color: "#cc88ff", category: "tools", tool: function() { setGravity("left"); } };
elements.gravity_right = { color: "#88ffcc", category: "tools", tool: function() { setGravity("right"); } };
elements.gravity_off = { color: "#bbbbbb", category: "tools", tool: function() { setGravity("off"); } };
elements.gravity_stronger = {
    color: "#ffffff",
    category: "tools",
    tool: function() {
        worldGravityPower = Math.min(1, worldGravityPower + 0.25);
        worldLog("Gravity power: " + worldGravityPower);
    }
};
elements.gravity_weaker = {
    color: "#666666",
    category: "tools",
    tool: function() {
        worldGravityPower = Math.max(0.25, worldGravityPower - 0.25);
        worldLog("Gravity power: " + worldGravityPower);
    }
};

elements.builder_block = {
    color: grain("#e6d7c3"),
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 1600,
    hardness: 0.6,
    ignoreGravity: true
};

elements.straight_ruler = {
    color: "#f4e04a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (!rulerStart) {
            rulerStart = { x: pixel.x, y: pixel.y };
            worldLog("Ruler start set. Click the end point.");
            return;
        }
        var x1 = rulerStart.x;
        var y1 = rulerStart.y;
        var x2 = pixel.x;
        var y2 = pixel.y;
        rulerStart = null;
        if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) y2 = y1;
        else x2 = x1;
        var dx = Math.sign(x2 - x1);
        var dy = Math.sign(y2 - y1);
        var x = x1;
        var y = y1;
        var guard = 0;
        while (guard < 500) {
            if (isEmpty(x, y)) createPixel("builder_block", x, y);
            if (x === x2 && y === y2) break;
            x += dx;
            y += dy;
            guard++;
        }
        worldLog("Straight line placed.");
    }
};

elements.clear_ruler = {
    color: "#eeeeee",
    category: "tools",
    tool: function() {
        rulerStart = null;
        worldLog("Ruler start cleared.");
    }
};

elements.wheat_grain = {
    color: grain("#e2c56b"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 700
};
elements.flour = {
    color: grain("#f7f1dc"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 600,
    reactions: {
        "water": { elem1: "dough", elem2: null, chance: 0.15 },
        "kitchen_milk": { elem1: "batter", elem2: null, chance: 0.12 },
        "milk": { elem1: "batter", elem2: null, chance: 0.12 }
    }
};
elements.dough = {
    color: grain("#f0deb8"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 1100,
    tempHigh: 80,
    stateHigh: "bread"
};
elements.batter = {
    color: "#f3e2a8",
    behavior: behaviors.LIQUID,
    category: "food",
    state: "liquid",
    density: 1050,
    viscosity: 8000,
    tempHigh: 90,
    stateHigh: "pancake"
};
elements.bread = {
    color: grain("#c4843a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 300,
    tempHigh: 200,
    stateHigh: "toast",
    breakInto: "breadcrumbs",
    isFood: true
};
elements.toast = {
    color: grain("#8a4b1f"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 280,
    isFood: true
};
elements.pancake = {
    color: grain("#e0b15a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 400,
    isFood: true
};
elements.breadcrumbs = {
    color: "#e6c27a",
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 400
};
elements.kitchen_milk = {
    color: "#f7f7f2",
    behavior: behaviors.LIQUID,
    category: "food",
    state: "liquid",
    density: 1030,
    reactions: {
        "lemon": { elem1: "cheese", elem2: null, chance: 0.08 },
        "vinegar": { elem1: "cheese", elem2: null, chance: 0.08 },
        "acid": { elem1: "cheese", elem2: null, chance: 0.1 }
    },
    tempHigh: 85,
    stateHigh: "warm_milk"
};
elements.warm_milk = {
    color: "#fff4dd",
    behavior: behaviors.LIQUID,
    category: "food",
    state: "liquid",
    density: 1020,
    tempHigh: 100,
    stateHigh: "steam"
};
elements.cheese = {
    color: grain("#ffd95a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true,
    reactions: {
        "bread": { elem1: null, elem2: "cheese_sandwich", chance: 0.2 }
    }
};
elements.cheese_sandwich = {
    color: grain("#d7a04a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 450,
    isFood: true
};
elements.kitchen_egg = {
    color: "#f4ecd8",
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 1030,
    tempHigh: 70,
    stateHigh: "cooked_egg"
};
elements.cooked_egg = {
    color: grain("#f6e27a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 1000,
    isFood: true
};
elements.mill = {
    color: "#c0c0c0",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "wheat_grain" || pixel.element === "wheat" || pixel.element === "flour") {
            changePixel(pixel, "flour");
        }
    }
};

elements.kitchen_tomato = {
    color: grain("#d63b2f"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true
};
elements.chopped_tomato = {
    color: grain("#e85a45"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 950,
    isFood: true
};
elements.kitchen_potato = {
    color: grain("#c4a46a"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 1050,
    tempHigh: 120,
    stateHigh: "baked_potato"
};
elements.sliced_potato = {
    color: grain("#e6d2a2"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 1000,
    tempHigh: 100,
    stateHigh: "fried_potato"
};
elements.baked_potato = {
    color: grain("#b8884a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true
};
elements.fried_potato = {
    color: grain("#e2b15a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 850,
    isFood: true
};
elements.kitchen_carrot = {
    color: grain("#f08a2a"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true
};
elements.chopped_carrot = {
    color: grain("#ff9a3c"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 920,
    isFood: true
};
elements.kitchen_apple = {
    color: grain("#d63b45"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 800,
    isFood: true
};
elements.apple_slice = {
    color: grain("#f2e2b0"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 780,
    isFood: true
};
elements.kitchen_sugar = {
    color: grain("#fff8ee"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 850
};
elements.kitchen_rice = {
    color: grain("#f4f0e4"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 780
};
elements.cooked_rice = {
    color: grain("#fffdf6"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true
};
elements.pasta_dough = {
    color: grain("#f3e2b0"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 1100
};
elements.dry_pasta = {
    color: grain("#f6e7b8"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 700
};
elements.cooked_pasta = {
    color: grain("#ffe9a8"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 850,
    isFood: true,
    reactions: {
        "cheese": { elem1: "macaroni", elem2: null, chance: 0.25 },
        "chopped_tomato": { elem1: "pasta_sauce", elem2: null, chance: 0.25 }
    }
};
elements.macaroni = {
    color: grain("#ffd56a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 880,
    isFood: true
};
elements.pasta_sauce = {
    color: grain("#d84a32"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 900,
    isFood: true
};
elements.veg_soup = {
    color: "#e07a3a",
    behavior: behaviors.LIQUID,
    category: "food",
    state: "liquid",
    density: 1020,
    viscosity: 2000,
    isFood: true
};
elements.cookie_dough = {
    color: grain("#e8c98a"),
    behavior: behaviors.STURDYPOWDER,
    category: "food",
    state: "solid",
    density: 1050,
    tempHigh: 90,
    stateHigh: "cookie"
};
elements.cookie = {
    color: grain("#c48a3a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 500,
    isFood: true
};
elements.pizza = {
    color: ["#d9a15a", "#e24b3a", "#f2d15a", "#4e9a3a"],
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 600,
    isFood: true
};
elements.omelette = {
    color: grain("#f6d76a"),
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 950,
    isFood: true
};
elements.garden_salad = {
    color: ["#5eae4a", "#e24b3a", "#f08a2a", "#f4f1ea"],
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 500,
    isFood: true
};
elements.shredded_cheese = {
    color: grain("#ffe07a"),
    behavior: behaviors.POWDER,
    category: "food",
    state: "solid",
    density: 500,
    isFood: true
};
elements.fruit_jam = {
    color: "#c43b55",
    behavior: behaviors.LIQUID,
    category: "food",
    state: "liquid",
    density: 1300,
    viscosity: 20000,
    isFood: true,
    reactions: {
        "bread": { elem1: null, elem2: "jam_toast", chance: 0.3 },
        "toast": { elem1: null, elem2: "jam_toast", chance: 0.3 }
    }
};
elements.jam_toast = {
    color: ["#8a4b1f", "#c43b55", "#f2e2b0"],
    behavior: behaviors.SUPPORT,
    category: "food",
    state: "solid",
    density: 320,
    isFood: true
};

function addFood(name, hex, kind, extra) {
    var base = {
        color: grain(hex),
        behavior: kind === "liquid" ? behaviors.LIQUID : (kind === "powder" ? behaviors.POWDER : (kind === "sturdy" ? behaviors.STURDYPOWDER : behaviors.SUPPORT)),
        category: "food",
        state: kind === "liquid" ? "liquid" : "solid",
        density: kind === "liquid" ? 1020 : 800,
        isFood: true
    };
    if (kind === "liquid") base.viscosity = 1500;
    elements[name] = Object.assign(base, extra || {});
}

addFood("kitchen_corn", "#f2d24a", "sturdy");
addFood("popcorn", "#fff3c4", "powder");
addFood("kitchen_banana", "#f6e27a", "sturdy");
addFood("sliced_banana", "#ffe9a0", "powder");
addFood("kitchen_berry", "#8e2f55", "powder");
addFood("kitchen_lettuce", "#6fbf4a", "powder");
addFood("kitchen_onion", "#f0d8b0", "sturdy");
addFood("chopped_onion", "#f6e6c8", "powder");
addFood("kitchen_pepper", "#d63b2f", "sturdy");
addFood("chopped_pepper", "#e85a45", "powder");
addFood("kitchen_cucumber", "#3e9a4a", "sturdy");
addFood("sliced_cucumber", "#7dce78", "powder");
addFood("kitchen_mushroom", "#c9b8a2", "sturdy");
addFood("sliced_mushroom", "#e6d8c4", "powder");
addFood("kitchen_bean", "#8a4b2a", "powder");
addFood("baked_beans", "#a85a28", "liquid", { viscosity: 4000 });
addFood("oats", "#e6d3a3", "powder");
addFood("oatmeal", "#f0e2c0", "liquid", { viscosity: 5000 });
addFood("kitchen_butter", "#ffe08a", "sturdy");
addFood("kitchen_cocoa", "#5a3428", "powder");
addFood("hot_chocolate", "#6b3e2e", "liquid");
addFood("lemonade", "#f6e27a", "liquid");
addFood("fruit_tea", "#c47a45", "liquid");
addFood("smoothie", "#d45a78", "liquid");
addFood("yogurt", "#fff6ea", "liquid", { viscosity: 8000 });
addFood("mashed_potato", "#f0ddb0", "liquid", { viscosity: 9000 });
addFood("hash_brown", "#c4843a", "solid");
addFood("french_toast", "#d7a04a", "solid");
addFood("grilled_cheese", "#e2b15a", "solid");
addFood("waffle", "#e0b15a", "solid");
addFood("muffin", "#c48a4a", "solid");
addFood("cake", "#f3d2a2", "solid");
addFood("apple_pie", "#c4843a", "solid");
addFood("banana_bread", "#c9a15a", "solid");
addFood("veggie_wrap", "#7dce78", "solid");
addFood("taco", "#e2b15a", "solid");
addFood("rice_bowl", "#fffdf6", "solid");
addFood("noodle_soup", "#e7c27a", "liquid");
addFood("stew", "#8a4b2a", "liquid", { viscosity: 6000 });
addFood("fruit_salad", "#f2a0b0", "solid");
addFood("cereal", "#f6e2a8", "powder");
addFood("cereal_bowl", "#f8edd0", "liquid");
addFood("buttered_toast", "#e2b15a", "solid");
addFood("stuffed_potato", "#c9a15a", "solid");
addFood("quesadilla", "#f0c43a", "solid");
addFood("flatbread", "#e6c27a", "solid");
addFood("tortilla", "#f0d8a0", "solid");
addFood("noodles", "#f6e7b8", "powder");
addFood("cooked_noodles", "#ffe9a8", "solid");
addFood("cooked_meal", "#c4843a", "solid");

elements.knife = {
    color: "#d7dee8",
    category: "tools",
    desc: "Cuts almost any whole food into pieces.",
    tool: function(pixel) {
        if (!pixel) return;
        var cuts = {
            kitchen_tomato: "chopped_tomato", tomato: "chopped_tomato",
            kitchen_potato: "sliced_potato", potato: "sliced_potato",
            kitchen_carrot: "chopped_carrot", carrot: "chopped_carrot",
            kitchen_apple: "apple_slice", apple: "apple_slice",
            bread: "breadcrumbs", cheese: "shredded_cheese",
            kitchen_banana: "sliced_banana", kitchen_onion: "chopped_onion",
            kitchen_pepper: "chopped_pepper", kitchen_cucumber: "sliced_cucumber",
            kitchen_mushroom: "sliced_mushroom", kitchen_lettuce: "chopped_lettuce",
            cake: "cake", pizza: "pizza"
        };
        if (!elements.chopped_lettuce) addFood("chopped_lettuce", "#8ed46a", "powder");
        if (cuts[pixel.element]) {
            changePixel(pixel, cuts[pixel.element]);
            worldLog("Cut into " + cuts[pixel.element] + ".");
        } else if (pixel.element.indexOf("kitchen_") === 0) {
            changePixel(pixel, "chopped_" + pixel.element.slice(8));
            worldLog("Chopped it.");
        }
    }
};
elements.peeler = {
    color: "#c0c6cc",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "kitchen_potato" || pixel.element === "potato" || pixel.element === "kitchen_carrot" || pixel.element === "kitchen_apple" || pixel.element === "kitchen_cucumber") {
            changePixel(pixel, pixel.element.indexOf("potato") >= 0 ? "sliced_potato" : (pixel.element.indexOf("carrot") >= 0 ? "chopped_carrot" : (pixel.element.indexOf("apple") >= 0 ? "apple_slice" : "sliced_cucumber")));
            worldLog("Peeled it.");
        }
    }
};
elements.frying_pan = {
    color: "#4a4e57",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Fry eggs, potatoes, batter, and grilled cheese here with the cook tool."
};
elements.cooking_pot = {
    color: "#8a9099",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Boil rice, pasta, noodles, oats, beans, and soup."
};
elements.saucepan = {
    color: "#6e747c",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Small pot for jam, hot chocolate, and oatmeal."
};
elements.kitchen_oven = {
    color: ["#3a3d44", "#c4493a", "#22242a"],
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    temp: 180,
    desc: "Bakes bread, cookies, cake, pie, muffins, and pizza."
};
elements.baking_sheet = {
    color: "#b7c0c9",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Bake cookies, flatbread, and hash browns on this."
};
elements.cutting_board = {
    color: grain("#c9a06a"),
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Place food here, then use the knife."
};
elements.mixing_bowl = {
    color: "#d7dee8",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Put ingredients beside it and use the mix tool."
};
elements.kettle = {
    color: "#c0c6cc",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Heats water for tea and hot chocolate."
};
elements.toaster = {
    color: "#c4493a",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Turns bread into toast. Click bread with the cook tool."
};
elements.blender = {
    color: "#3aa0d8",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Blend fruit into a smoothie."
};
elements.waffle_iron = {
    color: "#4a4e57",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Turns batter into a waffle."
};
elements.grill_pan = {
    color: "#33363c",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Grills cheese sandwiches and vegetables."
};
elements.colander = {
    color: "#8a9099",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Drains pasta, rice, and noodles after cooking."
};
elements.mortar = {
    color: "#9aa0a6",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Crush berries, sugar, or oats."
};
elements.rolling_pin = {
    color: "#c9a06a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "dough") changePixel(pixel, "flatbread");
        else if (pixel.element === "pasta_dough") changePixel(pixel, "dry_pasta");
        else if (pixel.element === "flour") changePixel(pixel, "pasta_dough");
        else if (pixel.element === "flatbread") changePixel(pixel, "tortilla");
        if (pixel.element) worldLog("Rolled the dough.");
    }
};
elements.whisk = {
    color: "#d7dee8",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "kitchen_egg" || pixel.element === "egg" || pixel.element === "kitchen_milk" || pixel.element === "milk" || pixel.element === "flour") {
            changePixel(pixel, "batter");
            worldLog("Whisked into batter.");
        } else if (pixel.element === "kitchen_butter") {
            changePixel(pixel, "batter");
        }
    }
};
elements.wooden_spoon = {
    color: "#c9a06a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "oatmeal" || pixel.element === "veg_soup" || pixel.element === "stew" || pixel.element === "batter" || pixel.element === "yogurt") {
            worldLog("Stirred the " + pixel.element + ".");
        } else if (pixel.element === "kitchen_rice" || pixel.element === "oats" || pixel.element === "kitchen_bean") {
            changePixel(pixel, pixel.element === "oats" ? "oatmeal" : (pixel.element === "kitchen_bean" ? "baked_beans" : "cooked_rice"));
            worldLog("Stirred until cooked.");
        }
    }
};
elements.spatula = {
    color: "#e24b3a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "batter") changePixel(pixel, "pancake");
        else if (pixel.element === "cookie_dough") changePixel(pixel, "cookie");
        else if (pixel.element === "sliced_potato") changePixel(pixel, "hash_brown");
        else worldLog("Flipped it.");
    }
};
elements.ladle = {
    color: "#d7dee8",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "veg_soup" || pixel.element === "stew" || pixel.element === "noodle_soup" || pixel.element === "oatmeal") {
            worldLog("Served a bowl of " + pixel.element + ".");
        }
    }
};
elements.tongs = {
    color: "#8a9099",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "dry_pasta" || pixel.element === "noodles") changePixel(pixel, pixel.element === "noodles" ? "cooked_noodles" : "cooked_pasta");
        else if (pixel.element === "bread") changePixel(pixel, "toast");
        else worldLog("Lifted it with tongs.");
    }
};
elements.fork = {
    color: "#d7dee8",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "kitchen_potato" || pixel.element === "baked_potato") changePixel(pixel, "mashed_potato");
        else worldLog("Poked it with a fork.");
    }
};
elements.grater = {
    color: "#b7c0c9",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "cheese") changePixel(pixel, "shredded_cheese");
        else if (pixel.element === "kitchen_carrot" || pixel.element === "carrot") changePixel(pixel, "chopped_carrot");
        else if (pixel.element === "kitchen_butter") changePixel(pixel, "kitchen_sugar");
    }
};
elements.sieve = {
    color: "#c0c6cc",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "flour" || pixel.element === "kitchen_sugar" || pixel.element === "kitchen_cocoa" || pixel.element === "oats") {
            worldLog("Sifted the " + pixel.element + ".");
        } else if (pixel.element === "wheat_grain") changePixel(pixel, "flour");
    }
};
elements.pestle = {
    color: "#9aa0a6",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "kitchen_berry") changePixel(pixel, "fruit_jam");
        else if (pixel.element === "oats") changePixel(pixel, "flour");
        else if (pixel.element === "kitchen_sugar") worldLog("Crushed the sugar finer.");
        else if (pixel.element === "kitchen_bean") changePixel(pixel, "baked_beans");
    }
};
elements.spreader = {
    color: "#ffe08a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "bread" || pixel.element === "toast") {
            var top = nearestPixel(pixel, function(p) {
                return p.element === "kitchen_butter" || p.element === "fruit_jam" || p.element === "shredded_cheese" || p.element === "cheese";
            }, 2);
            if (top && (top.element === "fruit_jam")) changePixel(pixel, "jam_toast");
            else if (top && (top.element === "cheese" || top.element === "shredded_cheese")) changePixel(pixel, "grilled_cheese");
            else changePixel(pixel, "buttered_toast");
            worldLog("Spread a topping.");
        }
    }
};
elements.cook_tool = {
    color: "#e07a3a",
    category: "tools",
    desc: "Cooks almost any raw food. Nearby toppings make special meals.",
    tool: function(pixel) {
        if (!pixel) return;
        var name = pixel.element;
        if (name === "dough") {
            var nearCheese = nearestPixel(pixel, function(p) { return p.element === "cheese" || p.element === "shredded_cheese"; }, 2);
            var nearTomato = nearestPixel(pixel, function(p) { return p.element === "chopped_tomato" || p.element === "kitchen_tomato"; }, 2);
            var nearApple = nearestPixel(pixel, function(p) { return p.element === "apple_slice" || p.element === "kitchen_apple"; }, 2);
            var nearBanana = nearestPixel(pixel, function(p) { return p.element === "sliced_banana" || p.element === "kitchen_banana"; }, 2);
            var nearSugar = nearestPixel(pixel, function(p) { return p.element === "kitchen_sugar"; }, 2);
            if (nearCheese && nearTomato) { changePixel(pixel, "pizza"); worldLog("Baked a pizza."); return; }
            if (nearApple) { changePixel(pixel, "apple_pie"); worldLog("Baked an apple pie."); return; }
            if (nearBanana) { changePixel(pixel, "banana_bread"); worldLog("Baked banana bread."); return; }
            if (nearSugar) { changePixel(pixel, "cake"); worldLog("Baked a cake."); return; }
        }
        if (name === "bread" || name === "toast") {
            var eggNear = nearestPixel(pixel, function(p) { return p.element === "kitchen_egg" || p.element === "egg"; }, 2);
            var cheeseNear = nearestPixel(pixel, function(p) { return p.element === "cheese" || p.element === "shredded_cheese"; }, 2);
            if (eggNear) { changePixel(pixel, "french_toast"); worldLog("Made french toast."); return; }
            if (cheeseNear) { changePixel(pixel, "grilled_cheese"); worldLog("Made a grilled cheese."); return; }
        }
        if (name === "tortilla" || name === "flatbread") {
            var fill = nearestPixel(pixel, function(p) { return p.element === "cheese" || p.element === "shredded_cheese" || p.element === "chopped_tomato" || p.element === "chopped_pepper"; }, 2);
            if (fill && (fill.element === "cheese" || fill.element === "shredded_cheese") && name === "tortilla") { changePixel(pixel, "quesadilla"); worldLog("Cooked a quesadilla."); return; }
            if (fill) { changePixel(pixel, name === "tortilla" ? "taco" : "veggie_wrap"); worldLog("Filled a wrap."); return; }
        }
        if (name === "cooked_rice") { changePixel(pixel, "rice_bowl"); worldLog("Served a rice bowl."); return; }
        if (name === "baked_potato") { changePixel(pixel, "stuffed_potato"); worldLog("Stuffed the potato."); return; }
        var bake = {
            dough: "bread", cookie_dough: "cookie", batter: "waffle",
            kitchen_egg: "omelette", egg: "omelette",
            sliced_potato: "fried_potato", kitchen_potato: "baked_potato", potato: "baked_potato",
            kitchen_rice: "cooked_rice", dry_pasta: "cooked_pasta", noodles: "cooked_noodles",
            chopped_tomato: "veg_soup", chopped_carrot: "stew", chopped_onion: "stew",
            kitchen_apple: "fruit_jam", apple_slice: "fruit_jam", kitchen_berry: "fruit_jam",
            oats: "oatmeal", kitchen_bean: "baked_beans", kitchen_corn: "popcorn",
            kitchen_milk: "hot_chocolate", milk: "hot_chocolate", kitchen_cocoa: "hot_chocolate",
            water: "fruit_tea", kitchen_sugar: "lemonade", sliced_banana: "smoothie",
            kitchen_banana: "smoothie", flour: "muffin", breadcrumbs: "cereal"
        };
        if (bake[name]) {
            changePixel(pixel, bake[name]);
            worldLog("Cooked into " + bake[name] + ".");
            return;
        }
        if (elements[name] && elements[name].isFood && name.indexOf("cooked_") !== 0) {
            changePixel(pixel, "cooked_meal");
            worldLog("Cooked a meal.");
        }
    }
};
elements.mix_tool = {
    color: "#f2d15a",
    category: "tools",
    desc: "Mixes nearby foods into dough, salad, drinks, and bowls.",
    tool: function(pixel) {
        if (!pixel) return;
        var name = pixel.element;
        function near(list) {
            return nearestPixel(pixel, function(p) { return list.indexOf(p.element) >= 0; }, 2);
        }
        if (name === "dough" && near(["kitchen_sugar"])) { deletePixel(near(["kitchen_sugar"]).x, near(["kitchen_sugar"]).y); changePixel(pixel, "cookie_dough"); worldLog("Mixed cookie dough."); return; }
        if (name === "flour" && near(["kitchen_egg", "egg"])) { var egg = near(["kitchen_egg", "egg"]); deletePixel(egg.x, egg.y); changePixel(pixel, "pasta_dough"); worldLog("Mixed pasta dough."); return; }
        if (name === "flour" && near(["water", "kitchen_milk", "milk"])) { changePixel(pixel, "dough"); worldLog("Mixed dough."); return; }
        if (name === "kitchen_milk" || name === "milk") {
            if (near(["kitchen_cocoa"])) { changePixel(pixel, "hot_chocolate"); worldLog("Mixed hot chocolate."); return; }
            if (near(["kitchen_berry", "sliced_banana", "apple_slice"])) { changePixel(pixel, "smoothie"); worldLog("Mixed a smoothie."); return; }
            if (near(["cereal"])) { changePixel(pixel, "cereal_bowl"); worldLog("Poured a cereal bowl."); return; }
            changePixel(pixel, "yogurt"); worldLog("Mixed yogurt."); return;
        }
        if (name === "chopped_tomato" || name === "chopped_carrot" || name === "chopped_onion" || name === "chopped_pepper" || name === "sliced_cucumber" || name === "kitchen_lettuce" || name === "chopped_lettuce") {
            changePixel(pixel, "garden_salad"); worldLog("Mixed a salad."); return;
        }
        if (name === "apple_slice" || name === "sliced_banana" || name === "kitchen_berry") { changePixel(pixel, "fruit_salad"); worldLog("Mixed a fruit salad."); return; }
        if (name === "cooked_pasta" && near(["cheese", "shredded_cheese"])) { changePixel(pixel, "macaroni"); worldLog("Mixed macaroni."); return; }
        if (name === "cooked_noodles" && near(["veg_soup", "water"])) { changePixel(pixel, "noodle_soup"); worldLog("Mixed noodle soup."); return; }
        if (name === "bread" || name === "toast") {
            if (near(["fruit_jam"])) { changePixel(pixel, "jam_toast"); worldLog("Spread jam."); return; }
            if (near(["kitchen_butter"])) { changePixel(pixel, "buttered_toast"); worldLog("Buttered the bread."); return; }
            if (near(["cheese", "shredded_cheese"])) { changePixel(pixel, "cheese_sandwich"); worldLog("Made a cheese sandwich."); return; }
        }
        worldLog("Nothing new to mix. Put a second ingredient beside it.");
    }
};
var handbookPage = 0;
var handbookPages = [
    "Handbook 1/8 Cooking: Mill wheat into flour. Mix flour with water for dough. Cook dough for bread. Cook bread again for toast.",
    "Handbook 2/8 Baking: Dough plus cheese and tomato, then Cook, makes pizza. Dough plus apple makes pie. Dough plus sugar makes cake. Dough plus banana makes banana bread. Dough plus sugar, then Mix, makes cookie dough.",
    "Handbook 3/8 Cutting: Knife or Peeler cuts tomato, potato, carrot, apple, banana, onion, pepper, cucumber, and mushroom. Grater shreds cheese. Rolling Pin makes flatbread, then tortilla.",
    "Handbook 4/8 Meals: Cook rice, pasta, noodles, oats, beans, corn, or eggs. Tortilla plus cheese is a quesadilla. Bread plus egg is french toast. Bread plus cheese is grilled cheese. Chopped vegetables mixed are salad.",
    "Handbook 5/8 Drinks: Milk plus cocoa is hot chocolate. Milk plus fruit is a smoothie. Milk mixed alone is yogurt. Cook sugar for lemonade. Cook water for fruit tea.",
    "Handbook 6/8 Tools: Cook Tool cooks. Mix Tool combines nearby food. Spreader tops bread. Spatula flips. Fork mashes potato. Wooden Spoon stirs. Recipe Book turns the page.",
    "Handbook 7/8 Rooms: Place furniture, then click a companion with a Say tool. Sleep goes to a bed. Sit Chair goes to chairs. Eat goes to food or the table. Use Decor toggles lights, TV, curtains, and plants.",
    "Handbook 8/8 Companions: They learn from new to skilled. Check Learning shows rank. At night a practiced companion may go to bed alone. Gravity tools change fall direction. Straight Ruler draws a straight wall."
];
elements.recipe_book = {
    color: "#8a5a2b",
    category: "tools",
    desc: "Click to turn the handbook page.",
    tool: function() {
        worldLog(handbookPages[handbookPage]);
        handbookPage = (handbookPage + 1) % handbookPages.length;
    }
};

var foodNames = {
    bread: true, toast: true, pancake: true, cheese: true,
    cheese_sandwich: true, cooked_egg: true, meat: true,
    cooked_meat: true, potato: true, baked_potato: true, apple: true,
    fried_potato: true, chopped_tomato: true, chopped_carrot: true,
    apple_slice: true, cooked_rice: true, cooked_pasta: true,
    macaroni: true, pasta_sauce: true, veg_soup: true, cookie: true,
    pizza: true, omelette: true, garden_salad: true, shredded_cheese: true,
    jam_toast: true, kitchen_apple: true, kitchen_carrot: true, kitchen_tomato: true,
    popcorn: true, sliced_banana: true, oatmeal: true, baked_beans: true,
    hot_chocolate: true, lemonade: true, fruit_tea: true, smoothie: true,
    yogurt: true, mashed_potato: true, hash_brown: true, french_toast: true,
    grilled_cheese: true, waffle: true, muffin: true, cake: true, apple_pie: true,
    banana_bread: true, veggie_wrap: true, taco: true, rice_bowl: true,
    noodle_soup: true, stew: true, fruit_salad: true, cereal_bowl: true,
    buttered_toast: true, stuffed_potato: true, quesadilla: true, flatbread: true,
    cooked_noodles: true, cooked_meal: true, kitchen_corn: true, kitchen_banana: true,
    kitchen_berry: true, kitchen_lettuce: true, chopped_lettuce: true
};

function nearestPixel(pixel, testFn, maxDist) {
    var best = null;
    var bestDist = maxDist || 24;
    if (typeof currentPixels === "undefined") return null;
    for (var i = 0; i < currentPixels.length; i++) {
        var other = currentPixels[i];
        if (!other || other === pixel) continue;
        if (!testFn(other)) continue;
        var dist = Math.abs(other.x - pixel.x) + Math.abs(other.y - pixel.y);
        if (dist < bestDist) {
            bestDist = dist;
            best = other;
        }
    }
    return best;
}

function stepToward(pixel, tx, ty) {
    var dx = Math.sign(tx - pixel.x);
    var dy = Math.sign(ty - pixel.y);
    if (dx === 0 && dy === 0) return true;
    if (!tryMove(pixel, pixel.x + dx, pixel.y + dy)) {
        if (!tryMove(pixel, pixel.x + dx, pixel.y)) tryMove(pixel, pixel.x, pixel.y + dy);
    }
    return Math.abs(pixel.x - tx) + Math.abs(pixel.y - ty) <= 1;
}

function timeName(t) {
    if (t < 40) return "night";
    if (t < 70) return "sunrise";
    if (t < 150) return "day";
    if (t < 180) return "sunset";
    return "night";
}

function skyColor(t) {
    var name = timeName(t);
    if (name === "day") return "#9fd6e8";
    if (name === "sunrise") return "#f6c98a";
    if (name === "sunset") return "#e7a06a";
    return "#243044";
}

// Usable room decor. Companions can walk to these and use them.
function addDecor(name, hex, desc, extra) {
    elements[name] = Object.assign({
        color: Array.isArray(hex) ? hex : grain(hex),
        behavior: behaviors.WALL,
        category: "special",
        state: "solid",
        ignoreGravity: true,
        desc: desc
    }, extra || {});
}

addDecor("room_wall", "#f7f1e8", "White beach wall.");
addDecor("wood_floor", "#c4a574", "Driftwood floor.", { category: "solids", density: 700 });
addDecor("tile_floor", "#f4efe6", "Pale sand tile.", { category: "solids" });
addDecor("carpet", "#efe4d4", "Soft sand-colored rug floor.");
addDecor("room_rug", "#d8c3a5", "A woven sand rug.");
addDecor("door_mat", "#b08968", "A brown door mat.");
addDecor("room_door", "#a56b3c", "A wood door. Guard can stand here.");
addDecor("room_window", "#9fd6e8", "A window. Color follows the beach sky.", {
    tick: function(pixel) { if (!pixel.shut) pixel.color = skyColor(dayTime); else pixel.color = "#c4a574"; }
});
addDecor("curtain", "#f3e6d0", "White linen curtain. Use Decor to open or shut it.");
addDecor("room_bed", ["#f7f4ee", "#e7d3b0", "#c4a574"], "A white bed. Say sleep.");
addDecor("bunk_bed", ["#f7f4ee", "#d8c3a5", "#a56b3c"], "A wood bunk bed. Say sleep.");
addDecor("hammock", "#e6d3a3", "A sand hammock. Say rest.");
addDecor("sleeping_bag", "#c4a574", "A brown sleeping bag. Say rest.");
addDecor("room_chair", ["#c4a574", "#f7f4ee", "#8a6a45"], "A wood chair. Say sit chair.");
addDecor("rocking_chair", "#b08968", "A driftwood rocking chair. Say sit chair.");
addDecor("stool", "#a56b3c", "A wood stool. Say sit chair.");
addDecor("bench", "#8a6a45", "A wood bench. Say sit chair.");
addDecor("sofa", ["#f7f4ee", "#e7d3b0", "#c4a574"], "A white sofa. Say sit chair or watch.");
addDecor("beanbag", "#d8c3a5", "A sand beanbag. Say sit chair.");
addDecor("cushion", "#f3e6d0", "A white floor cushion.");
addDecor("room_table", "#b08968", "A wood table. Put food beside it, then say eat.");
addDecor("coffee_table", "#c4a574", "A low driftwood table.");
addDecor("desk", "#a56b3c", "A wood desk. Say study.");
addDecor("nightstand", "#c4a574", "A wood nightstand.");
addDecor("dining_set", "#b08968", "A dining table. Say eat.");
addDecor("room_shelf", ["#a56b3c", "#6fbf4a", "#f7f4ee", "#e6d3a3"], "A plant-filled shelf. Say read.");
addDecor("wardrobe", "#8a6a45", "A wood wardrobe. Say dress.");
addDecor("dresser", "#a56b3c", "A wood dresser. Say dress.");
addDecor("mirror", "#f7f4ee", "A white-framed mirror. Say wave.");
addDecor("painting", ["#f6e7c1", "#8ecf8a", "#c4a574"], "Beach and plant art.");
addDecor("poster", ["#9fd6e8", "#f7f4ee", "#6fbf4a"], "A beach poster.");
addDecor("chalkboard", "#3e6b4a", "A green board. Say study.");
addDecor("globe", "#7dce78", "A globe. Say study.");
addDecor("wall_clock", "#f7f4ee", "A white clock. Use Decor tells the time.");
addDecor("room_lamp", "#fff4d6", "A lamp. Use Decor or Lamp Switch toggles lights.", {
    glow: true,
    tick: function(pixel) { pixel.color = lampOn ? "#fff4d6" : "#c4b59a"; }
});
addDecor("floor_lamp", "#f7f4ee", "A tall white lamp.", {
    tick: function(pixel) { pixel.color = lampOn ? "#fff6df" : "#b7a48c"; }
});
addDecor("desk_lamp", "#f3e6d0", "A small sand lamp.", {
    tick: function(pixel) { pixel.color = lampOn ? "#ffe9a8" : "#c4b59a"; }
});
addDecor("candle", "#f6c15b", "A candle. Say warm.");
addDecor("fireplace", ["#8a6a45", "#e7a06a", "#f6c15b"], "A stone fireplace. Say warm.");
addDecor("room_plant", ["#2f8f4e", "#67b36a", "#1f6b38"], "A leafy plant. Say water.", { category: "life" });
addDecor("flower_pot", ["#c4a574", "#67b36a", "#f2d2c4"], "A clay flower pot. Say water.", { category: "life" });
addDecor("vase", "#f7f4ee", "A white vase of greens.");
addDecor("room_radio", ["#c4a574", "#f7f4ee", "#6fbf4a"], "A wood radio. Say dance.");
addDecor("piano", ["#f7f4ee", "#8a6a45"], "A white piano. Say music.");
addDecor("drum", "#b08968", "A wood drum. Say music.");
addDecor("speaker", "#8a6a45", "A wood speaker. Say dance.");
addDecor("tv", ["#243044", "#9fd6e8"], "A TV. Say watch.", {
    tick: function(pixel) { pixel.color = pixel.on ? "#9fd6e8" : "#243044"; }
});
addDecor("computer", ["#f7f4ee", "#6fbf4a"], "A white computer. Say study.");
addDecor("easel", "#c4a574", "A wood easel. Say draw.");
addDecor("room_toybox", ["#e6d3a3", "#6fbf4a", "#f7f4ee"], "A wood toy box. Say play.");
addDecor("toy_blocks", ["#c4a574", "#8ecf8a", "#f7f4ee"], "Wood and plant blocks. Say play.");
addDecor("ball", "#6fbf4a", "A green ball. Say play.");
addDecor("dollhouse", "#f7f4ee", "A white beach cottage. Say play.");
addDecor("aquarium", "#8ecae6", "A fish tank. Say watch.");
addDecor("telescope", "#8a6a45", "A wood telescope. Say look.");
addDecor("fridge", "#f7f4ee", "A white fridge. Say eat and they check here.");
addDecor("kitchen_cabinet", "#c4a574", "A wood cabinet.");
addDecor("counter", "#e6d7c3", "A sand-colored counter. Say cook.");
addDecor("sink", "#f7f4ee", "A white sink. Say wash.");
addDecor("bathtub", "#f7f4ee", "A white tub. Say wash.");
addDecor("shower", "#9fd6e8", "A shower. Say wash.");
addDecor("towel_rack", "#f3e6d0", "White towels.");
addDecor("laundry_basket", "#d8c3a5", "A woven basket. Say tidy.");
addDecor("broom_hook", "#b08968", "A wood broom. Say tidy.");
addDecor("trash_bin", "#8a6a45", "A wood bin. Say tidy.");
addDecor("coat_rack", "#a56b3c", "A wood coat rack. Say dress.");
addDecor("shoe_rack", "#c4a574", "A wood shoe rack.");
addDecor("toolbox", "#8a6a45", "A wood toolbox. Say build.");
addDecor("tent", "#e6d3a3", "A sand play tent. Say play or rest.");
addDecor("picnic_blanket", "#d8c3a5", "A sand picnic blanket. Say eat.");
addDecor("mailbox", "#f7f4ee", "A white mailbox. Say look.");
addDecor("fence", "#c4a574", "A wood garden fence.");
addDecor("stairs", "#e6d7c3", "Sand-colored stairs.");
addDecor("rail", "#b08968", "A wood rail.");
addDecor("beach_sand", "#f0e2c4", "Beach sand path.", { category: "land" });
addDecor("driftwood", "#b08968", "A piece of driftwood.");
addDecor("shell", "#f7f4ee", "A white shell.");
addDecor("palm", ["#6fbf4a", "#c4a574", "#2f8f4e"], "A palm. Say water.", { category: "life" });
addDecor("beach_umbrella", ["#f7f4ee", "#c4a574"], "A white beach umbrella. Say rest.");
addDecor("beach_chair", ["#f7f4ee", "#c4a574"], "A white beach chair. Say sit chair.");
addDecor("scarecrow", ["#c4a574", "#f7f4ee", "#6fbf4a"], "Keeps the garden company.");
addDecor("bird_nest", ["#c4a574", "#f7f4ee", "#e6d3a3"], "A free nest. Place it anywhere. Say rest.");
addDecor("plant_nest", ["#6fbf4a", "#c4a574", "#f7f4ee"], "A plant nest. Place it anywhere. Say water.");
addDecor("seed_nest", ["#e2c56b", "#8a6a45", "#6fbf4a"], "A seed nest. Harvest can leave seeds here.");
addDecor("compost", "#6b4a32", "Compost. Harvest leaves soil ready to plant again.");

elements.lamp_switch = {
    color: "#fff1b8",
    category: "tools",
    tool: function(pixel) {
        lampOn = !lampOn;
        worldLog(lampOn ? "Lamps are on." : "Lamps are off.");
    }
};
elements.use_decor = {
    color: "#f4e04a",
    category: "tools",
    desc: "Use furniture: lights, curtains, TV, window, plant, clock.",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "room_lamp" || pixel.element === "floor_lamp" || pixel.element === "desk_lamp") {
            lampOn = !lampOn;
            worldLog(lampOn ? "Lamps are on." : "Lamps are off.");
        } else if (pixel.element === "curtain" || pixel.element === "room_window") {
            pixel.shut = !pixel.shut;
            worldLog(pixel.shut ? "Closed." : "Opened.");
        } else if (pixel.element === "tv") {
            pixel.on = !pixel.on;
            worldLog(pixel.on ? "TV on." : "TV off.");
        } else if (pixel.element === "room_plant" || pixel.element === "flower_pot") {
            pixel.color = "#3dce6a";
            worldLog("Watered.");
        } else if (pixel.element === "wall_clock") {
            worldLog("The clock says it is " + timeName(dayTime) + ".");
        } else if (pixel.element === "fridge") {
            worldLog("The fridge is cold. Put food beside it.");
        } else {
            worldLog("Used the " + pixel.element + ".");
        }
    }
};
elements.watering_can = {
    color: "#8ecae6",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "room_plant" || pixel.element === "flower_pot" || pixel.element === "palm") {
            pixel.color = "#3dce6a";
            worldLog("Plant watered.");
        } else if (pixel.element === "farm_soil" || pixel.element === "crop_plot") {
            pixel.wet = true;
            pixel.color = "#6b4a32";
            worldLog("Soil watered.");
        }
    }
};

var farmCrops = {
    wheat: { food: "wheat_grain", colors: ["#8a6a45", "#8ecf8a", "#e2c56b"] },
    tomato: { food: "kitchen_tomato", colors: ["#6b4a32", "#3e9a4a", "#d63b2f"] },
    carrot: { food: "kitchen_carrot", colors: ["#6b4a32", "#67b36a", "#f08a2a"] },
    potato: { food: "kitchen_potato", colors: ["#6b4a32", "#5eae4a", "#c4a46a"] },
    lettuce: { food: "kitchen_lettuce", colors: ["#6b4a32", "#8ecf8a", "#6fbf4a"] },
    corn: { food: "kitchen_corn", colors: ["#6b4a32", "#7dce78", "#f2d24a"] },
    berry: { food: "kitchen_berry", colors: ["#6b4a32", "#3e9a4a", "#8e2f55"] }
};

elements.farm_soil = {
    color: grain("#c4a574"),
    behavior: behaviors.WALL,
    category: "land",
    state: "solid",
    ignoreGravity: true,
    desc: "Dry garden soil. Water it, then plant a seed."
};
elements.crop_plot = {
    color: ["#8a6a45", "#8ecf8a", "#e2c56b"],
    behavior: behaviors.WALL,
    category: "life",
    state: "solid",
    ignoreGravity: true,
    desc: "A growing crop. Water it, then harvest when the color is ripe.",
    tick: function(pixel) {
        if (!pixel.crop) pixel.crop = "wheat";
        if (!pixel.wet) {
            pixel.color = "#c4a574";
            return;
        }
        pixel.age = (pixel.age || 0) + 1;
        var info = farmCrops[pixel.crop] || farmCrops.wheat;
        var stage = pixel.age > 90 ? 2 : (pixel.age > 40 ? 1 : 0);
        pixel.color = info.colors[stage];
        pixel.ripe = stage === 2;
    }
};

function plantSeed(pixel, crop) {
    if (!pixel) return;
    if (pixel.element !== "farm_soil" && pixel.element !== "crop_plot" && pixel.element !== "compost") {
        worldLog("Plant on farm soil.");
        return;
    }
    var x = pixel.x;
    var y = pixel.y;
    changePixel(pixel, "crop_plot");
    var grown = pixelMap && pixelMap[x] ? pixelMap[x][y] : pixel;
    if (grown) {
        grown.crop = crop;
        grown.age = 0;
        grown.wet = true;
        grown.ripe = false;
        grown.color = farmCrops[crop].colors[0];
    }
    worldLog("Planted " + crop + ". Keep it watered.");
}

elements.wheat_seed = { color: "#e2c56b", category: "tools", tool: function(pixel) { plantSeed(pixel, "wheat"); } };
elements.tomato_seed = { color: "#d63b2f", category: "tools", tool: function(pixel) { plantSeed(pixel, "tomato"); } };
elements.carrot_seed = { color: "#f08a2a", category: "tools", tool: function(pixel) { plantSeed(pixel, "carrot"); } };
elements.potato_seed = { color: "#c4a46a", category: "tools", tool: function(pixel) { plantSeed(pixel, "potato"); } };
elements.lettuce_seed = { color: "#6fbf4a", category: "tools", tool: function(pixel) { plantSeed(pixel, "lettuce"); } };
elements.corn_seed = { color: "#f2d24a", category: "tools", tool: function(pixel) { plantSeed(pixel, "corn"); } };
elements.berry_seed = { color: "#8e2f55", category: "tools", tool: function(pixel) { plantSeed(pixel, "berry"); } };
elements.harvest = {
    color: "#6fbf4a",
    category: "tools",
    tool: function(pixel) {
        if (!pixel || pixel.element !== "crop_plot") return;
        if (!pixel.ripe) {
            worldLog("Not ripe yet. Water it and wait.");
            return;
        }
        var info = farmCrops[pixel.crop] || farmCrops.wheat;
        var x = pixel.x;
        var y = pixel.y;
        changePixel(pixel, info.food);
        worldLog("Harvested " + info.food + ".");
        if (isEmpty(x, y + 1)) createPixel("farm_soil", x, y + 1);
    }
};

var jobTargets = {
    follow: ["come_here_flag"],
    guard: ["come_here_flag", "room_door"],
    sleep: ["room_bed", "bunk_bed"],
    rest: ["hammock", "sleeping_bag", "tent", "room_bed", "beach_umbrella", "bird_nest"],
    read: ["room_shelf", "desk"],
    study: ["desk", "computer", "chalkboard", "globe"],
    play: ["room_toybox", "toy_blocks", "ball", "dollhouse", "tent", "room_rug"],
    water: ["room_plant", "flower_pot", "palm", "crop_plot", "farm_soil", "plant_nest"],
    farm: ["crop_plot", "farm_soil", "scarecrow"],
    dance: ["room_radio", "speaker", "piano"],
    music: ["piano", "drum", "room_radio"],
    watch: ["tv", "aquarium", "sofa"],
    draw: ["easel"],
    wash: ["sink", "bathtub", "shower"],
    tidy: ["laundry_basket", "broom_hook", "trash_bin"],
    warm: ["fireplace", "candle"],
    dress: ["wardrobe", "dresser", "coat_rack", "mirror"],
    look: ["telescope", "room_window", "mailbox"],
    cook: ["counter", "fridge", "room_table", "dining_set"],
    eat: ["dining_set", "room_table", "picnic_blanket", "fridge"],
    build: ["toolbox"]
};

function learnRank(xp) {
    if (xp < 40) return "new";
    if (xp < 120) return "learning";
    if (xp < 280) return "practiced";
    return "skilled";
}

function ensureLearner(pixel) {
    if (pixel.xp == null) pixel.xp = 0;
    if (!pixel.skills) pixel.skills = { walk: 0, eat: 0, read: 0, dance: 0, sleep: 0, play: 0, water: 0, follow: 0, write: 0 };
    if (!pixel.best) pixel.best = "walk";
    if (!pixel.job) pixel.job = "sit";
    if (!pixel.mood) pixel.mood = "okay";
    if (pixel.resting == null) pixel.resting = false;
    if (pixel.hunger == null) pixel.hunger = 20;
    if (pixel.energy == null) pixel.energy = 80;
    if (!pixel.words) pixel.words = ["hello"];
    if (!pixel.note) pixel.note = "hello";
    if (pixel.will == null) pixel.will = true;
}

function gainSkill(pixel, name, amount) {
    ensureLearner(pixel);
    pixel.skills[name] = (pixel.skills[name] || 0) + amount;
    pixel.xp += amount;
    var old = pixel.rank || "new";
    pixel.rank = learnRank(pixel.xp);
    if ((pixel.skills[name] || 0) > (pixel.skills[pixel.best] || 0)) pixel.best = name;
    if (pixel.rank !== old) worldLog("Companion is now " + pixel.rank + ". Best skill: " + pixel.best + ".");
}

function moveChance(pixel) {
    ensureLearner(pixel);
    return Math.min(0.9, 0.28 + pixel.xp / 500);
}

elements.companion = {
    color: ["#f1c7a6", "#e0b090", "#c68642", "#8d5524", "#f7d7b5"],
    behavior: behaviors.STURDYPOWDER,
    category: "life",
    state: "solid",
    density: 980,
    desc: "A learner. They get better at jobs the longer they practice.",
    tick: function(pixel) {
        ensureLearner(pixel);
        if (Math.random() < 0.04) gainSkill(pixel, "walk", 1);
        ownWill(pixel);
        if (pixel.job === "write" || Math.random() < 0.02) writeToFriend(pixel);

        // Skilled companions start a learned habit on their own.
        if (pixel.job === "sit" && !pixel.resting && pixel.xp > 80 && Math.random() < 0.01) {
            if (timeName(dayTime) === "night" && pixel.skills.sleep > 20) pixel.job = "sleep";
            else if (pixel.best === "eat") pixel.job = "eat";
            else if (pixel.best === "read") pixel.job = "read";
            else if (pixel.best === "play") pixel.job = "play";
            else if (pixel.best === "dance") pixel.job = "dance";
            else pixel.job = "wander";
            worldLog("Companion remembered a habit: " + pixel.job + ".");
        }

        if (pixel.job === "wave") {
            if (Math.random() < 0.1) pixel.color = "#f7d7b5";
            return;
        }
        if (pixel.resting) {
            gainSkill(pixel, "sleep", 1);
            if (timeName(dayTime) !== "night" && Math.random() < 0.02) {
                pixel.resting = false;
                pixel.job = "sit";
                worldLog("Companion woke up.");
            }
            return;
        }
        if (pixel.job === "sit") return;

        if (pixel.job === "wander") {
            gainSkill(pixel, "walk", 1);
            if (Math.random() < moveChance(pixel)) {
                var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                var d = dirs[Math.floor(Math.random() * dirs.length)];
                tryMove(pixel, pixel.x + d[0], pixel.y + d[1]);
            }
            return;
        }
        if (pixel.job === "dance") {
            gainSkill(pixel, "dance", 1);
            var radio = nearestPixel(pixel, function(p) { return p.element === "room_radio"; }, 30);
            if (radio && Math.abs(radio.x - pixel.x) + Math.abs(radio.y - pixel.y) > 1) stepToward(pixel, radio.x, radio.y);
            else if (Math.random() < moveChance(pixel)) {
                var hop = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
                tryMove(pixel, pixel.x + hop[0], pixel.y + hop[1]);
            }
            return;
        }

        var names = jobTargets[pixel.job];
        if (names) {
            var skill = pixel.skills[pixel.job] != null ? pixel.job : "walk";
            gainSkill(pixel, skill, 1);
            var spot = nearestPixel(pixel, function(p) { return names.indexOf(p.element) >= 0; }, 40 + Math.floor(pixel.xp / 20));
            if (!spot) return;
            if (Math.random() < moveChance(pixel) && stepToward(pixel, spot.x, spot.y)) {
                if (pixel.job === "water" || pixel.job === "farm") {
                    spot.wet = true;
                    if (spot.element === "room_plant" || spot.element === "flower_pot" || spot.element === "palm") spot.color = "#3dce6a";
                    pixel.job = "sit";
                    worldLog("Companion watered the garden.");
                } else if (pixel.job === "sleep" || pixel.job === "rest") {
                    pixel.resting = true;
                    worldLog("Companion is resting.");
                } else if (pixel.job === "wash") {
                    pixel.job = "sit";
                    worldLog("Companion washed up.");
                } else if (pixel.job === "dress") {
                    pixel.color = ["#6f8fbf", "#d4543c", "#3d7ea6", "#f0c43a"][Math.floor(Math.random() * 4)];
                    pixel.job = "sit";
                    worldLog("Companion changed clothes.");
                } else if (pixel.job === "tidy") {
                    pixel.job = "sit";
                    worldLog("Companion tidied up.");
                } else if (pixel.job === "watch") {
                    if (spot.element === "tv") spot.on = true;
                    worldLog("Companion is watching.");
                } else if (pixel.job !== "guard" && pixel.job !== "follow" && pixel.job !== "warm" && pixel.job !== "music" && pixel.job !== "dance") {
                    pixel.job = "sit";
                    worldLog("Companion finished " + skill + ".");
                }
            }
            return;
        }
        if (pixel.job === "eat") {
            gainSkill(pixel, "eat", 1);
            var meal = nearestPixel(pixel, function(p) { return foodNames[p.element]; }, 16 + Math.floor(pixel.xp / 25));
            if (!meal) {
                var table = nearestPixel(pixel, function(p) { return p.element === "room_table" || p.element === "dining_set" || p.element === "fridge" || p.element === "picnic_blanket"; }, 24);
                if (table && Math.random() < moveChance(pixel)) stepToward(pixel, table.x, table.y);
                return;
            }
            if (Math.abs(meal.x - pixel.x) + Math.abs(meal.y - pixel.y) <= 1) {
                deletePixel(meal.x, meal.y);
                pixel.job = "sit";
                pixel.mood = "happy";
                gainSkill(pixel, "eat", 8);
                worldLog("Companion ate. Eating skill is now " + pixel.skills.eat + ".");
            } else if (Math.random() < moveChance(pixel)) {
                stepToward(pixel, meal.x, meal.y);
            }
        }
    }
};

elements.come_here_flag = {
    color: ["#ff5555", "#ffffff", "#ff5555"],
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    desc: "Companions set to follow or guard will come to this flag."
};

function setJob(pixel, job, line) {
    if (!pixel || pixel.element !== "companion") return;
    ensureLearner(pixel);
    pixel.resting = false;
    pixel.job = job;
    pixel.ordered = true;
    pixel.orderTime = 180;
    gainSkill(pixel, job === "sit_chair" ? "walk" : (pixel.skills[job] != null ? job : "walk"), 2);
    worldLog(line + " Rank: " + pixel.rank + ".");
}

function ownWill(pixel) {
    ensureLearner(pixel);
    pixel.hunger = Math.min(100, pixel.hunger + 0.15);
    pixel.energy = Math.max(0, pixel.energy - 0.05);
    if (pixel.ordered) {
        pixel.orderTime = (pixel.orderTime || 0) - 1;
        if (pixel.orderTime <= 0) pixel.ordered = false;
        return;
    }
    if (!pixel.will || pixel.resting) return;
    if (pixel.hunger > 70) { pixel.job = "eat"; pixel.note = "I am hungry"; return; }
    if (pixel.energy < 25 || timeName(dayTime) === "night") { pixel.job = "sleep"; pixel.note = "good night"; return; }
    if (pixel.xp > 60 && Math.random() < 0.008) {
        var ideas = ["play", "read", "wander", "water", "farm", "write"];
        pixel.job = ideas[Math.floor(Math.random() * ideas.length)];
        pixel.note = "I want to " + pixel.job;
        worldLog("Companion chose to " + pixel.job + ".");
    }
}

function writeToFriend(pixel) {
    var friend = nearestPixel(pixel, function(p) { return p.element === "companion" && p !== pixel; }, 6);
    if (!friend) return;
    ensureLearner(friend);
    if (Math.random() > 0.04) return;
    var line = pixel.note || pixel.words[Math.floor(Math.random() * pixel.words.length)];
    if (friend.words.indexOf(line) < 0 && friend.words.length < 12) friend.words.push(line);
    friend.note = line;
    gainSkill(pixel, "write", 2);
    gainSkill(friend, "write", 1);
    if (pixel.xp > 40 && Math.random() < 0.3 && !friend.ordered) friend.job = pixel.job;
    worldLog("Wrote to a friend: " + line);
    if (isEmpty(pixel.x + 1, pixel.y)) {
        createPixel("note_paper", pixel.x + 1, pixel.y);
    }
}

elements.say_sit = { color: "#88aaff", category: "tools", tool: function(pixel) { setJob(pixel, "sit", "Companion will sit."); } };
elements.say_wander = { color: "#aaff88", category: "tools", tool: function(pixel) { setJob(pixel, "wander", "Companion will wander."); } };
elements.say_follow = { color: "#ffaa88", category: "tools", tool: function(pixel) { setJob(pixel, "follow", "Companion will follow the flag."); } };
elements.say_eat = { color: "#ffdd88", category: "tools", tool: function(pixel) { setJob(pixel, "eat", "Companion will look for food."); } };
elements.say_sleep = { color: "#6f8fbf", category: "tools", tool: function(pixel) { setJob(pixel, "sleep", "Companion will go to a bed."); } };
elements.say_sit_chair = { color: "#c9843a", category: "tools", tool: function(pixel) { setJob(pixel, "sit_chair", "Companion will sit in a chair."); } };
elements.say_read = { color: "#24577a", category: "tools", tool: function(pixel) { setJob(pixel, "read", "Companion will read by the shelf."); } };
elements.say_dance = { color: "#d4543c", category: "tools", tool: function(pixel) { setJob(pixel, "dance", "Companion will dance by the radio."); } };
elements.say_play = { color: "#e0b03a", category: "tools", tool: function(pixel) { setJob(pixel, "play", "Companion will play by the toy box."); } };
elements.say_wave = { color: "#f7d7b5", category: "tools", tool: function(pixel) { setJob(pixel, "wave", "Companion waves hello."); } };
elements.say_water = { color: "#3aa0d8", category: "tools", tool: function(pixel) { setJob(pixel, "water", "Companion will water a plant."); } };
elements.say_guard = { color: "#888888", category: "tools", tool: function(pixel) { setJob(pixel, "guard", "Companion will guard the door or flag."); } };
elements.say_rest = { color: "#c9843a", category: "tools", tool: function(pixel) { setJob(pixel, "rest", "Companion will rest in a hammock or bag."); } };
elements.say_study = { color: "#24577a", category: "tools", tool: function(pixel) { setJob(pixel, "study", "Companion will study at the desk."); } };
elements.say_watch = { color: "#7ec8e3", category: "tools", tool: function(pixel) { setJob(pixel, "watch", "Companion will watch the TV or fish."); } };
elements.say_draw = { color: "#f2a0b0", category: "tools", tool: function(pixel) { setJob(pixel, "draw", "Companion will draw at the easel."); } };
elements.say_music = { color: "#22242a", category: "tools", tool: function(pixel) { setJob(pixel, "music", "Companion will play music."); } };
elements.say_wash = { color: "#b7c0c9", category: "tools", tool: function(pixel) { setJob(pixel, "wash", "Companion will wash up."); } };
elements.say_tidy = { color: "#3d7ea6", category: "tools", tool: function(pixel) { setJob(pixel, "tidy", "Companion will tidy the room."); } };
elements.say_warm = { color: "#e07a3a", category: "tools", tool: function(pixel) { setJob(pixel, "warm", "Companion will warm up by the fire."); } };
elements.say_dress = { color: "#6f8fbf", category: "tools", tool: function(pixel) { setJob(pixel, "dress", "Companion will change clothes."); } };
elements.say_look = { color: "#4a4e57", category: "tools", tool: function(pixel) { setJob(pixel, "look", "Companion will look outside."); } };
elements.say_cook = { color: "#c4493a", category: "tools", tool: function(pixel) { setJob(pixel, "cook", "Companion will go to the kitchen."); } };
elements.say_build = { color: "#a56b3c", category: "tools", tool: function(pixel) { setJob(pixel, "build", "Companion will use the toolbox."); } };
elements.say_farm = { color: "#6fbf4a", category: "tools", tool: function(pixel) { setJob(pixel, "farm", "Companion will tend the garden."); } };
elements.say_write = { color: "#e6d3a3", category: "tools", tool: function(pixel) { setJob(pixel, "write", "Companion will write to a nearby friend."); } };
elements.note_paper = {
    color: ["#f7f4ee", "#e6d3a3", "#6fbf4a"],
    behavior: behaviors.POWDER,
    category: "special",
    state: "solid",
    density: 200,
    desc: "A note left by a companion. Click with Read Note."
};
elements.read_note = {
    color: "#f7f4ee",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        if (pixel.element === "companion") {
            ensureLearner(pixel);
            worldLog("Knows: " + pixel.words.join(", ") + ". Note: " + pixel.note);
        } else if (pixel.element === "note_paper") {
            worldLog("The note says hello, or whatever the writer last learned.");
        }
    }
};
elements.check_learning = {
    color: "#b8e0ff",
    category: "tools",
    tool: function(pixel) {
        if (!pixel || pixel.element !== "companion") return;
        ensureLearner(pixel);
        worldLog("Rank " + learnRank(pixel.xp) + ", xp " + pixel.xp + ", best " + pixel.best + ", job " + pixel.job + ".");
    }
};

elements.sky_lamp = {
    color: "#7ec8e3",
    behavior: behaviors.WALL,
    category: "special",
    state: "solid",
    ignoreGravity: true,
    tick: function(pixel) { pixel.color = skyColor(dayTime); }
};
elements.check_time = {
    color: "#ffe9a8",
    category: "tools",
    tool: function() { worldLog("Time: " + timeName(dayTime) + " (" + dayTime + ")"); }
};

if (typeof runEveryTick === "function") {
    runEveryTick(function() {
        dayTime = (dayTime + 1) % dayLength;
        if (typeof pixelTicks !== "undefined" && pixelTicks % 60 === 0) worldLog("It is " + timeName(dayTime) + ".");
    });
}

// Texture pass: gives a pixel a wood, cloth, stone, or paint grain.
function paintGrain(pixel, hex) {
    if (!pixel) return;
    var n = ((pixel.x * 17 + pixel.y * 11) % 26) - 13;
    pixel.color = shade(hex, n);
}

elements.texture_wood = { color: "#8b5a2b", category: "tools", tool: function(pixel) { paintGrain(pixel, "#8b5a2b"); } };
elements.texture_cloth = { color: "#b94a48", category: "tools", tool: function(pixel) { paintGrain(pixel, "#b94a48"); } };
elements.texture_stone = { color: "#9aa0a6", category: "tools", tool: function(pixel) { paintGrain(pixel, "#9aa0a6"); } };
elements.texture_paint = { color: "#d9d3c7", category: "tools", tool: function(pixel) { paintGrain(pixel, "#d9d3c7"); } };
elements.detail_brush = {
    color: "#d8d0c4",
    category: "tools",
    tool: function(pixel) {
        if (!pixel) return;
        var n = (pixel.x * 13 + pixel.y * 7) % 30 - 15;
        pixel.color = "rgb(" + (150 + n) + "," + (132 + n) + "," + (108 + n) + ")";
    }
};
