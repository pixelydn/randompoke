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
    const variety = species.id == 1007 || species.id == 1008 ? varieties[0] : 
                    varieties[getRandomInt(0, varieties.length - 1)];

    return await fetchJson(variety.pokemon.url);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// (258, "other/dream-world/", ".svg") => .../sprites/pokemon/other/dream-world/258.svg
function getSpriteUrl(id, path, ext, allowFemale) {
    const spritePath = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
    return spritePath + 
        path + 
        (pokemon.shiny ? "shiny/" : "") +
        (allowFemale && pokemon.hasGenderDifferences && pokemon.gender == "female" ? "female/" : "") + 
        id + 
        ext;
}

function getPokemon(id, species, varient) {
    // very simplified here
    // I was using 'isShiny' and I do think it is better but 'shiny' fits better in an object 
    return {
        id: varient.id,
        name: varient.name,
        dex: id,
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
        nature: natures[getRandomInt(0, natures.length - 1)],
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

        // my own sprites, only for mega zygarde
        "https://pixelydn.github.io/pokesets/sprites/zygarde/zygarde-mega" + (pokemon.shiny ? "-shiny" : "") + ".png",
    ];
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

    name.innerHTML = pokemon.name
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

    pokemon = getPokemon(id, species, variant);
    console.log(pokemon);

    makePokemon(id);
    updateIVChart();
    updateBSTChart();
}
button.onclick = generate;