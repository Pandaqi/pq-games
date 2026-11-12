import { Circle } from "../shapes/circle";
import { Path } from "../path";
import { Vector2 } from "../vector2";
import { Polygon } from "../shapes/polygon";
import { Rectangle } from "../shapes/rectangle";
import { Triangle } from "../shapes/triangle";

export const triangleSign = (p1:Vector2, p2:Vector2, p3:Vector2) => 
{ 
    return (p1.x-p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export const pointIsInsideTriangle = (p:Vector2, triangle:Triangle, epsilon = 0.001) =>
{
    const points = triangle.points;
    const b1 = triangleSign(p, points[0], points[1]) <= epsilon;
    const b2 = triangleSign(p, points[1], points[2]) <= epsilon;
    const b3 = triangleSign(p, points[2], points[0]) <= epsilon;
    return (b1 == b2) && (b2 == b3);
}

export const pointIsInsideRectangle = (p:Vector2, rect:Rectangle) =>
{
    const topLeft = rect.getTopLeft();
    const bottomRight = rect.getBottomRight();
    return p.x >= topLeft.x && p.x <= bottomRight.x && 
            p.y >= topLeft.y && p.y <= bottomRight.y
}

export const pointIsInsideHexagon = (p:Vector2, hexagon:Polygon, epsilon = 0.001) =>
{
    if(hexagon.corners != 6) { return console.error(hexagon, " is not a hexagon"); }

    const c = hexagon.center;
    const r = hexagon.radius;
    const x = Math.abs(p.x - c.x);
    const y = Math.abs(p.y - c.y);
    const s = r + epsilon;
    return y < (Math.sqrt(3) * Math.min(s - x, 0.5 * s));
}

export const pointIsInsideCircle = (p:Vector2, circle:Circle) =>
{
    const c = circle.center;
    const r = circle.radius;
    return p.distSquaredTo(c) <= Math.pow(r, 2);
}

export const pointIsInsidePolygon = (p:Vector2, poly:Path) =>
{
    var inside = false;
    const points = poly.toPathArray();
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) 
    {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        
        const intersect = ((yi > p.y) != (yj > p.y))
            && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export const pointIsInsideShape = (p:Vector2, shape:Path) =>
{
    if(shape instanceof Circle) { return pointIsInsideCircle(p, shape); }
    else if(shape instanceof Rectangle) { return pointIsInsideRectangle(p, shape); }
    else if(shape instanceof Triangle) { return pointIsInsideTriangle(p, shape); }
    else if(shape instanceof Polygon || shape instanceof Path) 
    { 
        return pointIsInsidePolygon(p, shape);
    }
    return false;
}