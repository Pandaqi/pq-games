import { Bounds } from "../../tools/numbers/bounds";
import { LineGraph } from "./lineGraph";
import { Vector2Graph } from "./vector2Graph";

export class PriorityItem 
{
    priority:number
    elem:any

    constructor(priority:number, elem:any)
    {
        this.priority = priority;
        this.elem = elem;
    }

    getItem() { return this.elem; }
    getPriority() { return this.priority; }
}

export class PriorityQueue 
{
    elements: PriorityItem[]

	constructor() 
    { 
        this.elements = []; 
    }

	isEmpty() 
    { 
        return this.elements.length <= 0; 
    }

    // remove first element from elements, return it
    get() 
    { 
        return this.elements.shift().getItem(); 
    }

    // find correct place in list, then add
	put(item:any, priority:number) {
		let insertIndex = 0;
        for(const elem of this.elements)
        {
            if(elem.getPriority() >= priority) { break; }
            insertIndex++;
        }

        const priorityItem = new PriorityItem(priority, item);
		this.elements.splice(insertIndex, 0, priorityItem);
	}    
}

interface Vector2Valid 
{
	id?: number|string,
	x?: number,
	y?: number,
	gridPos?: { x:number, y:number }
}

export interface PathFindRandomizeParams
{
	points: any[],
	min?: number,
	max?: number
}

type PathFinderHeuristicParams = Record<string,any>

export interface PathFindParams
{
	start?: Vector2Graph,
	end?: Vector2Graph,

	cost?:number,
	costFunction?:(l:LineGraph, score:number) => number,
	costMap?:Map<LineGraph|string,number>,

	forbiddenPoints?:(Vector2Graph|string)[],
	forbiddenLines?:(LineGraph|string)[],

	heuristic?:number,
	heuristicFunction?:(params:PathFinderHeuristicParams) => number,
	heuristicDistance?:boolean,

	connectionFunction?: (point:Vector2Graph) => LineGraph[] | Vector2Graph[]

	randomWeights?:PathFindRandomizeParams
}

// By default, PathFinder expects PointGraph elements and uses their automatically created LineGraph connections
// But if it receives a PointGraph for the connection list instead, it falls back on assigning unique string IDs to store data
// (And the function for cost, A* heuristic, and where to get connections from can be set any way you like)
export const assignRandomWeights = (params:PathFindRandomizeParams, connectionFunction:Function) =>
{
	const points = params.points;
	const costMap = new Map();
	if(points.length <= 0) { return costMap; }

	for(const point of points)
	{
		const nbLines = connectionFunction(point);
		for(const nbLine of nbLines)
		{
			costMap.set(getConnectionKey(point, nbLine), getRandomWeight(params));
		}
	}

	return costMap;
}

const getRandomWeight = (params:any) =>
{
	return new Bounds(params.min ?? 0, params.max ?? 0).random();
}

const getID = (point:Vector2Valid) : string =>
{
	if("id" in point) { return point.id.toString(); }
	if("gridPos" in point) { return point.gridPos.x + "-" + point.gridPos.y; }
	return Math.round(point.x*10)/10 + "-" + Math.round(point.y*10)/10;
}

const getConnectionKey = (from:Vector2Graph, to:LineGraph|Vector2Graph) : LineGraph|string =>
{
	if(to instanceof Vector2Graph) { return getConnectionID(from, to); }
	return to;
}

const getConnectionID = (a:Vector2Valid, b:Vector2Valid) =>
{
	return getID(a) + "/" + getID(b);
}

const getTravelCost = (config:PathFindParams, l:LineGraph|string, from?:Vector2Graph, to?:Vector2Graph, ) =>
{
	let score = (config.costMap.get(l) ?? config.cost) ?? 1;
	if(!(l instanceof LineGraph)) 
	{ 
		l = new LineGraph(from, to);
		l.hashID = getConnectionID(from, to); 
	}
	score = config.costFunction(l, score);
	return score;
}

