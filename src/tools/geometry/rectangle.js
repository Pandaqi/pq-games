import Point from "./point"

export default class Rectangle {
    constructor(r = {})
    {
        this.center = r.center || new Point();
        this.extents = r.extents || new Point();
    }
}