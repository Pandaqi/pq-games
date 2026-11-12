import { Vector2 } from "../vector2";
import { arc, ArcData } from "./arcs";
import { bezierCurve } from "./curves";

enum PathCommand
{
    START,
    LINE,
    QUAD,
    CUBIC,
    ARC
}

interface PointPathParams
{
    point?:Vector2
    command?:PathCommand
    relative?:boolean
    controlPoint1?:Vector2
    controlPoint2?:Vector2
    arcData?:ArcData
}

export { PointPath, PathCommand }
export default class PointPath
{
    point: Vector2
    command: PathCommand
    relative: boolean
    controlPoint1: Vector2
    controlPoint2: Vector2
    arcData: ArcData

    constructor(params:PointPathParams = {})
    {
        this.point = params.point ?? new Vector2();
        this.command = params.command ?? PathCommand.LINE;
        this.relative = params.relative ?? false;
        this.controlPoint1 = params.controlPoint1 ?? new Vector2();
        this.controlPoint2 = params.controlPoint2 ?? new Vector2();
        this.arcData = params.arcData ?? new ArcData();
    }

    clone(deep = false)
    {
        const p = deep ? this.point.clone() : this.point;
        const cp1 = (this.controlPoint1 && deep) ? this.controlPoint1.clone() : this.controlPoint1;
        const cp2 = (this.controlPoint2 && deep) ? this.controlPoint2.clone() : this.controlPoint2;

        return new PointPath({
            point: p, command: this.command, relative: this.relative,
            controlPoint1: cp1, controlPoint2: cp2,
            arcData: this.arcData.clone(deep)
        })
    }

    toPath(prevPoint:Vector2)
    {
        const p = this.getPointAbsolute(prevPoint);
        if(this.command == PathCommand.START || this.command == PathCommand.LINE) {
            return p;
        } else if(this.command == PathCommand.QUAD || this.command == PathCommand.CUBIC) {
            return bezierCurve({ from: prevPoint, to: p, controlPoint1: this.controlPoint1, controlPoint2: this.controlPoint2 });
        } else if(this.command == PathCommand.ARC) {
            return arc({ from: prevPoint, to: p, arcData: this.arcData });
        }
    }

    getPointAbsolute(prevPoint:Vector2)
    {
        if(!this.relative) { return this.point.clone(); }
        return prevPoint.clone().move(this.point);
    }

    toPathString() : string
    {
        let string = "";
        const pstr = this.point.toSVGString();
        if(this.command == PathCommand.START) {
            string = "M" + pstr;
        } else if(this.command == PathCommand.LINE) {
            string = "L" + pstr;
        } else if(this.command == PathCommand.CUBIC) {
            string = "C" + this.controlPoint1.toSVGString() + this.controlPoint2.toSVGString() + pstr;
        } else if(this.command == PathCommand.QUAD) {
            string = "Q" + this.controlPoint1.toSVGString() + pstr;
        } else if(this.command == PathCommand.ARC) {
            string = "A" + this.arcData.toPathString() + pstr;
        }

        if(this.relative) { string = string.toLowerCase(); }
        return string;
    }

    toPath2D(path:Path2D)
    {
        const cmd = this.command;
        const p = this.point;
        const cp1 = this.controlPoint1;
        const cp2 = this.controlPoint2;
        const ad = this.arcData;

        if(cmd == PathCommand.START) {
            path.moveTo(p.x, p.y);
        } else if(cmd == PathCommand.LINE) { 
            path.lineTo(p.x, p.y);
        } else if(cmd == PathCommand.CUBIC) {
            path.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y);
        } else if(cmd == PathCommand.QUAD) {
            path.quadraticCurveTo(cp1.x, cp1.y, p.x, p.y);
        } else if(cmd == PathCommand.ARC) {
            path.arcTo(cp1.x, cp1.y, p.x, p.x, ad.radius.x);
        }

        return path;
    }
}