const getHeuristic = (config:PathFindParams, from:Vector2Valid, to:Vector2Valid, start:Vector2Valid, end:Vector2Valid) =>
{
	let heuristic = config.heuristic;

	// the A* heuristic that makes it fast
	if(config.heuristicDistance)
	{
		const dX = Math.abs(to.x - end.x);
		const dY = Math.abs(to.y - end.y);
		heuristic = (dX + dY);
	}

	const params = { from: from, to: to, start: start, end: end, heuristic: heuristic };
	heuristic = config.heuristicFunction(params)
	return heuristic;
}

const DEFAULT_COST_FUNCTION = (l:LineGraph, score:number) => { return score; }
const DEFAULT_HEURISTIC_FUNCTION = (params:PathFinderHeuristicParams) => { return params.heuristic; };
const DEFAULT_CONNECTION_FUNCTION = (point:Vector2Graph) => { return point.getConnectionsByLine(); }

const configurePathFinder = (params:PathFindParams) =>
{
	const cost = params.cost ?? 1;
	let costMap = params.costMap ?? new Map();

	const costFunction = params.costFunction ?? DEFAULT_COST_FUNCTION;

	const forbiddenPoints = params.forbiddenPoints ?? [];
	const forbiddenLines = params.forbiddenLines ?? [];

	const heuristic = params.heuristic ?? 0;
	const heuristicFunction = params.heuristicFunction ?? DEFAULT_HEURISTIC_FUNCTION;
	const heuristicDistance = params.heuristicDistance ?? true;

	const connectionFunction = params.connectionFunction ?? DEFAULT_CONNECTION_FUNCTION;

	if(params.randomWeights)
	{
		costMap = assignRandomWeights(params.randomWeights, connectionFunction);
	}


	return { cost, costMap, costFunction, forbiddenPoints, forbiddenLines, heuristic, heuristicFunction, heuristicDistance, connectionFunction };
}

export const pathfind = (params:PathFindParams = {}) =>
{
	const config = configurePathFinder(params);

	const start = params.start;
	const end = params.end;

	if(!start || !end) 
	{ 
		console.error("PathFinder: Can't pathfind without start and end points"); 
		return []; 
	}

	const Q = new PriorityQueue();

	const cameFrom = new Map();
	const costSoFar = new Map();
	const tilesChecked = new Map();

	Q.put(start, 0);
	cameFrom.set(start, null);
	costSoFar.set(start, 0);

	let reachable = false;
	while(!Q.isEmpty()) 
	{
		const currentPoint = Q.get();
		tilesChecked.set(currentPoint, true);
	
		// stop when we've found the first "shortest route" to our destination
		const isEndPoint = (currentPoint == end);
		if(isEndPoint) { reachable = true; break; }

		const nbLines = config.connectionFunction(currentPoint);
		for(const nbLine of nbLines)
		{
			const nb = nbLine instanceof Vector2Graph ? nbLine : (nbLine.getOther(currentPoint) as Vector2Graph);
			const isForbidden = config.forbiddenPoints.includes(nb);
			if(isForbidden) { continue; }

			const connKey = getConnectionKey(currentPoint, nbLine);
			const connectionIsForbidden = config.forbiddenLines.includes(connKey);
			if(connectionIsForbidden) { continue; }

			const newCost = costSoFar.get(currentPoint) + getTravelCost(config, connKey, currentPoint, nb);
			if(!isFinite(newCost)) { continue; }

			const notVisitedYet = !costSoFar.has(nb) && !tilesChecked.has(nb);
			const newCostIsLower = newCost < costSoFar.get(nb);
			const updateScore = notVisitedYet || newCostIsLower;
			if(!updateScore) { continue; }

			const heuristic = getHeuristic(config, currentPoint, nb, start, end);
			const tieBreaker = (1.0 + 0.01);
			const priority = newCost + heuristic + tieBreaker;
			Q.put(nb, priority);

			costSoFar.set(nb, newCost);
			cameFrom.set(nb, currentPoint);
		}
	}

	if(!reachable) 
	{ 
		console.error("PathFinder finds no path between ", start, " and ", end); 
		return []; 
	}

	// reconstruct the path
	const path = []
	let currentPoint = end
	let isStartPoint = false;
	while(!isStartPoint) 
	{
		path.push(currentPoint)
		currentPoint = cameFrom.get(currentPoint);
		isStartPoint = (currentPoint == start);
	}

	path.push(start);
	path.reverse();
	return path
}