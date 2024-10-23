import { V2 } from "./Vector2.js";

import { drawLines, drawCurve, drawBox, drawIntersectionPoints } from "./DrawHelpers.js";
import { calcQLintersects, getNormalAtCurve, intersects, pointInTriangle } from "./LineHelpers.js"

class Element
{
    points = [];
    boundingBox = [];

    // Trigger action (dampen, accelerate, setVector, setFlag, captureBall, setElevation)
    dampening = 0.01; // Metal has lower dampening
    // TODO: Dynamic can have negative dampening or just triggers fixed direction and/or speed

    constructor(points, _trigger)
    {
        // 2 points is a line, 3 is a bezier curve.
        this.points = Object.freeze(points);

        const xMin = Math.min.apply(this,points.map(p => p.x));
        const xMax = Math.max.apply(this,points.map(p => p.x));
        const yMin = Math.min.apply(this,points.map(p => p.y));
        const yMax = Math.max.apply(this,points.map(p => p.y));
        // Create bounding box for collision filtering
        this.boundingBox = [V2(xMin, yMin), V2(xMax, yMax)];

        // TODO: Modifier -> elevation?

    }
}

class Ball
{
    constructor(position, direction)
    {
        this.position = position;
        this.direction = direction;
        // Future: for traversing rails and crossovers.
        this.elevation = 0;

        // TODO: take size into account
        this.size = 0;

        // Used in collision detection; it builds a remainder stack constructed from direction and collisions.
        // this.remainder = [];
    }

    /** Get pin ball start and destination point taking position and direction into account */
    get points()
    {
        return Object.freeze([this.position, this.direction.add(this.position)]);
    }

    // Get the ball's angle
    get angle()
    {
        return this.direction.angle();
    }
}

export class Playfield
{
    gravity = new V2(0, 10);
    balls = [];
    elements = [];

    // TODO: add static elements (lines) with dampening, bounding box.

    constructor(canvas)
    {
        this.canvas = canvas;

        // Create a ball
        this.balls.push(new Ball(new V2(30,125), new V2(300,150)));

        // Create set of static playfield items
        const p1 = V2( 125, 300 );
        const p2 = V2( 570, 280 ); // Control point
        const p3 = V2( 275, 100 );

        this.elements.push(new Element([p1.add(10,-50), p2.add(10,0), p3.add(10,10)], "dampen"));
        
        this.elements.push(new Element([p1, p2, p3], "dampen"));
    }

    frame()
    {
        // Do the (active) ball(s) step (intersections), and adjust for gravity.

        // draw elements from bottom to top

        const ctx = this.canvas.getContext("2d");
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        this.elements.forEach((element) => {
            // Bounding box
            drawBox(ctx, element.boundingBox, "rgba(0,255,0,0.3)");

            // Bezier points
            drawLines(ctx, element.points, "rgba(0,0,0,0.1)");

            // Bezier curve
            drawCurve(ctx, element.points);

        })

        
        // Ball vector
        drawLines(ctx, this.balls[0].points);

        this.handleCollisions();

    }

