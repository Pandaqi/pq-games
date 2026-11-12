import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface LShapeParams
{
    center?:Vector2
    extents?:Vector2
    extentsHole?:Vector2
}

export class LShape extends Path
{
    center:Vector2
    extents:Vector2
    extentsHole:Vector2

    constructor(h:LShapeParams = {})
    {
        super()
        this.center = h.center ?? new Vector2();
        this.extents = h.extents ?? new Vector2(1,1);
        this.extentsHole = h.extentsHole ?? new Vector2(0.5, 0.5);
    }

    toPathArray()
    {
        const topLeft = this.center.clone().add(this.extents.clone().scaleFactor(-0.5));
        const topRight = this.center.clone().add(new Vector2(0.5*this.extents.x, -0.5*this.extents.y));
        const bottomRight = this.center.clone().add(this.extents.clone().scaleFactor(0.5));
        const bottomLeft = this.center.clone().add(new Vector2(-0.5*this.extents.x, 0.5*this.extents.y));

        const path = [
            topLeft,
            topRight.clone().sub(new Vector2(this.extentsHole.x, 0)),
            topRight.clone().add(new Vector2(-this.extentsHole.x, this.extentsHole.y)),
            topRight.clone().add(new Vector2(0, this.extentsHole.y)),
            bottomRight,
            bottomLeft
        ];

        console.log(path);
        
        return path;
    }
}