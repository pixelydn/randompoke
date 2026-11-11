const spriteBox = document.querySelector(".sprite-container");
const sprite = document.querySelector(".sprite");
const button = document.querySelector(".generate");
const gender = document.querySelector(".gender");
const name = document.querySelector(".name");
const color = document.querySelector(".color");
const shinyIcon = document.querySelector(".shiny-icon");
const ivCanvas = document.querySelector(".iv-chart");
const bstCanvas = document.querySelector(".bst-chart");
const nature = document.querySelector(".nature");
const dexNumber = document.querySelector(".dex-number");

const natures = [
    "Bashful (+Sp. Atk, -Sp. Atk)", 
    "Docile (+Defense, -Defense)", 
    "Hardy (+Attack, -Attack)", 
    "Quirky (+Sp. Def, -Sp. Def)", 
    "Serious (+Speed, -Speed)", 
    "Adamant (+Attack, -Sp. Atk)", 
    "Brave (+Attack, -Speed)", 
    "Lonely (+Attack, -Defense)", 
    "Naughty (+Attack, -Sp. Def)", 
    "Bold (+Defense, -Attack)", 
    "Impish (+Defense, -Sp. Atk)", 
    "Lax (+Defense, -Sp. Def)", 
    "Relaxed (+Defense, -Speed)", 
    "Mild (+Sp. Atk, -Defense)", 
    "Modest (+Sp. Atk, -Attack)", 
    "Quiet (+Sp. Atk, -Speed)", 
    "Rash (+Sp. Atk, -Sp. Def)", 
    "Calm (+Sp. Def, -Attack)", 
    "Careful (+Sp. Def, -Sp. Atk)", 
    "Gentle (+Sp. Def, -Defense)", 
    "Sassy (+Sp. Def, -Speed)", 
    "Hasty (+Speed, -Defense)", 
    "Jolly (+Speed, -Sp. Atk)", 
    "Naive (+Speed, -Sp. Def)", 
    "Timid (+Speed, -Attack)",
];

// set chart.js fonts here
Chart.defaults.font.family = "'Pixelify Sans', monospace";
Chart.defaults.color = "white";

let pokemon = {};
const shinyOdd = 4096;

// use chart.js to make iv chart
const ivChart = new Chart(ivCanvas, {
    type: "radar",
    data: {
        labels: [
            ["HP", 0],
            ["Atk", 0],
            ["Def", 0],
            ["Spe", 0],
            ["SpD", 0],
            ["SpA", 0],
        ],
        datasets: [{                                        // <== path to here is ivChart.data.datasets[0].data
            label: "IV",
            // init to 0
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            borderColor: "white",
            pointBackgroundColor: "white",
        }],
    },
    options: {
        plugins: {
            legend: { display: false },
        },
        scales: {
            r: {
                min: 0,
                max: 31,
                ticks: { display: false },
                grid: { color: "white" },
                angleLines: { color: "white" },
                pointLabels: { color: "white" },
            },
        },
    },
});

const bstChart = new Chart(bstCanvas, {
    type: "bar",
    data: {
        labels: [0, 0, 0, 0, 0, 0],
        datasets: [{
        label: "Base Stat",
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: "white",
        }],
    },
    options: {
        maintainAspectRatio: false, // use my scaling
        indexAxis: "y", // vertically stacking
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                min: 0,
                max: 255,
                ticks: {
                    display: false, 
                    stepSize: 50,
                },
                border: { display: false },
                grid: {
                    color: "rgba(255, 255, 255, 0.25)",
                    drawTicks: false,
                },
            },
            y: {
                grid: { display: false },
                ticks: {
                    color: "white",
                    crossAlign: "far",  // left align the numbers
                },
                // lock the number column width so the bars don't shift
                afterFit: function (scale) {
                    scale.width = 40;
                },
            },
        },
    },
});

// async function to allow the use of await
async function fetchJson(url) {
    const banana = await fetch(url);
    return await banana.json();
}

