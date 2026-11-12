import { isZero } from "../tools/numbers/checks";
import { lerp } from "../tools/numbers/lerp";

export interface Vector2Dict 
{
    x: number,
    y: number
}
export type Vector2Like = Vector2|Vector2Dict;
export type Vector2ParamValid = Vector2Like|number;

export class Vector2
{
    x:number
    y:number

    static LEFT = new Vector2(-1,0);
    static RIGHT = new Vector2(1,0);
    static UP = new Vector2(0,-1);
    static DOWN = new Vector2(0,1);

    static ZERO = new Vector2(0,0);
    static CENTER = new Vector2(0.5, 0.5);
    static ONE = new Vector2(1,1);

    static TOP_LEFT = new Vector2(-1,-1);
    static TOP_RIGHT = new Vector2(1,-1);
    static BOTTOM_RIGHT = new Vector2(1,1);
    static BOTTOM_LEFT = new Vector2(-1,1);

    constructor(a:Vector2ParamValid = 0, b:number = null)
    {
        let x = a;
        let y = b;

        if(a instanceof Vector2) {
            x = a.x;
            y = a.y;
        } else if(typeof a == "object" && ("x" in a && "y" in a)) {
            x = a.x;
            y = a.y;
        }

        this.x = x as number ?? 0;
        this.y = y ?? this.x;
    }

    clone() : Vector2 { return new Vector2(this); }
    isValid() { return this.isNumber(this.x) && this.isNumber(this.y); }
    hasValue() { return this.isValid() && (this.x != 0 || this.y != 0); }
    isZero() { return isZero(this.length()); }
    isNumber(val:any) { return !isNaN(val); }
    matches(p:Vector2) { return Math.abs(this.x - p.x) < 0.003 && Math.abs(this.y - p.y) < 0.003; }
    largestSide() { return Math.max(this.x, this.y); }
    smallestSide() { return Math.min(this.x, this.y); }

    toSVGString() { return this.x + " " + this.y }

    fromAngle(ang:number)
    {
        this.x = Math.cos(ang);
        this.y = Math.sin(ang);
        return this;
    }

    // setting/overriding
    setX(v = 0) { this.x = v; return this; }
    setY(v = 0) { this.y = v; return this; }
    fromXY(x = 0, y = 0) { return this.setXY(x,y); }
    setXY(x = 0, y = 0) { return this.set({ x: x, y: y }); }
    setFactor(f = 0) { return this.setXY(f,f); }
    set(p:Vector2ParamValid = new Vector2())
    {
        if(this.isNumber(p)) { return this.setFactor(p as number); }
        p = p as Vector2Like;
        this.setX(p.x);
        this.setY(p.y);
        return this;
    }

    // changing/moving
    moveX(v = 0) { return this.setX(this.x + v); }
    moveY(v = 0) { return this.setY(this.y + v); }
    moveXY(x = 0, y = 0) { return this.move({ x: x, y: y }); }
    moveFactor(f = 0) { return this.moveXY(f,f); }
    add(p:Vector2ParamValid = new Vector2()) : Vector2 { return this.move(p); }
    sub(p = new Vector2()) : Vector2 { return this.add(p.clone().scaleFactor(-1)); }
    move(p:Vector2ParamValid = new Vector2()) : Vector2
    {
        if(this.isNumber(p)) { return this.moveFactor(p as number); }
        p = p as Vector2Like;
        this.moveX(p.x);
        this.moveY(p.y);
        return this;
    }

    // scaling
    scaleX(v = 0) { return this.setX(v * this.x); }
    scaleY(v = 0) { return this.setY(v * this.y); }
    scaleXY(x = 1, y = 1) { return this.scale({ x: x, y: y }); }
    scaleFactor(f = 1) { return this.scaleXY(f,f); }
    mult(f = 1) { return this.scaleFactor(f); }
    div(p:Vector2ParamValid = new Vector2()) 
    {
        if(typeof p == "object") { return this.scale(new Vector2(1.0 / p.x, 1.0 / p.y)); }
        return this.scaleFactor(1.0 / p);
    }
    scale(p:Vector2ParamValid = new Vector2())
    {
        if(this.isNumber(p)) { return this.scaleFactor(p as number); }
        p = p as Vector2Like;
        this.scaleX(p.x);
        this.scaleY(p.y);
        return this;
    }

    // dimensions
    angle() { return Math.atan2(this.y, this.x); }
    angleTo(p:Vector2)
    {
        const length = this.length() * p.length();
        const dot = this.dot(p);
        if(isZero(length)) { return 0; }
        return Math.acos(dot / length);
    }

    angleSignedTo(p:Vector2)
    {
        const sign = Math.sign(this.cross(p));
        return sign * this.angleTo(p);
    }

    negate() { return this.scaleFactor(-1); }
    normalize() : Vector2
    { 
        const l = this.length();
        if(Math.abs(l) <= 0.0001) { return this; }
        return this.scaleFactor(1.0 / l); 
    }
    ortho()
    {
        const temp = this.x;
        this.x = -this.y;
        this.y = temp;
        return this;
    }

    rotate(rot:number)
    {
        let norm = this.length();
        let ang = this.angle();
        ang += rot;
        this.x = Math.cos(ang) * norm;
        this.y = Math.sin(ang) * norm;
        return this;
    }

    abs()
    {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    round()
    {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    floor()
    {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    ceil()
    {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    random()
    {
        const angle = Math.random() * 2 * Math.PI;
        return new Vector2().setXY(Math.cos(angle), Math.sin(angle));
    }

    clamp(pMin = new Vector2(), pMax = new Vector2())
    {
        this.setX(Math.min(Math.max(this.x, pMin.x), pMax.x));
        this.setY(Math.min(Math.max(this.y, pMin.y), pMax.y));
        return this;
    }

    length() { return Math.sqrt(this.lengthSquared()); }
    lengthSquared() 
    { 
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    distTo(p = new Vector2()) { return Math.sqrt(this.distSquaredTo(p)); }
    distSquaredTo(p = new Vector2())
    {
        return Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2);
    }

    vecTo(p = new Vector2())
    {
        return new Vector2().setXY(p.x - this.x, p.y - this.y);
    }
    
    halfwayTo(p:Vector2)
    {
        return this.clone().add(p).scaleFactor(0.5);
    }

    lerp(p:Vector2, factor:number)
    {
        return new Vector2(
            lerp(this.x, p.x, factor),
            lerp(this.y, p.y, factor)
        )
    }
    
    dot(p:Vector2)
    {
        return this.x * p.x + this.y * p.y;
    }

    cross(p:Vector2)
    {
        return -this.x * p.y + this.y * p.x;
    }


}