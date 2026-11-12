import { Dims } from "../dims"
import { Vector2Graph } from "../graphs/vector2Graph"
import { lineIntersectsLineRaw } from "../intersection/pathIntersectsPath"
import { Path } from "../path"
import { Vector2 } from "../vector2"

type Vector2Like = Vector2|Vector2Graph

export interface LineDict 
{
    start?:Vector2Like
    end?:Vector2Like
}

export class Line extends Path
{
    start:Vector2Like
    end:Vector2Like

    constructor(a:Vector2Like|Line|LineDict = {}, b:Vector2Like = new Vector2())
    {
        super();

        let start = a;
        let end = b;

        if(a instanceof Line) {
            start = a.start;
            end = a.end;
        } else if(typeof a == "object" && ("start" in a && "end" in a)) {
            start = a.start
            end = a.end;
        }

        this.start = (start as Vector2) ?? new Vector2();
        this.end = end ?? new Vector2();
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).moveTo(this.start.x, this.start.y).lineTo(this.end.x, this.end.y);
    }

    toPathArray() { return [this.start, this.end]; }
    toPath2D() 
    { 
        const p = new Path2D();
        p.moveTo(this.start.x, this.start.y);
        p.lineTo(this.end.x, this.end.y);
        return p;
    }
    toPathString()
    {
        return "M" + this.start.x + "," + this.start.y + " L" + this.end.x + "," + this.end.y;
    }

    getDimensions()
    {
        return new Dims().fromLine(this);
    }

    clone(deep = false) 
    {
        const s = deep ? this.start.clone() : this.start;
        const e = deep ? this.end.clone() : this.end;
        return new Line(s, e); 
    }

    // start/end points
    setStart(s: Vector2Like) { this.start = s; return this; }
    getStart() { return this.start; }
    setEnd(s: Vector2Like) { this.end = s; return this; }
    getEnd() { return this.end; }
    getOther(p: Vector2Like) 
    {
        if(p == this.start) { return this.end; }
        if(p == this.end) { return this.start; }
        console.error("Can't get other point on ", this, " because point given ", p, " isn't a member in the first place");
        return null;
    }
    setPoints(start: Vector2, end: Vector2)
    {
        this.setStart(start);
        this.setEnd(end);
        return this;
    }

    // passthrough operations (done on both points)
    scaleXY(x: number, y: number, anchor = "center") { return this.scale(new Vector2({ x: x, y: y }), anchor); }
    scaleFactor(f: number, anchor = "center") { return this.scaleXY(f, f, anchor); }
    scale(p: Vector2Like, anchor = "center")
    {
        const newVec = this.vector().scale(p);
        if(anchor == "start") { this.end.set(this.start.clone().move(newVec)); }
        else if(anchor == "end") { this.start.set(this.end.clone().move(newVec.negate())); }
        else if(anchor == "center")
        {
            const center = this.center();
            const halfVec = newVec.scaleFactor(0.5);
            this.start.set(center.clone().move(halfVec.clone().negate()));
            this.end.set(center.clone().move(halfVec));
        }
        return this;
    }

    moveXY(x: number, y: number) { return this.move(new Vector2({ x: x, y: y })); }
    move(p: Vector2Like)
    {
        this.start.move(p);
        this.end.move(p);
        return this;
    }

    clamp(pMin: Vector2Like, pMax: Vector2Like)
    {
        this.start.clamp(pMin, pMax);
        this.end.clamp(pMin, pMax);
        return this;
    }

    // useful properties
    isPoint() { return this.start == this.end || this.length() < 0.00001; }
    vector() : Vector2 { return this.start.vecTo(this.end); }
    length() { return this.start.distTo(this.end); }
    lengthSquared() { return this.start.distSquaredTo(this.end); }
    
    angle()
    {
        const vec = this.vector();
        return Math.atan2(vec.y, vec.x);
    }

    center()
    {
        return this.start.clone().move(this.end).scaleFactor(0.5);
    }

    lerp(factor:number)
    {
        return this.start.clone().move(this.vector().scaleFactor(factor));
    }

    // geometric tools
    intersectsLine(line:Line, margin = 0.0)
    {
        const vec1 = this.vector().normalize().scaleFactor(margin);
        const vec2 = line.vector().normalize().scaleFactor(margin);
        
        return lineIntersectsLineRaw(
            this.start.x+vec1.x, this.start.y+vec1.y, this.end.x-vec1.x, this.end.y-vec1.y,
            line.start.x+vec2.x, line.start.y+vec2.y, line.end.x-vec2.x, line.end.y-vec2.y
        )
    }
    
    getRandomPositionInside(scale = 1.0) : Vector2
    {
        const tempLine = this.clone(true).scale(new Vector2(scale));
        return tempLine.start.clone().add(tempLine.vector().scale(Math.random()));
    }
}