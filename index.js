var ended=0;
var allow=0;
var bw=0;
var start_game=0;
var cameraAngleRadians=0;
var level = 1;
var max_level = 8;
var speed_level = [0, 3, 5,7,9,13,18,25];
var speed_level_horizontal = [0, 2, 4,6,8,10,12,15,20];
var pause = 1;
var frames = 0;
var level_change_number = 1000;
var score = 0;
var current_rotation = 0;
var angle=Math.PI/8;
var shining=10.0;
var ambix=1.0;
var ambiy=0.0;
var ambiz=0.0;
var out=0;
var textured=0;
var posY=0.5;
var speedy=-1;
var accy=0;
var posYo=-1.5;

const vsSource = `
    precision mediump float;
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 normal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;
    varying vec3 vNormal;
    varying vec3 vView;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vView=vec3(uProjectionMatrix*uModelViewMatrix*aVertexPosition);\n\
      vNormal=vec3(uModelViewMatrix*vec4(normal, 0.0));
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  var fsSource = `
    precision mediump float;
    varying lowp vec4 vColor;
    varying vec3 vNormal;
    varying vec3 vView;


  const vec3 source_ambient_color=vec3(0.1,0.1,0.1);
  const vec3 source_diffuse_color=vec3(1.,2.,4.);
  const vec3 source_specular_color=vec3(1.,1.,1.);
  const vec3 source_direction=vec3(0.,0.,1.);

  const vec3 mat_ambient_color=vec3(0.3,0.3,0.3);
  const vec3 mat_diffuse_color=vec3(1.,1.,1.);
  const vec3 mat_specular_color=vec3(1.,1.,1.);
  const float mat_shininess=10.;

    void main(void) {
      gl_FragColor = vColor;
      vec3 I_ambient=source_ambient_color*mat_ambient_color;\n\
      vec3 I_diffuse=source_diffuse_color*mat_diffuse_color*max(0., dot(vNormal, source_direction));\n\
      vec3 V=normalize(vView);
      vec3 R=reflect(source_direction, vNormal);
      vec3 I_specular=source_specular_color*mat_specular_color*pow(max(dot(R,V),0.), mat_shininess);\n\
      vec3 I=I_ambient+I_diffuse+I_specular;
      gl_FragColor = vec4(I*vec3(vColor), 1.);
    }
  `;

const vstSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

const fstSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

var available_colors=[
  [0.1,1.0,0.1,1.0],//red
  [0.597,0.199,1.0,1.0],//purple
  [0.1,0.54,1.0,1.0],//blue
  [1.0,1.0,0.0,1.0],//yellow
  [0.2,0.8,0.2,1.0],//green
  [1.0,0.2,0.6,1.0],//pink
  [1.0,0.5,0.0,1.0],//golden
  [0.756,1.0,0.04,1.0],//neon green
];
var obstacle_colors=[
[1.0,0.0,0.0,1.0],
[0.0,1.0,0.0,1.0],
[0.0,0.0,1.0,1.0],
];
var blackwhite1=[
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
];
var blackwhite2=[
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
  [0.0,  0.0,  0.0,  1.0],
  [1.0,  1.0,  1.0,  1.0],
];

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var tunnel_tile = function(colors_arr){
    return {
    'position'  : [0, 0, 0],
    'positions' : [
      // Right face
      1.0, Math.tan(angle), 1.0,
      1.0, Math.tan(angle), -1.0,
      1.0, Math.tan(-angle), -1.0,
      1.0, Math.tan(-angle), 1.0,

      // Top Right face
      Math.tan(angle), 1.0, 1.0,
      Math.tan(angle), 1.0, -1.0,
      1.0, Math.tan(angle), -1.0,
      1.0, Math.tan(angle), 1.0,

      // Top faces
      -Math.tan(angle), 1.0, 1.0,
      -Math.tan(angle), 1.0, -1.0,
      Math.tan(angle), 1.0, -1.0,
      Math.tan(angle), 1.0, 1.0,

      // Top Left face
      -1.0, Math.tan(angle), 1.0,
      -1.0, Math.tan(angle), -1.0,
      -Math.tan(angle), 1.0, -1.0,
      -Math.tan(angle), 1.0, 1.0,

      // Left fact
      -1.0, Math.tan(angle), 1.0,
      -1.0, Math.tan(angle), -1.0,
      -1.0, Math.tan(-angle), -1.0,
      -1.0, Math.tan(-angle), 1.0,

      // Bottom Left face
      -Math.tan(angle), -1.0, 1.0,
      -Math.tan(angle), -1.0, -1.0,
      -1.0, -Math.tan(angle), -1.0,
      -1.0, -Math.tan(angle), 1.0,

      // Bottom faces
      Math.tan(angle), -1.0, 1.0,
      Math.tan(angle), -1.0, -1.0,
      -Math.tan(angle), -1.0, -1.0,
      -Math.tan(angle), -1.0, 1.0,

      // Bottom Right face
      1.0, -Math.tan(angle), 1.0,
      1.0, -Math.tan(angle), -1.0,
      Math.tan(angle), -1.0, -1.0,
      Math.tan(angle), -1.0, 1.0,
    ],

    'normals' : [
      // Right face
      Math.cos(Math.PI + 0*Math.PI/4), Math.sin(Math.PI + 0*Math.PI/4), 0,
      Math.cos(Math.PI + 0*Math.PI/4), Math.sin(Math.PI + 0*Math.PI/4), 0,
      Math.cos(Math.PI + 0*Math.PI/4), Math.sin(Math.PI + 0*Math.PI/4), 0,
      Math.cos(Math.PI + 0*Math.PI/4), Math.sin(Math.PI + 0*Math.PI/4), 0,

      // Top Right face
      Math.cos(Math.PI + 1*Math.PI/4), Math.sin(Math.PI + 1*Math.PI/4), 0,
      Math.cos(Math.PI + 1*Math.PI/4), Math.sin(Math.PI + 1*Math.PI/4), 0,
      Math.cos(Math.PI + 1*Math.PI/4), Math.sin(Math.PI + 1*Math.PI/4), 0,
      Math.cos(Math.PI + 1*Math.PI/4), Math.sin(Math.PI + 1*Math.PI/4), 0,

      // Top faces
      Math.cos(Math.PI + 2*Math.PI/4), Math.sin(Math.PI + 2*Math.PI/4), 0,
      Math.cos(Math.PI + 2*Math.PI/4), Math.sin(Math.PI + 2*Math.PI/4), 0,
      Math.cos(Math.PI + 2*Math.PI/4), Math.sin(Math.PI + 2*Math.PI/4), 0,
      Math.cos(Math.PI + 2*Math.PI/4), Math.sin(Math.PI + 2*Math.PI/4), 0,

      // Top Left face
      Math.cos(Math.PI + 3*Math.PI/4), Math.sin(Math.PI + 3*Math.PI/4), 0,
      Math.cos(Math.PI + 3*Math.PI/4), Math.sin(Math.PI + 3*Math.PI/4), 0,
      Math.cos(Math.PI + 3*Math.PI/4), Math.sin(Math.PI + 3*Math.PI/4), 0,
      Math.cos(Math.PI + 3*Math.PI/4), Math.sin(Math.PI + 3*Math.PI/4), 0,

      // Left fact
      Math.cos(Math.PI + 4*Math.PI/4), Math.sin(Math.PI + 4*Math.PI/4), 0,
      Math.cos(Math.PI + 4*Math.PI/4), Math.sin(Math.PI + 4*Math.PI/4), 0,
      Math.cos(Math.PI + 4*Math.PI/4), Math.sin(Math.PI + 4*Math.PI/4), 0,
      Math.cos(Math.PI + 4*Math.PI/4), Math.sin(Math.PI + 4*Math.PI/4), 0,

      // Bottom Left face
      Math.cos(Math.PI + 5*Math.PI/4), Math.sin(Math.PI + 5*Math.PI/4), 0,
      Math.cos(Math.PI + 5*Math.PI/4), Math.sin(Math.PI + 5*Math.PI/4), 0,
      Math.cos(Math.PI + 5*Math.PI/4), Math.sin(Math.PI + 5*Math.PI/4), 0,
      Math.cos(Math.PI + 5*Math.PI/4), Math.sin(Math.PI + 5*Math.PI/4), 0,

      // Bottom faces
      Math.cos(Math.PI + 6*Math.PI/4), Math.sin(Math.PI + 6*Math.PI/4), 0,
      Math.cos(Math.PI + 6*Math.PI/4), Math.sin(Math.PI + 6*Math.PI/4), 0,
      Math.cos(Math.PI + 6*Math.PI/4), Math.sin(Math.PI + 6*Math.PI/4), 0,
      Math.cos(Math.PI + 6*Math.PI/4), Math.sin(Math.PI + 6*Math.PI/4), 0,

      // Bottom Right face
      Math.cos(Math.PI + 7*Math.PI/4), Math.sin(Math.PI + 7*Math.PI/4), 0,
      Math.cos(Math.PI + 7*Math.PI/4), Math.sin(Math.PI + 7*Math.PI/4), 0,
      Math.cos(Math.PI + 7*Math.PI/4), Math.sin(Math.PI + 7*Math.PI/4), 0,
      Math.cos(Math.PI + 7*Math.PI/4), Math.sin(Math.PI + 7*Math.PI/4), 0,
    ],
    'texture':[
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    ],
    'faceColors' : colors_arr,

    'indices' : [
      0,  1,  2,      0,  2,  3,    // right
      4,  5,  6,      4,  6,  7,    // right top
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // top left
      16, 17, 18,     16, 18, 19,   // left
      20, 21, 22,     20, 22, 23,   // bottom left
      24, 25, 26,     24, 26, 27,   // bottom
      28, 29, 30,     28, 30, 31,   // bottom right
    ],

    'vertex_num' : 48,
    'rotationX' : 0,
    'rotationY' : 0,
    'rotationZ' : 0,
    'speed'     : 7+speed_level_horizontal[level-1],
    'rotation'  : 0.05,}
}

function bar(colors_arr){
    return {
    'position'  : [0, 0, -18],
    'positions' : [
      // Right face
      Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,

      // Left face
      -Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,

      // Top faces
      -Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,

      // Bottom faces
      -Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,

      // Front face
      -Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, -1.5, Math.tan(Math.PI/8)/50,

      // Back face
      -Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, 1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8)/3, -1.5, -Math.tan(Math.PI/8)/50,
    ],

    'faceColors' : colors_arr,
    'normals' : [
      // Right face
      1.0, 0, 0,
      1.0, 0, 0,
      1.0, 0, 0,
      1.0, 0, 0,

      // Left face
      -1.0, 0, 0,
      -1.0, 0, 0,
      -1.0, 0, 0,
      -1.0, 0, 0,

      // Top faces
      0, 1.0, 0,
      0, 1.0, 0,
      0, 1.0, 0,
      0, 1.0, 0,

      // Bottom faces
      0, -1.0, 0,
      0, -1.0, 0,
      0, -1.0, 0,
      0, -1.0, 0,

      // Front face
      0, 0, 1.0,
      0, 0, 1.0,
      0, 0, 1.0,
      0, 0, 1.0,

      // Back face
      0, 0, -1.0,
      0, 0, -1.0,
      0, 0, -1.0,
      0, 0, -1.0,
    ],
    'texture':[
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    ],

    'indices' : [
      0,  1,  2,      0,  2,  3,    // right
      4,  5,  6,      4,  6,  7,    // left
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // front
      20, 21, 22,     20, 22, 23,   // back
    ],

    'vertex_num' : 36,
    'rotationX' : 0,
    'rotationY' : 0,
    'rotationZ' : 0,
    'speed'     : 7+speed_level_horizontal[level-1],
    'rotation'  : (Math.floor(Math.random()*2)*2 - 1) * (Math.PI*2/5) * Math.floor(Math.random() * (speed_level[level-1] + 1)),}
}

function sand_time(colors_arr){
  return {
    'position'  : [0, 0, -18],
    'positions' : [
      // Top triangle
      // Right face
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,

      // Left face
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,

      // Top faces
      -Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,

      // Front face
      -Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, Math.tan(Math.PI/8)/50,

      // Back face
      -Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), 1.5, -Math.tan(Math.PI/8)/50,

      // Bottom triangle
      // Right face
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,

      // Left face
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,

      // Top faces
      -Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
      -Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,

      // Front face
      -Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,
      0.0, 0.0, Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, Math.tan(Math.PI/8)/50,

      // Back face
      -Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
      0.0, 0.0, -Math.tan(Math.PI/8)/50,
      Math.tan(Math.PI/8), -1.5, -Math.tan(Math.PI/8)/50,
    ],

    'faceColors' : colors_arr,

    'normals' : [
      // Top triangle
      // Right face
      Math.cos(-Math.PI/8), Math.cos(-Math.PI/8), 0,
      Math.cos(-Math.PI/8), Math.cos(-Math.PI/8), 0,
      Math.cos(-Math.PI/8), Math.cos(-Math.PI/8), 0,
      Math.cos(-Math.PI/8), Math.cos(-Math.PI/8), 0,

      // Left face
      Math.cos(-7*Math.PI/8), Math.cos(-7*Math.PI/8), 0,
      Math.cos(-7*Math.PI/8), Math.cos(-7*Math.PI/8), 0,
      Math.cos(-7*Math.PI/8), Math.cos(-7*Math.PI/8), 0,
      Math.cos(-7*Math.PI/8), Math.cos(-7*Math.PI/8), 0,

      // Top faces
      Math.cos(4*Math.PI/8), Math.cos(4*Math.PI/8), 0,
      Math.cos(4*Math.PI/8), Math.cos(4*Math.PI/8), 0,
      Math.cos(4*Math.PI/8), Math.cos(4*Math.PI/8), 0,
      Math.cos(4*Math.PI/8), Math.cos(4*Math.PI/8), 0,

      // Front face
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      // Back face
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      // Bottom triangle
      // Right face
      Math.cos(Math.PI/8), Math.cos(Math.PI/8), 0,
      Math.cos(Math.PI/8), Math.cos(Math.PI/8), 0,
      Math.cos(Math.PI/8), Math.cos(Math.PI/8), 0,
      Math.cos(Math.PI/8), Math.cos(Math.PI/8), 0,

      // Left face
      Math.cos(7*Math.PI/8), Math.cos(7*Math.PI/8), 0,
      Math.cos(7*Math.PI/8), Math.cos(7*Math.PI/8), 0,
      Math.cos(7*Math.PI/8), Math.cos(7*Math.PI/8), 0,
      Math.cos(7*Math.PI/8), Math.cos(7*Math.PI/8), 0,

      // Bottom faces
      Math.cos(-4*Math.PI/8), Math.cos(-4*Math.PI/8), 0,
      Math.cos(-4*Math.PI/8), Math.cos(-4*Math.PI/8), 0,
      Math.cos(-4*Math.PI/8), Math.cos(-4*Math.PI/8), 0,
      Math.cos(-4*Math.PI/8), Math.cos(-4*Math.PI/8), 0,

      // Front face
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      // Back face
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
    ],
    'texture':[
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,


    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,


    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    ],

    'indices' : [
      // Top triangle
      0,  1,  2,      0,  2,  3,    // right
      4,  5,  6,      4,  6,  7,    // left
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // front
      16, 17, 18,     16, 18, 19,   // back
      // Bottom triangle
      20, 21, 22,     20, 22, 23,   // right
      24, 25, 26,     24, 26, 27,    // left
      28, 29, 30,     28, 30, 31,   // top
      32, 33, 34,     32, 34, 35,   // front
      36, 37, 38,     36, 38, 39,   // back
    ],

    'vertex_num' : 60,
    'rotationX' : 0,
    'rotationY' : 0,
    'rotationZ' : 0,
    'speed'     : 7+speed_level_horizontal[level-1],
    'rotation'  : (Math.floor(Math.random()*2)*2 - 1) * (Math.PI*2/5) * Math.floor(Math.random() * (speed_level[level-1] + 1)),}
}

var count_shapes = 10;
var count_obstacles = 2;
var count_type_obstacles = 2;

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program


  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const texture = loadTexture(gl, 'cubetexture.png');

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  var programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      normal: gl.getAttribLocation(shaderProgram, 'normal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      source_ambient_color :gl.getUniformLocation(shaderProgram,'source_ambient_color'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  shapes = [];
  buffer_shapes = [];
  for (var i = 0; i < count_shapes; i++){
      shapes.push(tunnel_tile(shuffle(available_colors),1));
      shapes[i].position[2] = -2*i;
      buffer_shapes.push(initBuffers(gl, shapes[i]));
  }

  obstacles = [];
  buffer_obstacles = [];
  for (var i = 0; i < count_obstacles; i++){
      var type = Math.floor(Math.random()*count_type_obstacles);
      if(type%2)
      {
        // var bar_color=shuffle(obstacle_colors)[0];
        var bar_color=[Math.random(),Math.random(),Math.random(),1.0];
        var bar_color_arr=[];
        for(var j=0;j<6;j++)
          bar_color_arr.push(bar_color);
        obstacles.push(bar(bar_color_arr));
      }
      else
      {
        // var bar_color=(shuffle(obstacle_colors))[0];
        var bar_color=[Math.random(),Math.random(),Math.random(),1.0];
        var bar_color_arr=[];
        for(var j=0;j<10;j++)
          bar_color_arr.push(bar_color);
        obstacles.push(sand_time(bar_color_arr));
      }
      obstacles[i].position[2] -= 10*(i-1);
      obstacles[i].rotationZ = i*Math.PI/count_obstacles;
      buffer_obstacles.push(initBuffers(gl, obstacles[i]));
  }

  var then = 0;

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;


  // Draw the scene repeatedly
  function render(now) {
    document.getElementById('scorev').innerHTML="Score:"+frames.toString()+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Level:"+level.toString();
    // if(textured)
    // {
    //   change_shader(gl);
    // }
    if(speedy>-1)
    {
      if(!out)
      {
        if(posY>=-0.9)
        {
        posY+=speedy;
        speedy+=accy;
        if(posY>=0.5)
        {
          speedy=0;
          accy=0;
        }
        }
        else
        {
        posY+=0.01;        
        }
      }
      if(out)
      {
        if(posYo>=-3.0)
        {
        posYo+=speedy;
        speedy+=accy;
        if(posYo>=(-1.5))
        {
          speedy=0;
          accy=0;
        }
        }
        else
        {
        posYo+=0.01;        
        }
      }
    }
    // requestAnimationFrame(render);
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    if(start_game==1 && pause)
    {
      frames++;
      if(frames % level_change_number == 0){
          level = Math.min(level + 1, max_level);
          shapes[0].speed=7+speed_level_horizontal[level-1];
          level_change_number*=2;
      }
    }
    if(level>=6)
      out=1;
    // if(!pause)
    //   change_shader(gl,shining,ambix,ambiy,ambiz);
    // // if(level==1)
    //   bw+=2;
    // else
    //   bw=0;
    if((Math.floor(Math.random()*15)%15)==2 && bw==0 && frames%100==0)
       bw=8;
    // console.log("deltaTime");
    // console.log(deltaTime);
    then = now;
    refresh_tunnel(gl, shapes, buffer_shapes);
    refresh_obstacles(gl, obstacles, buffer_obstacles);
    handleKeys(shapes, obstacles);
    const projectionMatrix = clearScene(gl);
    for (var i = 0; i < count_shapes; i++){
        shapes[i].position[2] += pause * shapes[i].speed * deltaTime; 
        if(!textured)
          drawScene(gl, projectionMatrix, shapes[i], programInfo, buffer_shapes[i], deltaTime);
        else
          drawSceneTextured(gl, projectionMatrix, shapes[i], programInfo, buffer_shapes[i], deltaTime,texture);
    }
    if(start_game && !ended)
    {
      for (var i = 0; i < count_obstacles; i++){
          obstacles[i].position[2] += pause * obstacles[i].speed * deltaTime;
          obstacles[i].rotationZ += obstacles[i].rotation * deltaTime;
        if(!textured)

          drawScene(gl, projectionMatrix, obstacles[i], programInfo, buffer_obstacles[i], deltaTime);
        else
          drawSceneTextured(gl, projectionMatrix, shapes[i], programInfo, buffer_shapes[i], deltaTime,texture);
      }
    }
    if(!detect_collision(shapes, obstacles)){
        requestAnimationFrame(render);
    }
    else if(start_game==1 || allow==1)
    {
      ended=1;
      allow=0;
      frames=0;
      level=1;
      // start_game=0;
      document.getElementById('playag').style.display="block";
      requestAnimationFrame(render);
    }
  }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//


function detect_collision(shapes, obstacles){
    for (var i = 0; i < count_obstacles; i++){
        if(obstacles[i].position[2] > -0.5){
            var theta = obstacles[i].rotationZ - Math.floor(obstacles[i].rotationZ / Math.PI) * Math.PI;
            if((theta+Math.PI / 8)>=Math.PI)
              theta-=Math.PI;
            if(Math.abs(theta) <= Math.PI / 8 && out && posYo>=-2.0){
              console.log(posYo);
                return true;
            }
            if(Math.abs(theta) <= Math.PI / 8 && !out){
                return true;
            }
        }
    }
    return false;
}

// Dictionary that keeps the track of the status of keys
var statusKeys = {};

function handleKeyDown(event){
    statusKeys[event.keyCode] = true;
}

function handleKeyUp(event){
    if(event.keyCode == 80 && start_game){
        // P Key
        pause = 1 - pause;
    }
    else if(event.keyCode == 74){
        // J Key
        for(var i = 0; i < count_shapes; i++){
            shapes[i].rotationZ += Math.PI;
        }
        for(var i = 0; i < count_obstacles; i++){
            obstacles[i].rotationZ += Math.PI;
        }
    }
    else{
        statusKeys[event.keyCode] = false;
    }
}

function handleKeys(shapes, obstacles){
        if(statusKeys[38]){
          cameraAngleRadians-=0.01;
            // Up Key
        }
        if(statusKeys[40]){
          cameraAngleRadians+=0.01;
            // Down Key
        }
        if(statusKeys[79])
        {
          out=1;
        }
        if(statusKeys[73])
        {
          out=0;
        }
        if(statusKeys[32])
        {
          speedy=-0.05;
          accy=0.005;
        }
/*        if(statusKeys[84])
        {
          textured=1;
        }
*/
    if(pause){
        if(statusKeys[37]){
            if(!out)
            {
            // Left Key
              for(var i = 0; i < count_shapes; i++){
                  shapes[i].rotationZ += shapes[i].rotation;
              }
              for(var i = 0; i < count_obstacles; i++){
                  obstacles[i].rotationZ += shapes[0].rotation;
              }
            }
            else
            {
              for(var i = 0; i < count_shapes; i++){
                  shapes[i].rotationZ -= shapes[i].rotation;
              }
              for(var i = 0; i < count_obstacles; i++){
                  obstacles[i].rotationZ -= shapes[0].rotation;
              }
            }
        }
        if(statusKeys[39]){
            // Right Key
            if(!out)
            {
            // Left Key
              for(var i = 0; i < count_shapes; i++){
                  shapes[i].rotationZ -= shapes[i].rotation;
              }
              for(var i = 0; i < count_obstacles; i++){
                  obstacles[i].rotationZ -= shapes[0].rotation;
              }
            }
            else
            {
              for(var i = 0; i < count_shapes; i++){
                  shapes[i].rotationZ += shapes[i].rotation;
              }
              for(var i = 0; i < count_obstacles; i++){
                  obstacles[i].rotationZ += shapes[0].rotation;
              }
            }
        }
        // if(statusKeys[32]){
        //     // Space Key
        //     for(var i = 0; i < count_shapes; i++){
        //         shapes[i].rotationZ += Math.PI;
        //     }
        //     for(var i = 0; i < count_obstacles; i++){
        //         obstacles[i].rotationZ += Math.PI;
        //     }
        // }
        if(statusKeys[87]){
            // W Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].rotationX -= shapes[i].rotation;
                shapes[i].position[2] -= 0.1;
            }
        }
        if(statusKeys[83]){
            // S Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].rotationX += shapes[i].rotation;
                shapes[i].position[2] += 0.1;
            }
        }
    }
}

function initBuffers(gl, shape) {

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  const textures=shape.texture;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures),gl.STATIC_DRAW);

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  const positions = shape.positions;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  const normals = shape.normals;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  const faceColors = shape.faceColors;

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // Repeat each color numComponentsColor times for the numComponentsColor vertices of the face
    for (var i = 0; i < 4; i++) {
        colors = colors.concat(c);
    }
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = shape.indices;

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    normal: normalBuffer,
    texturedCoord: textureCoordBuffer,
  };
}

function refresh_tunnel(gl, shapes, buffers){

    if(shapes.length && shapes[0].position[2] > 1){
        shapes.shift();
        buffers.shift();
        count_shapes--;
        if(bw)
        {
          if(bw%2==0)
            shapes.push(tunnel_tile(blackwhite1,0));
          else
            shapes.push(tunnel_tile(blackwhite2,1));
          bw--;
        }
        else
          shapes.push(tunnel_tile(shuffle(available_colors),0));
        count_shapes++;
        shapes[count_shapes - 1].position[2] = shapes[count_shapes - 2].position[2] - 2;
        shapes[count_shapes - 1].rotationX = shapes[count_shapes - 2].rotationX;
        shapes[count_shapes - 1].rotationY = shapes[count_shapes - 2].rotationY;
        shapes[count_shapes - 1].rotationZ = shapes[count_shapes - 2].rotationZ;
        buffers.push(initBuffers(gl, shapes[count_shapes - 1]));
    }
}

function refresh_obstacles(gl, obstacles, buffer_obstacles){
    if((obstacles.length > 0 && obstacles[0].position[2] > 1)){
        obstacles.shift();
        buffer_obstacles.shift();
        count_obstacles--;
        var type = Math.floor(Math.random()*(count_type_obstacles+1));
        // type = count_type_obstacles;
        // console.log("type");
        // console.log(type);
      if(type%2)
      {
        // var bar_color=shuffle(obstacle_colors)[0];
        var bar_color=[Math.random(),Math.random(),Math.random(),1.0];
        var bar_color_arr=[];
        for(var j=0;j<6;j++)
          bar_color_arr.push(bar_color);
        obstacles.push(bar(bar_color_arr));
        count_obstacles++;
        obstacles[count_obstacles - 1].rotationZ = Math.random()*Math.PI;
        buffer_obstacles.push(initBuffers(gl, obstacles[count_obstacles - 1]));
      }
      else
      {
        // var bar_color=(shuffle(obstacle_colors))[0];
        var bar_color=[Math.random(),Math.random(),Math.random(),1.0];
        var bar_color_arr=[];
        for(var j=0;j<10;j++)
          bar_color_arr.push(bar_color);
        obstacles.push(sand_time(bar_color_arr));
        count_obstacles++;
        obstacles[count_obstacles - 1].rotationZ = Math.random()*Math.PI;
        buffer_obstacles.push(initBuffers(gl, obstacles[count_obstacles - 1]));
      }
    }
    else if(obstacles.length == 0){
        var type = Math.floor(Math.random()*(count_type_obstacles+1));
        // type = count_type_obstacles;
        // console.log("type");
        // console.log(type);
        switch (type) {
            case 0:{
                obstacles.push(bar());
                count_obstacles++;
                obstacles[count_obstacles - 1].rotationZ = Math.random()*Math.PI;
                buffer_obstacles.push(initBuffers(gl, obstacles[count_obstacles - 1]));
                break;
            }
            case 1:{
                obstacles.push(sand_time());
                count_obstacles++;
                obstacles[count_obstacles - 1].rotationZ = Math.random()*Math.PI;
                buffer_obstacles.push(initBuffers(gl, obstacles[count_obstacles - 1]));
                break;
            }
            default:
                break;
        }
    }
}

function clearScene(gl){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/1.0
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    var numFs = 5;
    var radius = 1;
     
    // Compute a matrix for the camera
    var cameraMatrix = mat4.create();
    if(!out)
    {
    mat4.rotateX(cameraMatrix,cameraMatrix,cameraAngleRadians);
    }
    else
    {
    mat4.rotate(cameraMatrix,cameraMatrix,cameraAngleRadians,[0,posYo,0]);      
    }
    if(!out)
      mat4.translate(cameraMatrix,cameraMatrix,[0, posY, radius * 1.5]);
    else
      mat4.translate(cameraMatrix,cameraMatrix,[0, posYo, radius * 1.5]);
    var viewMatrix = mat4.create();
    mat4.invert(viewMatrix,cameraMatrix);

    if(!out)
    {
    var fPosition = [0, posY, 0];
    var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
    ];
  }
  else{
    
    var fPosition = [0, posYo, 0];
    var cameraPosition = [
    cameraMatrix[12],
    -1.5,
    cameraMatrix[14],
    ];
    }
    
    var up = [0, 1, 0];
    mat4.lookAt(cameraMatrix,cameraPosition, fPosition, up);
    mat4.invert(viewMatrix,cameraMatrix);
    var viewprojectionMatrix = mat4.create();
    mat4.multiply(viewprojectionMatrix,projectionMatrix, viewMatrix);
    return viewprojectionMatrix;
}

//
// Draw the scene.
//
function drawScene(gl, projectionMatrix, shape, programInfo, buffers, deltaTime) {
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 shape.position);  // amount to translate
  mat4.rotateX(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationX,     // amount to rotate in radians
              );       // axis to rotate around (X)
  mat4.rotateY(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationY,// amount to rotate in radians
              );       // axis to rotate around (Y)
  mat4.rotateZ(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationZ,// amount to rotate in radians
              );       // axis to rotate around (Z)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // {
  //   const numComponents = 3;
  //   const type = gl.FLOAT;
  //   const normalize = false;
  //   const stride = 0;
  //   const offset = 0;
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  //   gl.vertexAttribPointer(
  //       programInfo.attribLocations.vertexNormal,
  //       numComponents,
  //       type,
  //       normalize,
  //       stride,
  //       offset);
  //   gl.enableVertexAttribArray(
  //       programInfo.attribLocations.vertexNormal);
  // }



  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
gl.uniform3f(
      programInfo.uniformLocations.source_ambient_color,
      ambix,
      ambiy,
      ambiz);
  
  {
    const vertex_num = shape.vertex_num;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertex_num, type, offset);
  }

  // Update the rotation for the next draw
  // cubeRotation += deltaTime;
}


function drawSceneTextured(gl, projectionMatrix, shape, programInfo, buffers, deltaTime,texture) {
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 shape.position);  // amount to translate
  mat4.rotateX(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationX,     // amount to rotate in radians
              );       // axis to rotate around (X)
  mat4.rotateY(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationY,// amount to rotate in radians
              );       // axis to rotate around (Y)
  mat4.rotateZ(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              shape.rotationZ,// amount to rotate in radians
              );       // axis to rotate around (Z)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
{
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  {
    const vertexCount = shape.vertex_num;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

}
//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
function startg()
{
  start_game=1;
  document.getElementById('text').style.display="none";
  frames=0;
}
function pa()
{
  shapes[0].speed=7;
  allow=1;
  start_game=1;
 document.getElementById('playag').style.display="none";
  frames=0;
  level=1;
  ended=0;
}
function custom_frag_shader(shininess,ambientx,ambienty,ambientz)
{
  var ambient_str=toString(ambientx)+','+toString(ambienty)+','+toString(ambientz);
  console.log(shininess,ambientx,ambienty,ambientz);
  console.log(ambient_str);
 return   `
    precision mediump float;
    varying lowp vec4 vColor;
    varying vec3 vNormal;
    varying vec3 vView;


  const vec3 source_ambient_color=vec3(0.,0.,0.);
  const vec3 source_diffuse_color=vec3(1.,2.,4.);
  const vec3 source_specular_color=vec3(1.,1.,1.);
  const vec3 source_direction=vec3(0.,0.,1.);

  const vec3 mat_ambient_color=vec3(`+ambient_str+`);
  const vec3 mat_diffuse_color=vec3(1.,1.,1.);
  const vec3 mat_specular_color=vec3(1.,1.,1.);
  const float mat_shininess=`+toString(shininess)+`;

    void main(void) {
      gl_FragColor = vColor;
      vec3 I_ambient=source_ambient_color*mat_ambient_color;\n\
      vec3 I_diffuse=source_diffuse_color*mat_diffuse_color*max(0., dot(vNormal, source_direction));\n\
      vec3 V=normalize(vView);
      vec3 R=reflect(source_direction, vNormal);
      vec3 I_specular=source_specular_color*mat_specular_color*pow(max(dot(R,V),0.), mat_shininess);\n\
      vec3 I=I_ambient+I_diffuse+I_specular;
      gl_FragColor = vec4(I*vec3(vColor), 1.);
    }
  `;
 
}
function change_shader(gl)
{
      // shaderProgram = initShaderProgram(gl,vsSource,custom_frag_shader(shine,ambx,amby,ambz));
      shaderProgram = initShaderProgram(gl,vstSource,fstSource);

    programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };
}
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
