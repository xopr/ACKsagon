export function drawBox(ctx, points, color = "black")
{
    const xMin = Math.min.apply(this,points.map(p => p.x));
    const xMax = Math.max.apply(this,points.map(p => p.x));
    const yMin = Math.min.apply(this,points.map(p => p.y));
    const yMax = Math.max.apply(this,points.map(p => p.y));

    const lines = [];
    lines.push({x: xMin, y: yMin}, {x: xMin, y: yMax}, {x: xMax, y: yMax}, {x: xMax, y:yMin}, {x: xMin, y: yMin});
    drawLines(ctx, lines, color);
}

export function drawLines(ctx, points, color = "black")
{
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = color;
    const start = points[0];
    ctx.moveTo(start.x, start.y);

    points.forEach((point, idx) => {
        if (!idx) return; // Skip first
        ctx.lineTo(point.x, point.y);
    })
    // ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

export function drawCurve(ctx, points, color = "black")
{
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = color;
    const start = points[0];
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y );
    // ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

export function drawIntersectionPoints(ctx, points, color = "black")
{
    ctx.beginPath();
    for(let i=0;i<points.length;i++)
    {
        const p = points[i];

        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.closePath();
    }
    ctx.fillStyle = color;
    ctx.fill();
}
