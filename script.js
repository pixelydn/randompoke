const spriteBox = document.querySelector(".sprite-container");
const sprite = document.querySelector(".sprite");
const button = document.querySelector(".generate");
const gender = document.querySelector(".gender");
const name = document.querySelector(".name");
const color = document.querySelector(".color");
const shinyIcon = document.querySelector(".shiny-icon");

let pokemon = {};
const shinyOdd = 4096;

// async function to allow the use of await
async function fetchSpecies(id) {
    const banana = await fetch("https://pokeapi.co/api/v2/pokemon-species/" + id);
    return await banana.json();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// (258, "other/dream-world/", ".svg") => .../sprites/pokemon/other/dream-world/258.svg
function getSpriteUrl(id, path, ext) {
    const spritePath = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
    return spritePath + 
        path +
        (pokemon.shiny ? "shiny/" : "") +
        (pokemon.hasGenderDifferences && pokemon.gender == "female" ? "female/" : "") +
        id + 
        ext;
}

function getPokemon(id, species) {
    // very simplified here
    // I was using 'isShiny' and I do think it is better but 'shiny' fits better in an object 
    return {
        id: id,
        name: species.name,
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
        shiny: getRandomInt(1, shinyOdd) == 1,
        color: species.color.name,
    }
}

function makePokemon(id) {

    // fallback order
    const spriteList = [
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/animated/", ".gif"),
        getSpriteUrl(pokemon.id, "versions/generation-v/black-white/", ".png"),
        getSpriteUrl(pokemon.id, "other/dream-world/", ".svg"),
        getSpriteUrl(pokemon.id, "", ".png"),
    ];
    let spriteIndex = 0;

    sprite.src = spriteList[0];
    sprite.alt = pokemon.name;

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
    color.style.backgroundColor = pokemon.color;
    shinyIcon.style.visibility = pokemon.shiny ? "visible" : "hidden";

    name.innerHTML = pokemon.name
}

function getPokemonGender(rate) {
    if (rate == -1) {
        return "genderless";
    }
    return getRandomInt(1, 8) <= rate ? "female" : "male";
}

async function generate() {
    const id = getRandomInt(1, 1025);

    const species = await fetchSpecies(id);
    console.log(species);

    pokemon = getPokemon(id, species);
    console.log(pokemon)

    makePokemon(id);
}
button.onclick = generate;