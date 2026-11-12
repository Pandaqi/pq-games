import { distToPath } from "../distances";
import type { PathLike } from "../path";
import type { Circle } from "../shapes/circle";
import type { Rectangle } from "../shapes/rectangle";
import { pathIntersectsPath } from "./pathIntersectsPath";

export const circleIntersectsCircle = (c1:Circle, c2:Circle) =>
{
    const distSquared = c1.center.distSquaredTo(c2.center);
    const radSquared = Math.pow(c1.radius+c2.radius, 2);
    return distSquared <= radSquared;
}

export const circleIntersectsPath = (c:Circle, path:PathLike) =>
{
    return distToPath(c.center, path) <= c.radius;
}

export const rectIntersectsRect = (rect1:Rectangle, rect2:Rectangle) =>
{
    const l1 = rect1.getTopLeft();
    const r1 = rect1.getBottomRight();
    const l2 = rect2.getTopLeft();
    const r2 = rect2.getBottomRight();
    return (l1.x < r2.x && r1.x > l2.x) && (l1.y < r2.y && r1.y > l2.y); 
}

// is there something more efficient to do here?
export const rectIntersectsShape = (r:Rectangle, path:PathLike) =>
{
    return pathIntersectsPath(r.toPathArray(), path);
}