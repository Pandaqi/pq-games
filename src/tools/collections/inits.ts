import { Bounds } from "..";

export const initArrayOfArrays = (num = 0) =>
{
    return Array.from({ length: num }, () => []);
}

export const initNumberRange = (min:number|Bounds, max:number = null, step = 1) : number[] =>
{
    const bounds = (min instanceof Bounds) ? min : new Bounds(min, max);
    const arr = [];
    for(let i = bounds.min; i <= bounds.max; i += step)
    {
        arr.push(i);
    }
    return arr;
}

// Do we REALLY need this? :p
export const ensureDictionaryEntry = (dict:Record<string,any>, key:string, def:any = 0) =>
{
    if(key in dict) { return; }
    dict[key] = def;
}