import { LineGraph } from "./lineGraph"
import { Vector2, Vector2Like } from "../vector2"

export class Vector2Graph extends Vector2
{
    neighbors:Vector2Graph[]
    connections:LineGraph[]
    metadata:Record<string,any>

    constructor(x:number|Vector2Like = new Vector2(), y:number = 0, nbs:Vector2Graph[] = [], cons:LineGraph[] = [], meta:any = {})
    {
        super(x,y);

        let neighbors = nbs;
        if(x instanceof Vector2Graph) { neighbors = x.neighbors; }

        let connections = cons;
        if(x instanceof Vector2Graph) { connections = x.connections; }

        let metadata = meta;
        if(x instanceof Vector2Graph) { metadata = Object.assign({}, x.metadata); }

        this.neighbors = neighbors; // any point it CAN reach
        this.connections = connections; // LineGraph representing connection to other points
        this.metadata = metadata;
    }
    
    clone()
    {
        return new Vector2Graph(this);
    }

    // neighbors
    addNeighbor(p = new Vector2Graph()) { this.neighbors.push(p); }
    removeNeighbor(p = new Vector2Graph())
    {
        const idx = this.getNeighborIndex(p);
        if(idx < 0) { return; }
        this.neighbors.splice(idx, 1);
    }
    countNeighbors() { return this.neighbors.length; }
    getNeighborIndex(p:Vector2Graph) { return this.neighbors.indexOf(p); }
    hasNeighbor(p:Vector2Graph) { return this.neighbors.includes(p); }
    canConnectTo(p:Vector2Graph) { return this.hasNeighbor(p); }
    hasNeighbors() { return this.countNeighbors() > 0; }
    setNeighbors(nbs:Vector2Graph[]) { this.neighbors = nbs; }
    getNeighbors() { return this.neighbors.slice(); }
    clearNeighbors() { this.neighbors = []; }

    // connections
    addConnectionByPoint(p = new Vector2Graph()) 
    {
        if(this.isConnectedTo(p)) { return; }

        const newLine = new LineGraph(this, p);
        this.connections.push(newLine); 
        p.addConnectionByLine(newLine);
    }

    addConnectionByLine(l:LineGraph = null)
    {
        const otherSide = l.getOther(this) as Vector2Graph;
        
        if(this.isConnectedTo(otherSide)) { return; }
        this.connections.push(l);
        otherSide.addConnectionByLine(l);
    }

    removeConnectionByIndex(idx:number)
    {
        if(idx < 0 || idx >= this.connections.length) { return; }
        const otherSide = this.connections[idx].getOther(this) as Vector2Graph;
        this.connections.splice(idx, 1);
        otherSide.removeConnectionByPoint(this);
    }

    removeAllConnections()
    {
        while(this.connections.length > 0)
        {
            this.removeConnectionByIndex(0);
        }
    }

    clearConnections() { this.connections = []; }
    removeConnectionByPoint(p:Vector2Graph)
    {
        const idx = this.getConnectionIndexByPoint(p);
        this.removeConnectionByIndex(idx);
    }

    removeConnectionByLine(l:LineGraph)
    {
        const idx = this.getConnectionIndexByLine(l);
        this.removeConnectionByIndex(idx);
    }

    countConnections() { return this.connections.length; }
    getConnectionLineByIndex(idx:number) { return this.connections[idx]; }
    getConnectionPointByIndex(idx:number) { return this.getConnectionsByPoint()[idx]; }
    
    getConnectionIndexByPoint(p:Vector2Graph) { return this.getConnectionsByPoint().indexOf(p); }
    getConnectionIndexByLine(l:LineGraph) { return this.connections.indexOf(l); }
    
    hasConnection(p:Vector2Graph) { return this.getConnectionsByPoint().includes(p); }
    isConnectedTo(p:Vector2Graph) { return this.hasConnection(p); }
    hasConnections() { return this.countConnections() > 0; }

    getConnectionLineTo(p:Vector2Graph)
    {
        const idx = this.getConnectionIndexByPoint(p);
        return this.connections[idx];
    }
    
    getConnectionsByLine() { return this.connections.slice(); }
    getConnectionsByPoint()
    {
        const arr = [];
        for(const conn of this.connections)
        {
            arr.push(conn.getOther(this));
        }
        return arr;
    }
    

    // metadata
    setMetadata(obj:any) { this.metadata = obj; }
    getMetadata() { return this.metadata; }

}