export function V2(x, y)
{
    if (!(this instanceof V2)) return new V2(x, y);
    this.x = x;
    this.y = y;
}
V2.prototype.toString = function()
{
    return `X: ${this.x | 0}, Y: ${this.y | 0}`;
}
V2.prototype.add = function(x, y)
{
    if (x instanceof V2) return this.add(x.x, x.y);
    return new V2(this.x + x, this.y + y);
}
V2.prototype.sub = function(x, y)
{
    if (x instanceof V2) return this.sub(x.x, x.y);
    return new V2(this.x - x, this.y - y);
}
V2.prototype.mul = function(factor)
{
    return new V2(this.x * factor, this.y * factor);
}
V2.prototype.div = function(factor)
{
    return new V2(this.x / factor, this.y / factor);
}
V2.prototype.angle = function()
{
    const a = Math.atan2(this.x, this.y);
    if (a < 0)
        return Math.abs(a) + Math.PI;
    return Math.PI - a;
}
V2.prototype.rot = function(rad)
{
    var cos = Math.cos(Math.PI + rad);
    var sin = Math.sin(Math.PI + rad);
    return new V2( this.x * cos - this.y * sin, this.x * sin + this.y * cos);
}
V2.prototype.length = function()
{
    return Math.sqrt(this.x * this.x + this.y * this.y);
}
