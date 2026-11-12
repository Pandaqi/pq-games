import type { Line } from "./shapes/line"
import { Vector2 } from "./vector2"

export type GrowParams = { left?:number, right?:number, top?:number, bottom?:number }
export type GrowValue = number|GrowParams
export class Dims
{
    position:Vector2
    size:Vector2
    center:Vector2
    topLeft:Vector2
    bottomRight:Vector2

    constructor(x:number|Vector2 = 0, y:number|Vector2 = 0, width:number = 0, height:number = 0)
    {
        if(x instanceof Vector2) {
            this.position = x.clone();
        } else {
            this.position = new Vector2(x, y as number);
        }

        if(y instanceof Vector2) {
            this.size = y.clone();
        } else {
            this.size = new Vector2(width, height);
        }

        this.reset();
    }

    clone()
    {
        return new Dims(this.position.clone(), this.size.clone());
    }

    setPosition(p:Vector2)
    {
        this.position = p.clone();
    }

    getPosition() : Vector2
    {
        return this.position.clone();
    }

    setSize(p: Vector2)
    {
        this.size = p.clone();
    }

    getSize() : Vector2
    {
        return this.size.clone();
    }

    setCorners(topLeft:Vector2, bottomRight:Vector2)
    {
        this.topLeft = topLeft
        this.bottomRight = bottomRight;
        this.refresh();
    }

    fromLine(l:Line)
    {
        this.reset();
        this.takePointIntoAccount(l.start);
        this.takePointIntoAccount(l.end);
        return this;
    }

    fromPoints(points:Vector2[])
    {
        this.reset();
        for(const point of points)
        {
            this.takePointIntoAccount(point);
        }
        return this;
    }

    fromDims(d:Dims) : Dims
    {
        this.setPosition(d.position.clone());
        this.setSize(d.size.clone());
        return this;
    }

    toPath2D() : Path2D
    {
        const p = new Path2D();
        p.moveTo(this.position.x, this.position.y);
        p.lineTo(this.position.x+this.size.x, this.position.y);
        p.lineTo(this.position.x+this.size.x, this.position.y+this.size.y);
        p.lineTo(this.position.x, this.position.y+this.size.y);
        p.lineTo(this.position.x, this.position.y);
        return p;
    }

    takePointIntoAccount(p:Vector2)
    {
        this.topLeft.x = Math.min(this.topLeft.x, p.x);
        this.topLeft.y = Math.min(this.topLeft.y, p.y);
        this.bottomRight.x = Math.max(this.bottomRight.x, p.x);
        this.bottomRight.y = Math.max(this.bottomRight.y, p.y);
        this.refresh();
    }

    takeIntoAccount(d:Dims)
    {
        this.topLeft.x = Math.min(this.topLeft.x, d.position.x);
        this.topLeft.y = Math.min(this.topLeft.y, d.position.y);
        this.bottomRight.x = Math.max(this.bottomRight.x, d.position.x + d.size.x);
        this.bottomRight.y = Math.max(this.bottomRight.y, d.position.y + d.size.y);
        this.refresh();
    }

    grow(v:GrowValue)
    {
        if(typeof v !== "object")
        {
            v = { left: v, right: v, top: v, bottom: v };
        }

        this.topLeft.x -= v.left;
        this.topLeft.y -= v.top;
        this.bottomRight.x += v.right;
        this.bottomRight.y += v.bottom;
        this.refresh();
    }

    reset()
    {
        this.topLeft = new Vector2().setXY(Infinity, Infinity);
        this.bottomRight = new Vector2().setXY(-Infinity, -Infinity);
    }

    refresh()
    {
        this.position = this.topLeft.clone();
        this.size = this.bottomRight.clone().sub(this.topLeft.clone());
        this.center = this.position.clone().move(this.getSize().clone().scale(0.5));
    }

    merge(d1:Dims, d2:Dims)
    {
        this.position = new Vector2(
            d1.position.x ?? d2.position.x,
            d1.position.y ?? d2.position.y
        )

        this.size = new Vector2(
            d1.size.x ?? d2.size.x, 
            d1.size.y ?? d2.size.y
        )
    }

    move(p:Vector2)
    {
        this.position.move(p);
        return this;
    }
}