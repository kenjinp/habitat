uniform mat4 uProjectionMatrixInverse; // camera.projectionMatrixInverse
uniform mat4 uViewMatrixInverse; // camera.matrixWorld
uniform vec3 uCameraPosition;
uniform vec3 uCameraWorldDirection;
uniform float uTime;
uniform vec3 uSunPosition;

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


#include "./Noise.glsl";
#include "./Cylinder.glsl";
#include "./PointLightShadow.glsl";

// https://github.com/mrdoob/three.js/blob/fe312e19c2d8fa4219d035f0b83bc13a46fb1927/src/renderers/shaders/ShaderChunk/packing.glsl.js#L24

#define saturate(a) clamp( a, 0.0, 1.0 )

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

const int MAX_STEPS = 64;

// const vec3  SUN_COLOR = vec3(20.0, 19.0, 13.0);
const vec3  SUN_COLOR = vec3(10, 10, 10);
const vec3  SKY_COLOR = vec3(50.0, 100.0, 200.0);
const vec3 SHADOW_COLOR = vec3(200.0, 0.0, 0.0);
const float SUN_SCATTERING_ANISO = 0.07;


uniform sampler2D uPointShadowMap;
uniform mat4 uPointLightShadowMatrix;
uniform PointLightShadow uPointLightShadow;

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

float easeOutExpo(in float x) {
  return x == 1. ? 1. : 1. - pow(2., -10. * x);
}

float easeInExpo(in float x) {
  return x == 0. ? 0. : pow(2., 10. * x - 10.);
}

// struct Intersection {
//     vec3 distanceNear;
//     vec3 distancefar;
//     Ray begin;
//     Ray end;
// };

vec4 badRayMarch(in Ray ray, in vec3 boxPosition, in float maxDistance, in vec3 scene_color) {
    float distanceTraveled = 0.0;
    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 sunDir = get_sun_direction(ray.origin);
    vec3 accum = scene_color;
    
    float sun_phase = HG_phase(sunDir, ray.direction, SUN_SCATTERING_ANISO)*3.0;
    vec2 intersection = intersectRayCylinder(Translate( ray.origin, boxPosition), ray.direction, 5000.0 / 2.0, 15000.0);

    float intersectionNear = intersection.x;
    float intersectionFar = intersection.y;

    // no intersection
    if (intersection == vec2(-1.0)) return vec4(accum, 1.0);
    // terrain or other mesh in front of the sdf box
    if (maxDistance < intersectionNear) return vec4(accum, 1.0);

    Ray begin = Ray(ray.origin + ray.direction * intersectionNear, ray.direction);
    // if we're inside the box, start at the input ray origin
    if (intersectionNear <= 0.0) {
      begin = Ray(ray.origin, ray.direction);
    }
    Ray end = Ray(ray.origin + ray.direction * min(intersectionFar, maxDistance), ray.direction);

    float intersectionDistance = length(end.origin - begin.origin);
    float distancePerStep = intersectionDistance / float(MAX_STEPS);

    float fog = 0.0002 / 32.0;

// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.
    vec3 shadowWorldNormal = inverseTransformDirection(sunDir, viewMatrix );

    for(int i = 0; i < MAX_STEPS; ++i) {

      // get elevation from cylinder walls

      vec3 currentPosition = begin.origin + ray.direction * (distancePerStep * float(i));
      float height = length(currentPosition - vec3(0.0, currentPosition.y, 0.0));
      
      // // float height = currentPosition.y;
      float height_factor = clamp(remap(height, 0.0, 5000.0, 0.0, 1.0), 0.0, 1.0);
      // height_factor = easeInExpo(height_factor);
      // height_factor = 0.3;

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

      // float shadowDepth = texture(uPointShadowMap, directionalShadowCoord.xy).r;
      // shadowDepth = unpackRGBAToDepth( texture2D( uDirectizonalShadowMap, shadowCoord.xy ) );
      // shadowDepth = unpackRGBAToDepth( texture2D( uPointShadowMap, directionalShadowCoord.xy ) );

      float dianceToSun = length(uSunPosition - currentPosition);
      vec3 sky = SKY_COLOR * (height_factor * 0.2) * distancePerStep;
      vec3 sun = SUN_COLOR * sun_phase * (height_factor * 0.5 )  * distancePerStep;
      
      // accum += sky * fog;
      // accum += sun * fog;

      bool inShadow = shadowDepth < directionalShadowCoord.z;
      if (shadowDepth >= 1.0) {
          // accum += SHADOW_COLOR * vec3(shadowDepth);
      } else {
          accum += sky * fog;
          accum += sun * fog;
      }
    }

    return vec4(accum, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec4 sceneColor = inputColor;
  float depthValue = getViewZ(depth);
  float d = readDepth(texture2D(depthBuffer, uv).x);
  float v_depth = pow(2.0, d / (A_logDepthBufFC() * 0.5));
  float z_view = v_depth - 1.0;
  
  float z = texture2D(depthBuffer, uv).x;
  float depthZ = (exp2(z / (A_logDepthBufFC() * 0.5)) - 1.0);
  vec3 posWS = _ScreenToWorld(vec3(uv, z));
  
  vec3 rayOrigin = uCameraPosition;
  vec3 rayDirection = normalize(posWS - uCameraPosition);

  float sceneDepth = length(posWS.xyz - uCameraPosition);

  Ray ray = Ray(rayOrigin, rayDirection);

  vec4 color = badRayMarch(ray, vec3(0.0, -15000.0/2.0, 0.0), sceneDepth, inputColor.xyz);
  // vec4 color = rayMarch(ray, vec3(0.0, -15000.0/2.0, 0.0), sceneDepth, inputColor.xyz);

  outputColor = vec4(color.xyz, 1.0);
}