import { Bounds } from "../../tools/numbers/bounds"
import { Dims } from "../dims"
import { Path } from "../path"
import { Vector2 } from "../vector2"

export interface RectangleParams
{
    center?:Vector2
    extents?:Vector2 // the FULL size of the rectangle (multiplied by 0.5 to center it)
}

export class Rectangle extends Path
{
    center:Vector2
    extents:Vector2

    constructor(r:RectangleParams = {})
    {
        super();
        this.center = r.center ? r.center.clone() : new Vector2();
        this.extents = r.extents ? r.extents.clone() : new Vector2(1,1);
    }

    clone(deep = false)
    {
        const c = deep ? this.center.clone() : this.center;
        const e = deep ? this.extents.clone() : this.extents;
        return new Rectangle({ center: c, extents: e });
    }

    getDimensions()
    {
        return new Dims(
            this.getTopLeft(),
            this.extents.clone()
        );
    }

    createPixiObject(graphicsConstructor)
    {
        const tl = this.getTopLeft();
        const size = this.getSize();
        return new graphicsConstructor({}).rect(tl.x, tl.y, size.x, size.y);
    }

    toPathArray()
    {
        return [
            this.getTopLeft(),
            this.getTopRight(),
            this.getBottomRight(),
            this.getBottomLeft()
        ]
    }

    toPath2D() 
    {
        const p = new Path2D();
        const dims = this.getDimensions();
        p.rect(dims.position.x, dims.position.y, dims.size.x, dims.size.y);
        return p;
    }

    rotateFromPivot(pivot: Vector2, rotation:number)
    {
        const rot = rotation % 4;
        const newExtents = this.extents.clone();
        const rotRadians = rot * 0.5 * Math.PI;
        if(rot == 1 || rot == 3) 
        { 
            newExtents.rotate(rotRadians); 
            newExtents.abs();
        }

        // move coordinate system to (0,0)
        const pivotNorm = pivot.sub(new Vector2(0.5));
        const pivotPos = this.center.clone().add(pivotNorm.clone().scale(this.extents));
        const offsetVec = this.center.clone().sub(pivotPos);

        // rotate
        offsetVec.rotate(rotRadians);

        // move back to original position
        const newCenter = offsetVec.add(pivotPos);

        this.extents = newExtents;
        this.center = newCenter;
        return this;
    }

    fromTopLeft(pos:Vector2, size:Vector2)
    {
        this.center = pos.clone().add(size.clone().scaleFactor(0.5));
        this.extents = size.clone();
        return this;
    }


    fromBottomRight(pos:Vector2, size:Vector2)
    {
        this.center = pos.clone().sub(size.clone().scaleFactor(0.5));
        this.extents = size.clone();
        return this;
    }

    getPositionWithOffset(off:Vector2) : Vector2
    {
        const offset = this.extents.clone().scale(off).scaleFactor(0.5);
        return this.center.clone().add(offset);
    }

    getCenter()
    {
        return this.center.clone();
    }

    getSize()
    {
        return this.extents.clone();
    }

    getTopLeft()
    {
        return this.getPositionWithOffset(new Vector2(-1,-1));
    }
    
    getTopRight()
    {
        return this.getPositionWithOffset(new Vector2(1,-1));
    }

    getBottomRight()
    {
        return this.getPositionWithOffset(new Vector2(1,1));
    }

    getBottomLeft()
    {
        return this.getPositionWithOffset(new Vector2(-1,1));
    }

    grow(ds:number|Vector2)
    {
        this.extents.add(new Vector2(ds).scale(2));
        return this;
    }

    shrink(ds:number|Vector2)
    {
        ds = new Vector2(ds);
        return this.grow(ds.clone().negate());
    }

    move(dm:number|Vector2)
    {
        this.center.move(new Vector2(dm));
        return this;
    }

    scaleCenter(s:number|Vector2)
    {
        this.center.scale(s);
        return this;
    }

    scale(s:number|Vector2)
    {
        this.extents.scale(s);
        return this;
    }

    getRandomPositionInside()
    {
        const x = this.center.x + new Bounds(-1,1).random() * 0.5 * this.extents.x;
        const y = this.center.y + new Bounds(-1,1).random() * 0.5 * this.extents.y;
        return new Vector2(x,y);
    }
}