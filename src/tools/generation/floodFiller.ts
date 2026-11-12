import { Vector2 } from "../../geometry/vector2";
import { Bounds } from "../numbers/bounds";
import { fromArray } from "../random/pickers";
import { rangeInteger } from "../random/ranges";

const NB_OFFSETS = [Vector2.RIGHT, Vector2.DOWN, Vector2.LEFT, Vector2.UP];

export type FloodFillElement = { x: number, y: number }
export interface FloodFillParams
{
    start?:FloodFillElement
    grid?:FloodFillElement[][],
    neighborFunction?: string // this is a function ON the element itself
    neighborPickFunction?: (list:FloodFillElement[], nbs:FloodFillElement[]) => FloodFillElement
    filter?: (a:FloodFillElement, b:FloodFillElement) => boolean // if this returns false, a cell isn't allowed for growing
    bounds?: Bounds|{ min: number, max: number },
    existing?: FloodFillElement[],
    mask?: FloodFillElement[],
    forbidden?: FloodFillElement[]
}

const outOfBounds = (pos: Vector2, grid: FloodFillElement[][]) =>
{
    return pos.x < 0 || pos.y < 0 || pos.x >= grid.length || pos.y >= grid[0].length
}

export const getValidFloodFillNeighbors = (elem:FloodFillElement, grid) =>
{
    const nbs = [];
    // @ts-ignore
    const basePos = new Vector2(elem.x, elem.y);
    for(const offset of NB_OFFSETS)
    {
        var pos = basePos.clone().move(offset);
        if(outOfBounds(pos, grid)) { continue; }
        
        const cell = grid[pos.x][pos.y];
        nbs.push(cell);
    }
    return nbs;
}

export const getAllValidFloodFillNeighbors = (list:FloodFillElement[], config:FloodFillParams) : FloodFillElement[] =>
{
    const nbSet:Set<FloodFillElement> = new Set();
    for(const cell of list)
    {
        const nbs = config.neighborFunction ? cell[config.neighborFunction]() : getValidFloodFillNeighbors(cell, config.grid);
        for(const nb of nbs)
        {
            if(list.includes(nb)) { continue; }
            if(config.forbidden.includes(nb)) { continue; }
            if(config.mask.length > 0 && !config.mask.includes(nb)) { continue; }
            if(!config.filter(cell, nb)) { continue; }
            nbSet.add(nb)
        }
    }
    return Array.from(nbSet);
}

const DEFAULT_FILTER = (a:FloodFillElement, b:FloodFillElement) => { return true; };
const DEFAULT_PICK_FUNCTION = (list:FloodFillElement[], nbs:FloodFillElement[]) => { return fromArray(nbs); }

export const configureFloodFill = (params:FloodFillParams) : FloodFillParams =>
{
    let start = params.start;
    const existing = params.existing ?? [];
    const mask = params.mask ?? [];
    const forbidden = params.forbidden ?? [];
    if(existing.length > 0) { start = existing[0]; }

    const grid = params.grid;
    
    const neighborFunction = params.neighborFunction ?? null;
    const filter = params.filter ?? DEFAULT_FILTER;
    const neighborPickFunction = params.neighborPickFunction ?? DEFAULT_PICK_FUNCTION;
    
    const bounds = new Bounds(params.bounds ?? { min: 1, max: 1000000 });

    return { start, existing, mask, forbidden, grid, neighborFunction, filter, neighborPickFunction, bounds };
}

export const floodFill = (params:FloodFillParams) =>
{
    const config = configureFloodFill(params);
    
    const maxSize = (config.bounds as Bounds).random();
    const list = config.existing.length > 0 ? config.existing.slice() : [config.start];

    while(list.length < maxSize)
    {
        const nbs = getAllValidFloodFillNeighbors(list, config);
        if(nbs.length <= 0) { break; }

        const nb = config.neighborPickFunction(list, nbs);
        list.push(nb);
    }

    return list.slice();
}