async function fetchSpecies(id) {
    return await fetchJson("https://pokeapi.co/api/v2/pokemon-species/" + id);
}

async function fetchVarieties(species) {
    const varieties = species.varieties;

    // koraidon and miraidon only get their default form (the ride forms have no gen 5 sprite)
    // varieties[0] is the 1st entry, default form
    const variety = species.id == 1007 || species.id == 1008 ? varieties[0] : 
                    randomItem(varieties);

    return await fetchJson(variety.pokemon.url);
}

// variant => the data for one random look (e.g. sawsbuck-summer, unown-b)
async function fetchForm(variant) {
    const forms = variant.forms;
    const form = randomItem(forms);

    // always use the url pokeapi gives us, form ids are NOT the same as variant ids
    return await fetchJson(form.url);
}

// loop over every entry for the english one
function getEnglish(list) {
    const result = [];

    for (const entry of list) {
        if (entry.language.name == "en") {
            result.push(entry);
        }
    }

    return result;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// (586, "versions/generation-v/black-white/", ".png") => .../black-white/586-summer.png for a summer sawsbuck
function getSpriteUrl(id, path, ext, allowFemale) {
    const spritePath = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
    return spritePath + 
        path + 
        (pokemon.shiny ? "shiny/" : "") +
        (allowFemale && pokemon.hasGenderDifferences && pokemon.gender == "female" ? "female/" : "") + 
        id + 
        pokemon.formSuffix +    // "" for normal forms, "-summer" etc for other looks
        ext;
}

function getPokemon(id, species, varient) {
    // very simplified here
    // I was using 'isShiny' and I do think it is better but 'shiny' fits better in an object 

    // english name from the species, e.g. "Rattata"
    // located in the 1st item, accessed by [0]
    const speciesNames = getEnglish(species.names);
    // english dex entries from the species, the last one is the newest game
    const speciesEntries = getEnglish(species.flavor_text_entries);

    return {
        id: varient.id,
        name: varient.name,
        // check id there are at least 1 english name
        displayName: speciesNames.length > 0 ? speciesNames[0].name : varient.name,
        dex: id,
        dexEntry: speciesEntries.length > 0 ? randomItem(speciesEntries).flavor_text : "",
        formSuffix: "",         // filled in by applyForm
        formSprite: null,       // filled in by applyForm
        gender: getPokemonGender(species.gender_rate),
        hasGenderDifferences: species.has_gender_differences,
        ivs: {
            hp: getRandomInt(0, 31),
            atk: getRandomInt(0, 31),
            def: getRandomInt(0, 31),
            spa: getRandomInt(0, 31),
            spd: getRandomInt(0, 31),
            spe: getRandomInt(0, 31),
        },
        nature: randomItem(natures),
        bst: {
            hp: varient.stats[0].base_stat,
            atk: varient.stats[1].base_stat,
            def: varient.stats[2].base_stat,
            spa: varient.stats[3].base_stat,
            spd: varient.stats[4].base_stat,
            spe: varient.stats[5].base_stat,
        },
        shiny: getRandomInt(1, shinyOdd) == 1,
        color: species.color.name,
    }
}

// if form has extra stuff in it overwrite the entries
function applyForm(form) {
    // nicer name, like Alolan Rattata
    const formNames = getEnglish(form.names);
    pokemon.displayName = formNames.length > 0 ? formNames[0].name : pokemon.displayName;

    // regional forms could have their own dex entries
    // check if they do, then replace it
    const formEntries = getEnglish(form.flavor_text_entries);
    pokemon.dexEntry = formEntries.length > 0 ? cleanText(randomItem(formEntries).flavor_text) : pokemon.dexEntry;

    // non default forms need a suffix
    // sawsbuck-summer will now have the -summer suffix at the sprite
    pokemon.formSuffix = form.is_default ? "" : "-" + form.form_name;
}

// old game text has hidden line breaks (\n) and page breaks (\f), turn them into spaces
function cleanText(text) {
    return text.replaceAll("\n", " ").replaceAll("\f", " ");
}

// ["a", "b", "c"] => one of them, picked at random
function randomItem(list) {
    return list[getRandomInt(0, list.length - 1)];
}

function makePokemon(id) {

    // fallback order
    const spriteList = [
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/animated/", ".gif", true),
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/", ".png", true),

        // if no female sprite exists
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/animated/", ".gif", false),
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/", ".png", false),

        // did some clac and it turns out thatit will never fallback to this
        // getSpriteUrl(pokemon.id, "other/dream-world/", ".svg"),
        // getSpriteUrl(pokemon.id, "", ".png"),

    ];

    // push to add items to a list
    // my own sprites, only for mega zygarde, variant number 10301
    if (pokemon.id == 10301) {
        spriteList.push("https://pixelydn.github.io/pokesets/sprites/zygarde/zygarde-mega" + (pokemon.shiny ? "-shiny" : "") + ".png");
    }

    let spriteIndex = 0;

    sprite.src = spriteList[0];
    sprite.alt = pokemon.name;
    // sprite.style.scale = "2";

    // try the next sprite in the list until one loads
    sprite.onerror = function () {
        spriteIndex = spriteIndex + 1;
        if (spriteIndex < spriteList.length) {
            sprite.src = spriteList[spriteIndex];
        }
    }

    gender.innerHTML =
        pokemon.gender == "male" ? "&male;" :
        pokemon.gender == "female" ? "&female;" :
        "";
    gender.style.color =
        pokemon.gender == "male" ? "#4ccafd" :
        pokemon.gender == "female" ? "#f79892" :
        "";
    nature.innerHTML = pokemon.nature;

    dexNumber.innerHTML = "# " + pokemon.dex;

    color.style.backgroundColor = pokemon.color;
    shinyIcon.style.visibility = pokemon.shiny ? "visible" : "hidden";
    sprite.style.visibility = "visible";

    name.innerHTML = pokemon.displayName;
}

function updateIVChart() {
    ivChart.data.datasets[0].data = [
        pokemon.ivs.hp,
        pokemon.ivs.atk,
        pokemon.ivs.def,
        pokemon.ivs.spe,
        pokemon.ivs.spd,
        pokemon.ivs.spa,
    ];

    ivChart.data.labels = [
        ["HP", pokemon.ivs.hp],
        ["Atk", pokemon.ivs.atk],
        ["Def", pokemon.ivs.def],
        ["Spe", pokemon.ivs.spe],
        ["SpD", pokemon.ivs.spd],
        ["SpA", pokemon.ivs.spa],
    ];

    ivChart.update();
}

function updateBSTChart() {
    bstChart.data.datasets[0].data = [
        pokemon.bst.hp,
        pokemon.bst.atk,
        pokemon.bst.def,
        pokemon.bst.spa,
        pokemon.bst.spd,
        pokemon.bst.spe,
    ];

    bstChart.data.labels = [
        pokemon.bst.hp,
        pokemon.bst.atk,
        pokemon.bst.def,
        pokemon.bst.spa,
        pokemon.bst.spd,
        pokemon.bst.spe,
    ];

    bstChart.update();
}

function getPokemonGender(rate) {
    if (rate == -1) {
        return "genderless";
    }
    return getRandomInt(1, 8) <= rate ? "female" : "male";
}

async function generate() {
    const id = getRandomInt(1, 1025);
    // const id = 806  // testing use

    const species = await fetchSpecies(id);
    console.log(species);

    const variant = await fetchVarieties(species);
    console.log(variant);

    const form = await fetchForm(variant);
    console.log(form);

    // form overwrites existing data
    pokemon = getPokemon(id, species, variant);
    applyForm(form);

    console.log(pokemon);

    makePokemon(id);
    updateIVChart();
    updateBSTChart();
}
button.onclick = generate;