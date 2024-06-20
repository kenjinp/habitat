#include "../glsl/common.glsl";
#include "./Cylinder.glsl";
#include "./PointLightShadow.glsl";

uniform mat4 uProjectionMatrixInverse; // camera.projectionMatrixInverse
uniform mat4 uViewMatrixInverse; // camera.matrixWorld
uniform vec3 uCameraPosition;
uniform vec3 uCameraWorldDirection;
uniform float uTime;
uniform vec3 uSunPosition;
uniform int uFrame;
uniform sampler2D uBlueNoise;
uniform bool uUseJitter;
uniform int uMaxSteps;
uniform Cylinder uCylinder;
#include "./Noise.glsl";

uniform sampler2D uPointShadowMap;
uniform mat4 uPointLightShadowMatrix;
uniform PointLightShadow uPointLightShadow;
uniform PointLight uPointLight;


#define RAY_BETA vec3(5.5e-6, 13.0e-6, 22.4e-6) /* rayleigh, affects the color of the sky */
#define MIE_BETA vec3(21e-6) /* mie, affects the color of the blob around the sun */
#define AMBIENT_BETA vec3(0.0) /* ambient, affects the scattering color when there is no lighting from the sun */
#define ABSORPTION_BETA vec3(2.04e-5, 4.97e-5, 1.95e-6) /* what color gets absorbed by the atmosphere (Due to things like ozone) */
#define G 0.76 /* mie scattering direction, or how big the blob around the sun is */
// and the heights (how far to go up before the scattering has no effect)
#define HEIGHT_RAY 2e3 // 8e3 /* rayleigh height */
#define HEIGHT_MIE 5e2 //1.2e3 /* and mie, make this promenant to increase smogginess */
#define HEIGHT_ABSORPTION 30e3 /* at what height the absorption is at it's maximum */
#define ABSORPTION_FALLOFF 4e3 /* how much the absorption decreases the further away it gets from the maximum height */
// and the steps (more looks better, but is slower)
// the primary step has the most effect on looks
// and these on desktop

// const vec3  SUN_COLOR = vec3(20.0, 19.0, 13.0);
const vec3  SUN_COLOR = vec3(10, 10, 10);
const vec3  SKY_COLOR = vec3(50.0, 100.0, 200.0);
const vec3 SHADOW_COLOR = vec3(200.0, 0.0, 0.0);
const float SUN_SCATTERING_ANISO = 0.07;


vec3 _ScreenToWorld(vec3 posS) {
  vec2 uv = posS.xy;
  float z = posS.z;
  float nearZ = 0.01;
  float farZ = cameraFar;
  float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
  vec3 direction = (uProjectionMatrixInverse * vec4(vUv * 2.0 - 1.0, 0.0, 1.0)).xyz;
  direction = (uViewMatrixInverse * vec4(direction, 0.0)).xyz;
  direction = normalize(direction);
  direction /= dot(direction, uCameraWorldDirection);
  return uCameraPosition + direction * depth;
}

float readDepth( float z ) {
  return perspectiveDepthToViewZ( z, cameraNear, cameraFar );
}

float A_logDepthBufFC () {
  float logDepthBufFC = 2.0 / ( log( cameraFar + 1.0 ) / log(2.0) );
  return logDepthBufFC;
}

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 Translate(in vec3 p, in vec3 t) {
    return p - t;
}

// Henyey-Greenstein phase function
float HG_phase(in vec3 L, in vec3 V, in float aniso)
{
    float cosT = dot(L,-V);
    float g = aniso;
    return (1.0-g*g) / (4.0*PI*pow(1.0 + g*g - 2.0*g*cosT, 3.0/2.0));
}

vec3 get_sun_direction(in vec3 pos)
{
    vec3 dir = vec3(pos - uSunPosition);
    dir = normalize(dir);
    
    return dir;
}

	// vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	// vec4 shadowWorldPosition;


float remap( in float value, in float x1, in float y1, in float x2, in float y2) {
  return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;
}

float cloudScene(vec3 position) {
  return fbm(position);
}

