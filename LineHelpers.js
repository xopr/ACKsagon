import { V2 } from "./Vector2.js";

// linear interpolation utility
const lerp = (a, b, x) => a + x * ( b - a );
///////////////////////////////////////////////////

//
export function pointInTriangle(point, triangle)
{
    const [p0, p1, p2] = triangle;

    const dX = point.x - p0.x;
    const dY = point.y - p0.y;
    const dX20 = p2.x - p0.x;
    const dY20 = p2.y - p0.y;
    const dX10 = p1.x - p0.x;
    const dY10 = p1.y - p0.y;

    const s_p = (dY20*dX) - (dX20*dY);
    const t_p = (dX10*dY) - (dY10*dX);
    const D = (dX10*dY20) - (dY10*dX20);

    if (D > 0)
        return (s_p >= 0) && (t_p >= 0) && (s_p + t_p) <= D;
    else
        return (s_p <= 0) && (t_p <= 0) && (s_p + t_p) >= D;
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
export function intersects(line1, line2/*, ...lineN*/)
{
    // TODO: multiple line segments don't work as expected
    if (arguments.length > 2)
    {
        const args = Array.prototype.slice.call(arguments);
        args.pop();
        args.pop();
        const ret = intersects(line1, args);
        if (ret)
            return true;
    }

    const [a, b] = line1;
    const [c, d] = line2;

    var det, gamma, lambda;
    det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
    if (det === 0) {
      return false;
    } else {
      lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
      gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  };


export function calcQLintersects(curve, line)
{
    const [ p1, p2, p3] = curve;
    const [ a1, a2 ] = line;
    const intersections = [];

    // inverse line normal
    const normal = {
        x: a1.y - a2.y,
        y: a2.x - a1.x,
    }

    // Q-coefficients
    const c2 = {
        x: p1.x + p2.x*-2 + p3.x,
        y: p1.y + p2.y*-2 + p3.y
    }

    const c1 = {
        x: p1.x*-2 + p2.x*2,
        y: p1.y*-2 + p2.y*2,
    }

    const c0 = {
        x: p1.x,
        y: p1.y
    }

    // Transform to line 
    const coefficient = a1.x * a2.y - a2.x * a1.y;
    const a = normal.x * c2.x + normal.y * c2.y;
    const b = (normal.x * c1.x + normal.y * c1.y) / a;
    const c = (normal.x * c0.x + normal.y * c0.y + coefficient) / a;

    // solve the roots
    const roots=[];
    const d = b * b - 4 * c;
    if (d > 0)
    {
        const e = Math.sqrt(d);
        roots.push((-b+Math.sqrt(d))/2);
        roots.push((-b-Math.sqrt(d))/2);
    }
    else if (d === 0)
    {
        roots.push(-b / 2);
    }

    const filteredRoots = roots.filter((t,i) => {
        const minX = Math.min(a1.x, a2.x);
        const minY = Math.min(a1.y, a2.y);
        const maxX = Math.max(a1.x, a2.x);
        const maxY = Math.max(a1.y, a2.y);

        // TIME OVER CURVE
        // const t = roots[i];
        if (t >= 0 && t <= 1)
        {
            // possible point -- pending bounds check
            const point = V2(
                lerp(lerp(p1.x, p2.x,t), lerp(p2.x, p3.x, t), t),
                lerp(lerp(p1.y, p2.y,t), lerp(p2.y, p3.y, t), t)
            );

            const x = point.x;
            const y = point.y;
            // bounds checks
            if(a1.x == a2.x && y >= minY && y <= maxY)
            {  
                // vertical line
                intersections.push(point);
                return true;
            }
            else if(a1.y == a2.y && x >= minX && x <= maxX)
            {
                // horizontal line
                intersections.push(point);
                return true;
            }
            else if(x >= minX && y >= minY && x <= maxX && y <= maxY)
            {
                // line passed bounds check
                intersections.push(point);
                return true;
            }
        }

        return false;
    });

    return {intersections, roots: filteredRoots};
}

// these methods are only for quadratic curves
// p1: {x,y} start point
// pc: {x,y} control point    
// p2: {x,y} end point
// t: (float between 0 and 1) time in the curve

export function getPointAtCurve(curve, t)
{
    // TODO: check if derivative is same as point at
    const [p1, pc, p2] = curve;

    const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * pc.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * pc.y + t * t * p2.y;

    return V2( x, y );
}

export function getDerivativeAtCurve(curve, t)
{
    // Returns the derivative vector at root (time) t in the direction of the curve points p1->p2
    const [p1, pc, p2] = curve;

    const d1 = { x: 2 * (pc.x - p1.x), y: 2 * (pc.y - p1.y) };
    const d2 = { x: 2 * (p2.x - pc.x), y: 2 * (p2.y - pc.y) };

    const x = (1 - t) * d1.x + t * d2.x;
    const y = (1 - t) * d1.y + t * d2.y;

    return V2( x, y );
}

export function getNormalAtCurve(curve, t)
{
    const d = getDerivativeAtCurve(curve, t);

    // Normalize to length 1 and rotate -90 degrees
    // TODO: is -90 always correct?
    const q = Math.sqrt(d.x * d.x + d.y * d.y);

    const x = d.y / q;
    const y = -d.x / q;

    return V2( x, y );
}

export function getAngle(points)
{
    const [ v1, v2 ] = points;

    const a = Math.atan2(v1.x - v2.x, v1.y - v2.y);
    if (a < 0)
        return Math.abs(a);
    return 2 * Math.PI - a;
}

export function getLength(points)
{
    // TODO: multiple line segments
    const [ v1, v2 ] = points;

    return v2.sub(v1).length();
}
