vec2 intersectRayCylinder(vec3 rayOrigin, vec3 rayDir, float r, float h) {
    // Quadratic coefficients for side intersections
    float a = rayDir.x * rayDir.x + rayDir.z * rayDir.z;
    float b = 2.0 * (rayOrigin.x * rayDir.x + rayOrigin.z * rayDir.z);
    float c = rayOrigin.x * rayOrigin.x + rayOrigin.z * rayOrigin.z - r * r;

    // Solve the quadratic equation for the sides
    float discriminant = b * b - 4.0 * a * c;

    // Initialize the intersection distances
    float t1 = -1.0;
    float t2 = -1.0;
    float sqrtDiscriminant = 0.0;

    if (discriminant >= 0.0) {
        sqrtDiscriminant = sqrt(discriminant);
        t1 = (-b - sqrtDiscriminant) / (2.0 * a);
        t2 = (-b + sqrtDiscriminant) / (2.0 * a);
    }

    // Intersection points on the sides
    vec3 hitPoint1 = rayOrigin + t1 * rayDir;
    vec3 hitPoint2 = rayOrigin + t2 * rayDir;

    // Check intersections with the end caps
    float tCap1 = (0.0 - rayOrigin.y) / rayDir.y; // Bottom cap
    float tCap2 = (h - rayOrigin.y) / rayDir.y; // Top cap

    // Initialize the nearest and farthest distances
    float nearest = -1.0;
    float farthest = -1.0;

    // Check if the origin is inside the cylinder body
    if (rayOrigin.x * rayOrigin.x + rayOrigin.z * rayOrigin.z <= r * r && rayOrigin.y >= 0.0 && rayOrigin.y <= h) {
        nearest = 0.0;
    }

    // Check if the side intersections are within the cylinder's height
    if (discriminant >= 0.0) {
        if (t1 >= 0.0 && hitPoint1.y >= 0.0 && hitPoint1.y <= h) {
            if (nearest < 0.0) {
                nearest = t1;
            }
            farthest = t1;
        }
        if (t2 >= 0.0 && hitPoint2.y >= 0.0 && hitPoint2.y <= h) {
            if (nearest < 0.0 || t2 < nearest) {
                nearest = t2;
            }
            if (t2 > farthest) {
                farthest = t2;
            }
        }
    }

    // Check if the bottom cap intersection is within the cylinder's radius
    vec3 hitCap1 = rayOrigin + tCap1 * rayDir;
    if (tCap1 >= 0.0 && length(hitCap1.xz) <= r) {
        if (nearest < 0.0 || tCap1 < nearest) {
            nearest = tCap1;
        }
        if (tCap1 > farthest) {
            farthest = tCap1;
        }
    }

    // Check if the top cap intersection is within the cylinder's radius
    vec3 hitCap2 = rayOrigin + tCap2 * rayDir;
    if (tCap2 >= 0.0 && length(hitCap2.xz) <= r) {
        if (nearest < 0.0 || tCap2 < nearest) {
            nearest = tCap2;
        }
        if (tCap2 > farthest) {
            farthest = tCap2;
        }
    }

    // Return the intersection distances
    return vec2(nearest, farthest);
}

struct Cylinder {
    vec3 position;
    float radius;
    float height;
};
