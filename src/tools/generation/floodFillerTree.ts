import { fromArray } from "../random/pickers";
import { FloodFillElement, FloodFillParams, configureFloodFill, floodFill, getAllValidFloodFillNeighbors } from "./floodFiller";

const getAllValidNeighborsOfTreeNode = (n:FloodFillerTreeNode, exceptions:FloodFillElement[]) : FloodFillElement[] =>
{
    const arr = [];
    const nbs = getAllValidFloodFillNeighbors(n.elements, n.floodFillParams);
    for(const nb of nbs)
    {
        if(exceptions.includes(nb)) { continue; }
        arr.push(nb);
    }
    return arr;
}

export class FloodFillerTreeNode
{
    parent:FloodFillerTreeNode
    children:FloodFillerTreeNode[]
    metadata:Record<string,any>

    floodFillParams:FloodFillParams
    elements:FloodFillElement[]

    constructor(elems:FloodFillElement[], params:FloodFillParams)
    {
        this.elements = elems;
        this.children = [];
        this.parent = null;
        this.metadata = {};
    }

    hasParent() { return this.parent != null; }
    hasElement(elem:FloodFillElement) { return this.elements.includes(elem); }
    setParent(n:FloodFillerTreeNode) { this.parent = n; }
    count() 
    { 
        let sum = 1;
        for(const child of this.children)
        {
            sum += child.count();
        }
        return sum;
    }

    addChild(f:FloodFillerTreeNode)
    {
        this.children.push(f);
        f.setParent(this);
    }
}

export class FloodFillerTree
{
    root: FloodFillerTreeNode

    constructor() {}

    get() { return this.root; }
    count() { return this.root.count(); }
    grow(floodParams:FloodFillParams)
    {
        let assigned = [];
        let curParent : FloodFillerTreeNode = null;

        const forbiddenOriginal = floodParams.forbidden;

        while(true)
        {
            // pick a random neighbor to use for the next floodfill
            if(curParent)
            {
                const nbs = getAllValidNeighborsOfTreeNode(curParent, assigned);

                // if we have no neighbors, go back up the tree until we find one that does
                // if we hit the root with no results, we're done
                if(nbs.length <= 0)
                {
                    if(!curParent.hasParent()) { break; }
                    curParent = curParent.parent;
                    continue;
                }

                const nb = fromArray(nbs);
                floodParams.start = nb;
            }

            let forbidden = assigned;
            if(forbiddenOriginal) { forbidden = floodParams.forbidden.slice().concat(assigned); }
            floodParams.forbidden = forbidden;

            // perform a flood fill on the currently set start element
            const floodParamsFinal = configureFloodFill(floodParams);
            const list = floodFill(floodParamsFinal);
            assigned.push(...list);

            const tooSmall = list.length < floodParamsFinal.bounds.min;
            if(tooSmall)
            {
                curParent.elements.push(...list);
                continue;
            }

            const node = new FloodFillerTreeNode(list, floodParamsFinal);

            // attach to parent, set as the new parent to start from
            if(!curParent) { curParent = node; }
            else { curParent.addChild(node); }
            curParent = node;
        }

        this.root = curParent;
    }
}