    handleCollisions()
    {
        // Initialize remainder vectors
        // TODO: needed for multiball (also, make sure flight of time corresponds for each collision)
        // this.balls.forEach((ball) => ball.remainder = [new V2(ball.direction.x, ball.direction.y)]);

        this.balls.forEach((ball) => {
            const ballVector = ball.points.slice();
            
            let collision = true;
            let max = 9;
            const colors = [
                "red",
                // "orange",
                "green",
                "blue",
                "purple",
                // "gray",
                // "pink",
            ];
            while (collision && --max)
            {
                // Find colliding elements, sort by distance
                const collisionElements = this.elements.filter((element) => {
                    // If endpoint within triangle or line intersects with it
                    return pointInTriangle(ballVector[1], element.points) ||
                    intersects(ballVector, [element.points[0], element.points[1]]) ||
                    intersects(ballVector, [element.points[1], element.points[2]]) ||
                    intersects(ballVector, [element.points[0], element.points[2]]);
                });

                // From all collisions, find the point closest to the ball origin
                const collisionData = { distance: Infinity, element: null, root: -1, point: null };
                collisionElements.forEach((element) => {
                    const { roots, intersections } = calcQLintersects( element.points, ballVector );
                    intersections.forEach((point, i) =>{

                        const distance = point.sub(ballVector[0]).length();

                        // Skip ball at intersecting point
                        if (distance < 1)
                            return;

                        if ( distance < collisionData.distance)
                        {
                            collisionData.distance = distance;
                            collisionData.element = element;
                            collisionData.root = roots[i];
                            collisionData.point = point;
                        }
                    });
                });

                console.log(collisionData);

                const ctx = this.canvas.getContext("2d");
                const partialVector = ballVector.slice();
                if (collisionData.point)
                {
                    const {root, point, element} = collisionData;


                    // Update partial vector
                    partialVector[1] = point;

                    drawLines(ctx, partialVector, colors[max % colors.length]);

                    const ballAngle = ballVector[1].sub(ballVector[0]).angle();

                    drawIntersectionPoints(ctx, [point], "green");
                    const vNormal = getNormalAtCurve(element.points, root).mul(50);
                    const normal = Object.freeze([point, vNormal.add(point)]);
        
                    // Ball "bounce"
                    const ballRevAngle = ballAngle > Math.PI ? Math.PI + ballAngle : ballAngle + Math.PI; // TODO: other angles > 180°
                    const normalAngle = vNormal.angle();
                    const outboundAngle = normalAngle - (ballRevAngle - normalAngle);

                    // console.log(
                    //     "ball", ballAngle / Math.PI * 180 | 0,
                    //     "rev", ballRevAngle / Math.PI * 180 | 0,
                    //     "n", normalAngle / Math.PI * 180 | 0,
                    //     "ob", outboundAngle / Math.PI * 180 | 0,
                    // );

                    const remainder = ballVector[1].sub(point).length();
                    const outboundVector = V2(0, remainder).rot(outboundAngle);
        
                    // const outBound = Object.freeze([point, outboundVector.add(point)]);
                    const outBound = V2(0, 5).rot(outboundAngle).add(point);
                    // TODO: offset point0 towards outboundvector
                    ballVector[0] = outBound;
                    ballVector[1] = outboundVector.add(point);
        
                    // drawLines(ctx, normal, "red");
                    // drawLines(ctx, ballVector, colors[max]); // "purple"

                }
                else
                {
                    drawLines(ctx, partialVector, "black"); // "purple"
                }


                // collisionElements.forEach((element) => {
                //     const { roots, intersections: points } = calcQLintersects( element.points, ballVector );
                //     const [root] = roots;
                //     const [point] = points;


                //     const partialVector = ballVector.slice();

                //     // // Do we have intersection?
                //     // if (points.length && points[0].sub(ballVector).length < 3)
                //     // {
                //     //     // Remove ball at intersecting point
                //     //     points.shift();

                //     // }
                    
                //     if (points.length)
                //         partialVector[1] = point;
                //     const ctx = this.canvas.getContext("2d");
                //     drawLines(ctx, partialVector, colors[max % colors.length]);

                //     if (points.length)
                //     {
                //         const ballAngle = ballVector[1].sub(ballVector[0]).angle();

                //         drawIntersectionPoints(ctx, [point], "green");
                //         const vNormal = getNormalAtCurve(element.points, root).mul(50);
                //         const normal = Object.freeze([point, vNormal.add(point)]);
            
                //         // Ball "bounce"
                //         const ballRevAngle = ballAngle > Math.PI ? Math.PI + ballAngle : ballAngle + Math.PI; // TODO: other angles > 180°
                //         const normalAngle = vNormal.angle();
                //         const outboundAngle = normalAngle - (ballRevAngle - normalAngle);

                //         // console.log(
                //         //     "ball", ballAngle / Math.PI * 180 | 0,
                //         //     "rev", ballRevAngle / Math.PI * 180 | 0,
                //         //     "n", normalAngle / Math.PI * 180 | 0,
                //         //     "ob", outboundAngle / Math.PI * 180 | 0,
                //         // );

                //         const remainder = ballVector[1].sub(point).length();
                //         const outboundVector = V2(0, remainder).rot(outboundAngle);
            
                //         // const outBound = Object.freeze([point, outboundVector.add(point)]);
                //         const outBound = V2(0, 5).rot(outboundAngle).add(point);
                //         // TODO: offset point0 towards outboundvector
                //         ballVector[0] = outBound;
                //         ballVector[1] = outboundVector.add(point);
            
                //         // drawLines(ctx, normal, "red");
                //         // drawLines(ctx, ballVector, colors[max]); // "purple"

                //     }
                //     else
                //     {
                //         collision = false;
                //     }
                // });

                if (!collisionElements.length)
                    collision = false;
            }

            // Update ball position and direction
            // ...
        });


        // Iterate all moving objects (balls) -> direction vector
        // find collision with element bounding box AND other moving object direction vector

        // Take nearest collision, calculate remainder vector and re-iterate this test (iterate all balls)

    }

    // Create curve (start, control end) and ball (offset, direction) vector groups
    // TODO: check collision detection rect -> triangle -> curve
    // AND/OR check if vector crosses 2 points of triangle



    // Final step: add the gravity
    // ...
}