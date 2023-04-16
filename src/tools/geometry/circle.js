import Point from "./point"

export default class Circle {
    constructor(c = {})
    {
        this.center = c.center || new Point();
        this.radius = c.radius || 10;
    }
}