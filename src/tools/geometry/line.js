import Point from "./point"
import GeometryHelpers from "./helpers"

export default class Line {
    constructor(l)
    {
        this.start = l.start || new Point();
        this.end = l.end || new Point();
    }

    clone() { return new Line(this); }

    // start/end points
    setStart(s) { this.start = s; }
    getStart() { return this.start; }
    setEnd(s) { this.end = s; }
    getEnd() { return this.end; }
    setPoints(start, end)
    {
        this.setStart(start);
        this.setEnd(end);
        return this;
    }

    // passthrough operations (done on both points)
    // @TODO: also allow the other input methods, such as "x,y" two parameters, only clamp one side, etcetera
    scaleXY(x,y,anchor) { return this.scale({ x: x, y: y }, anchor); }
    scaleFactor(f,anchor) { return this.scaleXY(f,f,anchor); }
    scale(p, anchor = "center")
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

    moveXY(x,y) { return this.move({ x: x, y: y }); }
    move(p)
    {
        this.start.move(p);
        this.end.move(p);
        return this;
    }

    clamp(pMin, pMax)
    {
        this.start.clamp(pMin, pMax);
        this.end.clamp(pMin, pMax);
        return this;
    }

    // useful properties
    isPoint() { return this.start == this.end || this.getLength() < 0.00001; }
    vector() { return this.start.vecTo(this.end); }
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

    // geometric tools
    intersectsLine(line, margin = 0.0)
    {
        const vec1 = this.vector().normalize().scale(margin);
        const vec2 = line.vector().normalize().scale(margin);
        
        return GeometryHelpers.intersectsLine(
            this.start.x+vec1.x, this.start.y+vec1.y, this.end.x-vec1.x, this.end.y-vec1.y,
            line.start.x+vec2.x, line.start.y+vec2.y, line.end.x-vec2.x, line.end.y-vec2.y
        )
    }
}