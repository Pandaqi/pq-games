export default {

    // testing DISTANCE
    getPointsInRange(p, list, dist)
    {
        const arr = [];
        const maxDistSquared = Math.pow(dist, 2);
        for(const point of list)
        {
            const distSquared = p.distSquaredTo(point);
            if(distSquared > maxDistSquared) { continue; }
            arr.push(point);
        }
        return arr;
    },

    getClosestPoint(p, list)
    {
        let closestDist = Infinity;
        let closestPoint = null;
        for(const point of list)
        {
            const distSquared = p.distSquaredTo(point);
            if(distSquared > closestDist) { continue; }
            closestDist = distSquared;
            closestPoint = point; 
        }
        return closestPoint;
    },

    distToLineSegmentSquared(p, v, w) {
        const l2 = v.distSquaredTo(w);
        if(Math.abs(l2) < 0.0001) { return p.distSquaredTo(v); }

        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        const closestPointOnLine = new Point({ 
            x: v.x + t * (w.x - v.x), 
            y: v.y + t * (w.y - v.y) 
        });

        return p.distSquaredTo(closestPointOnLine);
    },
    distToLineSegment(p, v, w) { return Math.sqrt(this.distToSegmentSquared(p, v, w)); },
    distToLineSegments(p, arr, closeLines = true)
    {
        let smallestDist = Infinity;
        let numPoints = arr.length;
        if(!closeLines) { numPoints--; }
        for(let i = 0; i < numPoints; i++)
        {
            const p1 = arr[i];
            const p2 = arr[(i + 1) % arr.length];
            smallestDist = Math.min(smallestDist, this.distToSegment(p, p1, p2));
        }
        return smallestDist;
    },

    // testing INTERSECTION

    // @SOURCE: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
    // returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
    intersectsLine(a,b,c,d,p,q,r,s) {
        const eps = 0.00001; // epsilon always needed with these kinds of operations
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) { return false; } // parallel or anti-parallel
        
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return ((0-eps) < lambda && lambda < (1+eps)) && ((0-eps) < gamma && gamma < (1+eps));
    },


    // testing if INSIDE
    triangleSign(p1, p2, p3) { return (p1.x-p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y); },
    pointIsInsideTriangle(p, triangle, epsilon = 0.001)
    {
        const edges = triangle.edges;
        const b1 = this.triangleSign(p, edges[0], edges[1]) <= epsilon;
        const b2 = this.triangleSign(p, edges[1], edges[2]) <= epsilon;
        const b3 = this.triangleSign(p, edges[2], edges[0]) <= epsilon;
        return (b1 == b2) && (b2 == b3);
    },

    pointIsInsideRectangle(p, rect)
    {
        const c = rect.center
        const e = rect.extents;
        return p.x >= (c.x - 0.5*e.x) && p.x <= (c.x + 0.5*e.x) && 
                p.y >= (c.y - 0.5*e.y) && p.y <= (c.y + 0.5*e.y)
    },

    pointIsInsideHexagon(p, hexagon, epsilon = 0.001)
    {
        const c = hexagon.center;
        const r = hexagon.radius;
        const x = Math.abs(p.x - c.x);
        const y = Math.abs(p.y - c.y);
        const s = r + epsilon;
        return y < (Math.sqrt(3) * Math.min(s - x, 0.5 * s));
    },

    pointIsInsideCircle(p, circle)
    {
        const c = circle.center;
        const r = circle.radius;
        return p.distSquaredTo(c) <= Math.pow(r, 2);
    }
}