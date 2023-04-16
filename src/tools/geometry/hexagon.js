import Point from "./point";

export default class Hexagon {
    constructor(h = {})
    {
        this.center = h.center || new Point();
        this.radius = h.radius || 10;
    }
}