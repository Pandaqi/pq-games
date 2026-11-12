export const shuffle = <T>(array:T[], RNG = Math.random) : T[] =>
{
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(RNG() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const shuffleAll = <T>(val:T, RNG = Math.random) : T =>
{
    if(!Object.keys(val)) { console.error("Can't shuffle (all) this value", val); return val; }

    for(const [key,data] of Object.entries(val))
    {
        if(Array.isArray(data)) { shuffle(data, RNG); }
        else { shuffleAll(data, RNG); }
    }
    return val;
}