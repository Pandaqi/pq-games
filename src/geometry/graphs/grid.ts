import { Vector2 } from "..";

type CellLike = { pos:Vector2, setNeighbors:Function }

export enum GridNeighborType
{
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
    ORTHOGONAL = "orthogonal",
    DIAGONAL = "diagonal",
    ALL = "all"
}

export const GRID_NEIGHBOR_OFFSETS = 
{
    [GridNeighborType.HORIZONTAL]: [Vector2.LEFT, Vector2.RIGHT],
    [GridNeighborType.VERTICAL]: [Vector2.UP, Vector2.DOWN],
    [GridNeighborType.ORTHOGONAL]: [Vector2.LEFT, Vector2.DOWN, Vector2.RIGHT, Vector2.UP],
    [GridNeighborType.DIAGONAL]: [Vector2.TOP_LEFT, Vector2.TOP_RIGHT, Vector2.BOTTOM_LEFT, Vector2.BOTTOM_RIGHT],
    [GridNeighborType.ALL]: [Vector2.TOP_LEFT, Vector2.UP, Vector2.TOP_RIGHT, Vector2.RIGHT, Vector2.BOTTOM_RIGHT, Vector2.DOWN, Vector2.BOTTOM_LEFT, Vector2.LEFT]
}

export const createGrid = (dims:Vector2, callback:Function) =>
{
    const grid = [];
    for(let x = 0; x < dims.x; x++)
    {
        grid[x] = [];
        for(let y = 0; y < dims.y; y++)
        {
            grid[x][y] = callback(new Vector2(x,y));
        }
    }
    return grid;
}

const outOfBounds = (pos:Vector2, dims:Vector2) =>
{
    return pos.x < 0 || pos.y < 0 || pos.x >= dims.x || pos.y >= dims.y;
}

export interface GridNeighborParams
{
    grid: CellLike[][],
    type?: GridNeighborType,
    filter?: Function
}

const DEFAULT_FILTER = (a:CellLike,b:CellLike) => { return true; };

export const assignGridNeighbors = (params:GridNeighborParams) =>
{
    const grid = params.grid;
    const type = params.type ?? GridNeighborType.ORTHOGONAL;

    const filter = params.filter ?? DEFAULT_FILTER;

    const dims = new Vector2(grid.length, grid[0].length);
    const cells = grid.flat();
    for(const cell of cells)
    {
        const OFFSETS = GRID_NEIGHBOR_OFFSETS[type];
        const neighbors = [];
        for(const offset of OFFSETS)
        {
            const nbPos = new Vector2(cell.pos.x + offset.x, cell.pos.y + offset.y);
            if(outOfBounds(nbPos, dims)) { continue; }
            const nb = grid[nbPos.x][nbPos.y];
            if(!filter(cell, nb)) { continue; }
            neighbors.push();
        }
        cell.setNeighbors(neighbors);
    }
}