void main() {
  vec4 sceneColor = vec4(0.0, 0.0, 0.0, 1.0);

  float z = unpackRGBAToFloat(texture2D(depthBuffer, vUv));
  vec3 positionWorldSpace = _ScreenToWorld(vec3(vUv, z));
  float sceneDepth = length(positionWorldSpace - uCameraPosition);

  // temporal jittering
  float jitter = 1.0;  
  if (uUseJitter) {
    float blueNoise = texture2D(uBlueNoise, gl_FragCoord.xy / 1024.0).r;
    float gr = 1.618033988749;
    jitter = fract(blueNoise + (gr * float(uFrame)));
    jitter = (jitter > 0.5 ? 1.0 - jitter : jitter) * 2.0;
  }

  // Ray Info 
  vec3 rayOrigin = uCameraPosition;
  vec3 rayDirection = normalize(positionWorldSpace - uCameraPosition);
  Ray ray = Ray(rayOrigin, rayDirection);


  // Intersection stuff
  float cylinderRadius = uCylinder.radius;
  float cylinderHeight = uCylinder.height;
  vec3 cylinderPosition = vec3(0.0, -cylinderHeight/2.0, 0.0);
  vec4 accum = vec4(0.0);
  vec2 intersection = intersectRayCylinder(Translate( ray.origin, cylinderPosition), ray.direction, cylinderRadius, cylinderHeight);

  float intersectionNear = intersection.x;
  float intersectionFar = intersection.y;
  vec3 sky = SKY_COLOR;
  vec3 sun = SUN_COLOR;

  // no intersection
  if (intersection == vec2(-1.0)) {
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
  }
  // terrain or other mesh in front of the sdf box
  if (sceneDepth < intersectionNear) {
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // the ray starts at the intersection point
  Ray begin = Ray(ray.origin + ray.direction * intersectionNear, ray.direction);
  // if we're inside the box, start at the input ray origin instead
  if (intersectionNear <= 0.0) {
    begin = Ray(ray.origin, ray.direction);
  }
  Ray end = Ray(ray.origin + ray.direction * min(intersectionFar, sceneDepth), ray.direction);

  float intersectionDistance = length(end.origin - begin.origin);
  int numSteps = uMaxSteps;
  float distancePerStep = intersectionDistance / float(numSteps);

  float fogIntensity = 4e-6;
  vec3 sunDir = get_sun_direction(ray.origin);
  float sun_phase = HG_phase(sunDir, ray.direction, SUN_SCATTERING_ANISO)*3.0;

  vec3 shadowWorldNormal = inverseTransformDirection(sunDir, viewMatrix );

  float depth = 0.0;
  depth += distancePerStep;

  for(int i = 0; i < numSteps; ++i) {
    vec3 currentPosition = begin.origin + ray.direction * (distancePerStep * float(i)) * jitter;

    // simple height attenuation
    float height = length(currentPosition - vec3(0.0, currentPosition.y, 0.0));
    float height_factor = clamp(remap(height, 0.0, cylinderRadius * 2.0, 0.0, 1.0), 0.0, 1.0);
    height_factor = height_factor * height_factor * height_factor;

    // shadow stuff
    vec4 shadowWorldPosition = vec4(currentPosition, 1.0) + vec4( shadowWorldNormal * uPointLightShadow.shadowNormalBias, 0 ); 
    vec4 directionalShadowCoord = uPointLightShadowMatrix * shadowWorldPosition;

    vec4 shadowCoord = uPointLightShadowMatrix * vec4(currentPosition, 1.0);
    directionalShadowCoord.xyz /= directionalShadowCoord.w;

    float shadowDepth = 1.0 - getPointShadow( uPointShadowMap, //
      uPointLightShadow.shadowMapSize, //
      uPointLightShadow.shadowBias, //
      uPointLightShadow.shadowRadius, //
      directionalShadowCoord, //
      uPointLightShadow.shadowCameraNear, //
      uPointLightShadow.shadowCameraFar //
    );

    vec3 sky = SKY_COLOR * (height_factor * 0.8) * distancePerStep;
    vec3 sun = SUN_COLOR * sun_phase * (height_factor * 0.6 )  * distancePerStep;

    // accum += sky * fogIntensity;
    // accum += sun * fogIntensity;

    bool inShadow = shadowDepth >= 1.0;
    if (!inShadow) {
          accum.xyz += sky * fogIntensity;
          accum.xyz += sun * fogIntensity;
    }

    // cloud stuff
    float density = cloudScene(currentPosition);
     // We only draw the density if it's greater than 0
    // if (density > 0.0) {
    //   // Directional derivative
    //   // For fast diffuse lighting
    //   float diffuse = clamp((cloudScene(currentPosition) - cloudScene(currentPosition + 0.3 * sunDir))/0.3, 0.0, 1.0 );
    //   vec3 lin = vec3(0.60,0.60,0.75) * 1.1 + 0.8 * vec3(1.0,0.6,0.3) * diffuse;
    //   vec4 color = vec4(mix(vec3(1.0,1.0,1.0), vec3(0.0, 0.0, 0.0), density), density );
    //   color.rgb *= lin;
    //   color.rgb *= color.a;
    //   accum += color*(1.0-accum.a);
    // }

    depth += distancePerStep;
  }

  sceneColor = accum;

  gl_FragColor = sceneColor;
}
