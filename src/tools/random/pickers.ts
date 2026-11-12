import { shuffle } from "./shufflers"
import { Bounds } from "../numbers/bounds";
import { lerp } from "../numbers/lerp";

export const fromArray = <T>(arr:T[], RNG = Math.random) : T =>
{
    const l = arr.length;
    if(l <= 0) { console.error("Can't draw from empty array"); return null; }
    return arr[Math.floor(RNG() * l)];
}

export const getTotalForKey = <T>(obj:Record<string,T>, key:string = "prob") : number =>
{
    let sum = 0;
    for(const val of Object.values(obj))
    {
        sum += (val[key] ?? 1.0);
    }
    return sum;
}

export const getWeightedByIndex = <T>(arr:T[], desc = false, squish = 1.0, RNG = Math.random) : number =>
{
    const dict : Record<number, { prob:number }> = {};
    
    let bounds = new Bounds(1.0, squish*arr.length);
    bounds.sortAsc();

    for(let i = 0; i < arr.length; i++)
    {
        let factor = i / (arr.length - 1);
        if(desc) { factor = 1.0 - factor; }

        const prob = lerp(bounds.min, bounds.max, factor);
        dict[i] = { prob: prob }
    }

    const key = getWeighted(dict, "prob", RNG);
    return parseInt(key);
}

export const getWeighted = <T>(obj:Record<string,T>, key = "prob", RNG = Math.random) : string =>
{
    const isArray = Array.isArray(obj);
    const typesObject = obj;
    const totalProb = getTotalForKey(typesObject, key);
    const probFraction = 1.0 / totalProb;
    const targetRand = RNG();
    let runningSum = 0.0;
    let counter = 0;
    let lastElem = "";

    let typesList = Object.keys(typesObject);
    if(isArray) { typesList = obj; }

    shuffle(typesList, RNG); // to prevent order accidentally playing ANY role
    while(runningSum < targetRand)
    {
        if(counter >= typesList.length) { console.error("getWeighted => loop extended beyond list of types, must be wrong input"); break; }
        const newElem = typesList[counter];
        counter++;

        let prob = 1.0;
        if(isArray) { 
            prob = newElem[key] ?? 1;
        } else { 
            prob = typesObject[newElem][key] ?? 1; 
        }
        if(prob <= 0) { continue; }

        runningSum += prob * probFraction;
        lastElem = newElem;
    }

    return lastElem;
}