import { Vector2 } from "../vector2";
import type { PathLike } from "../path";

export default class PathFollower
{
    path: Vector2[]
    offset: number

    constructor(path:PathLike, offset = 0)
    {
        if(!Array.isArray(path)) { path = path.toPathArray(); }
        this.path = path ?? [];
        this.offset = offset;
    }

    getCurrentLocation() : Vector2
    {
        const prevPos = this.path[Math.floor(this.offset)];
        const nextPos = this.path[Math.ceil(this.offset)];
        return prevPos.clone().lerp(nextPos, this.offset % 1);
    }
    
    setOffset(delta:number)
    {
        this.offset = delta;
        this.wrapOffset();
    }

    wrapOffset()
    {
        this.offset = this.offset % this.path.length;
    }

    changeOffset(delta:number)
    {
        this.setOffset(this.offset + delta);
        return this.getCurrentLocation();
    }

    moveToPointByChange(delta:number)
    {
        this.setOffset(Math.round(this.offset + delta));
        return this.getCurrentLocation();
    }

    moveToPointByIndex(idx:number)
    {
        this.setOffset(idx);
        return this.getCurrentLocation();
    }

    moveToNextPoint()
    {
        this.setOffset( Math.round(this.offset+0.001) );
        return this.getCurrentLocation();
    }

    moveToPreviousPoint()
    {
        this.setOffset( Math.floor(this.offset-0.001) );
        return this.getCurrentLocation();
    }
}