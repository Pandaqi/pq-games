import { Vector2 } from "../../geometry/vector2";
import { isZero } from "../../tools/numbers/checks";

// @SOURCE (basically just shows what HTML5 canvas does behind the scenes): https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js
// @SOURCE (copy some more functions of this one, as it's nice): https://github.com/leeoniya/transformation-matrix-js/blob/master/src/matrix.js

// I don't use the DOMMatrix natively, just a simple number array
// because I don't want to rely on that API always staying the same (or not doing funny business I can barely debug/research/figure out)
// and I want this specific functionality available in any other situations as well
export class TransformationMatrix
{
    m: number[];

    constructor()
    {
        this.setIdentity();
    }

    clone()
    {
        return new TransformationMatrix().fromArray(this.m);
    }

    fromArray(a:number[])
    {
        this.m = a.slice();
        return this;
    }

    fromContext(ctx:CanvasRenderingContext2D)
    {
        const t = ctx.getTransform();
        this.m = [t.a, t.b, t.c, t.d, t.e, t.f];
        return this;
    }

    applyToContext(ctx:CanvasRenderingContext2D)
    {
        ctx.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
    }

    applyToPoint(p:Vector2) 
    {
		return new Vector2(
			p.x * this.m[0] + p.y * this.m[2] + this.m[4],
			p.x * this.m[1] + p.y * this.m[3] + this.m[5]
        );
	}

    applyToArray(points:Vector2[])
    {
        return points.map((x) => this.applyToPoint(x));
    }

    setIdentity()
    {
        this.m = [1, 0, 0, 1, 0, 0];
        return this;
    }

    setAll(translate:Vector2, rotate:number, scale:Vector2)
    {
        this.m = [
            Math.cos(rotate) * scale.x,
            Math.sin(rotate) * scale.x,
            -Math.sin(rotate) * scale.y,
            Math.cos(rotate) * scale.y,
            translate.x,
            translate.y,
        ]
    }

    applyAll(translate:Vector2, rotate:number, scale:Vector2)
    {
        this.scale(scale); 
        this.rotate(rotate);
        this.translate(translate);
    }

    // @SOURCE (for all transforms below): https://stackoverflow.com/questions/18437039/canvashow-to-complete-translate-skew-rotate-in-just-one-transform-statement
    translate(p:Vector2)
    {
        if(p.isZero()) { return this; }
        this.m[4] += this.m[0] * p.x + this.m[2] * p.y;
        this.m[5] += this.m[1] * p.x + this.m[3] * p.y;
        return this;
    }

    rotate(rad:number)
    {
        if(isZero(rad)) { return this; }

        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const m11 = this.m[0] * cos + this.m[2] * sin;
        const m12 = this.m[1] * cos + this.m[3] * sin;
        const m21 = -this.m[0] * sin + this.m[2] * cos;
        const m22 = -this.m[1] * sin + this.m[3] * cos;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22; 
        return this;
    }

    scale(p:Vector2)
    {
        if(p.isZero()) { return this; }
        this.m[0] *= p.x;
        this.m[1] *= p.x;
        this.m[2] *= p.y;
        this.m[3] *= p.y;
        return this;
    }

    skew(rads:Vector2)
    {
        if(rads.isZero()) { return this; }

        const tanX = Math.tan(rads.x);
        const tanY = Math.tan(rads.y);
        
        const m0 = this.m[0]; 
        const m1 = this.m[1];
        
        this.m[0] += tanY * this.m[2]; 
        this.m[1] += tanY * this.m[3]; 
        this.m[2] += tanX * m0; 
        this.m[3] += tanX * m1;

        return this;
    }

    invert() 
    {
		const a = this.m[0],
			b = this.m[1],
			c = this.m[2],
			d = this.m[3],
			e = this.m[4],
			f = this.m[5],
			dt = (a * d - b * c);
        
        this.m = [
            d / dt,
            -b / dt,
            -c / dt,
            a / dt,
            (c * f - d * e) / dt,
            -(a * f - b * e) / dt
        ]

		return this;
	}
}