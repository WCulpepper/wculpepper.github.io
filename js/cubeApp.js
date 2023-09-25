var rotationAngle = 0.0;
var selectedShader = 'Phong';
function switchPhong(){
    selectedShader = 'Phong';
}
function switchGouraud(){
    selectedShader = 'Gouraud';
}
function switchCel(){
    selectedShader = 'Cel';
}
function main(){
    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl");

    if(gl == null){
        alert("Unable to initialize WebGL app. Your browser might not support it.");
        return;
    }

    const vsSourceGouraud = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;

            varying highp vec3 diffuseColor;

            void main() {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

              highp vec3 lightColor = vec3(1.0,1.0,1.0);

              // using directional lighting in this test.
              highp vec3 direction = normalize(vec3(1.0, 1.0, 1.0));

              highp vec4 tNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

              highp float directionalDiffuse = max(dot(aVertexNormal, direction), 0.0);

              diffuseColor = lightColor*aVertexColor.xyz*directionalDiffuse;
            }
        `;

    const fsSourceGouraud = `
            varying highp vec3 diffuseColor;
            void main() {
              gl_FragColor = vec4(diffuseColor,1.0);
            }
        `;

    const vsSourcePhong = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;

            varying highp vec3 normal;
            varying highp vec3 fragPos;
            varying highp vec3 vertColor;

            void main(){
                gl_Position = gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                fragPos = vec3(uModelViewMatrix*aVertexPosition);
                normal = normalize(vec3(uNormalMatrix*vec4(abs(aVertexNormal), 1.0)));
                vertColor = aVertexColor.xyz;
            }
        `;

    const fsSourcePhong = `
            precision highp float;
            // using point light for Phong shading.
            highp vec3 lightPos = vec3(1.0,10.0,0.0);
            highp vec3 lightColor = vec3(1.0,1.0,1.0);
            highp vec3 cubeDiffColor = vec3(0.5, 0.25, 1.0);
            highp vec3 cubeAmbColor = cubeDiffColor*0.1;
            highp vec3 cubeSpecColor = vec3(1.0,1.0,0.0);
            highp float cubeShininess = 0.5;
            highp vec3 eyePos = vec3(0.0,0.0,0.0);

            varying highp vec3 normal;
            varying highp vec3 fragPos;
            varying highp vec3 vertColor;

            vec3 diffuse(vec3 fragmentPos, vec3 fragmentNorm){
                vec3 lightVector = -normalize(lightPos - fragmentPos);

                vec3 diffColor = lightColor*cubeDiffColor*max(dot(fragmentNorm, lightVector), 0.0);

                return diffColor;
            }

            vec3 specular(vec3 fragmentPos, vec3 fragmentNorm){
                vec3 lightVector = normalize(lightPos - fragmentPos);

                vec3 viewVector = normalize(eyePos - fragmentPos);
                vec3 halfwayVector = normalize(viewVector + lightVector);

                vec3 specColor = lightColor*cubeSpecColor*pow(max(dot(fragmentNorm, halfwayVector), 0.0), 10.0*cubeShininess);

                return specColor;
            }

            void main(){
                vec3 norm = normal;
                vec3 diff = diffuse(fragPos, norm);
                vec3 spec = specular(fragPos, norm);
                vec3 amb = cubeAmbColor;
                gl_FragColor = vec4(diff + spec + amb, 1.0);
            }

        `;

    const fsSourceCel = `
            precision highp float;
            // using point light for Phong shading.
            highp vec3 lightPos = vec3(0.0,5.0,10.0);
            highp vec3 lightColor = vec3(1.0,1.0,1.0);
            highp vec3 cubeDiffColor = vec3(0.5, 0.25, 1.0);
            highp vec3 cubeAmbColor = cubeDiffColor*0.1;
            highp vec3 cubeSpecColor = vec3(1.0,1.0,0.0);
            highp float cubeShininess = 0.5;
            highp vec3 eyePos = vec3(0.0,0.0,0.0);

            varying highp vec3 normal;
            varying highp vec3 fragPos;
            varying highp vec3 vertColor;

            vec3 diff_cel(vec3 fragmentPos, vec3 fragmentNorm){
                vec3 intensityFactor;
                vec3 lightVector = -normalize(lightPos - fragmentPos);

                float intensity = dot(lightVector, fragmentNorm);

                if(intensity > 0.95)
                    intensityFactor = vec3(1.0,1.0,1.0);
                else if(intensity > 0.75)
                    intensityFactor = vec3(0.8,0.8,0.8);
                else if(intensity > 0.50)
                    intensityFactor = vec3(0.6,0.6,0.6);
                else if(intensity > 0.25)
                    intensityFactor = vec3(0.4,0.4,0.4);
                else
                    intensityFactor = vec3(0.2,0.2,0.2);

                vec3 diffColor = intensityFactor*lightColor*cubeDiffColor*max(dot(fragmentNorm, lightVector), 0.0);

                return diffColor;
            }

            void main(){
                vec3 norm = normalize(normal);
                vec3 diff = diff_cel(fragPos, norm);
                //vec3 amb = cubeAmbColor;
                gl_FragColor = vec4(diff, 1.0);
            }`

    const shaderProgramGouraud = initShaderProgram(gl, vsSourceGouraud, fsSourceGouraud);
    const shaderProgramPhong = initShaderProgram(gl, vsSourcePhong,  fsSourcePhong);
    const shaderProgramCel = initShaderProgram(gl, vsSourcePhong, fsSourceCel);

    const programInfoGouraud = {
        program: shaderProgramGouraud,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgramGouraud, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgramGouraud, 'aVertexColor'),
            vertexNormal: gl.getAttribLocation(shaderProgramGouraud, 'aVertexNormal'),
        },

        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgramGouraud, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgramGouraud, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgramGouraud, 'uNormalMatrix')
        },
    };

    const programInfoPhong = {
        program: shaderProgramPhong,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgramPhong, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgramPhong, 'aVertexColor'),
            vertexNormal: gl.getAttribLocation(shaderProgramPhong, 'aVertexNormal'),
        },

        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgramPhong, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgramPhong, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgramPhong, 'uNormalMatrix')
        },
    }

    const programInfoCel = {
        program: shaderProgramCel,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgramCel, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgramCel, 'aVertexColor'),
            vertexNormal: gl.getAttribLocation(shaderProgramCel, 'aVertexNormal'),
        },

        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgramCel, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgramCel, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgramCel, 'uNormalMatrix')
        },
    }

    const buffers = initBuffers(gl);

    const shaderPrograms = {
        gouraud: programInfoGouraud,
        phong: programInfoPhong,
        cel: programInfoCel
    }

    let then = 0;
    function render(now){
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        drawScene(gl, shaderPrograms, buffers, deltaTime);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}
function initBuffers(gl){
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];
    const positionBuffer = gl.createBuffer();
    //const posisionData = new Float32Array(positions);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const faceColors = [
        1.0, 1.0, 1.0, 1.0, // white
        1.0, 1.0, 1.0, 1.0, // white
        1.0, 1.0, 1.0, 1.0, // white
        1.0, 1.0, 1.0, 1.0, // white
        1.0, 0.0, 0.0, 1.0, // red
        1.0, 0.0, 0.0, 1.0, // red
        1.0, 0.0, 0.0, 1.0, // red
        1.0, 0.0, 0.0, 1.0, // red
        0.0, 1.0, 0.0, 1.0, // green
        0.0, 1.0, 0.0, 1.0, // green
        0.0, 1.0, 0.0, 1.0, // green
        0.0, 1.0, 0.0, 1.0, // green
        0.0, 0.0, 1.0, 1.0, // blue
        0.0, 0.0, 1.0, 1.0, // blue
        0.0, 0.0, 1.0, 1.0, // blue
        0.0, 0.0, 1.0, 1.0, // blue
        1.0, 1.0, 0.0, 1.0, // yellow
        1.0, 1.0, 0.0, 1.0, // yellow
        1.0, 1.0, 0.0, 1.0, // yellow
        1.0, 1.0, 0.0, 1.0, // yellow
        1.0, 0.0, 1.0, 1.0, // magenta
        1.0, 0.0, 1.0, 1.0, // magenta
        1.0, 0.0, 1.0, 1.0, // magenta
        1.0, 0.0, 1.0, 1.0, // magenta
    ];

    const colors = [];
    for(const c of faceColors){
        colors.push(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColors), gl.STATIC_DRAW);

    const indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23 // left
    ]
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    const vertexNormals = [
        // front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
    ]

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    return{
        position: positionBuffer,
        color: colorBuffer,
        index_buffer: indexBuffer,
        normals: normalBuffer,
    };
}

function drawScene(gl, shaderPrograms, buffers, deltaTime){
    var programInfo;
    if(selectedShader === 'Gouraud'){
        programInfo = shaderPrograms.gouraud
    }
    else if(selectedShader === 'Phong'){
        programInfo = shaderPrograms.phong
    }
    else if(selectedShader === 'Cel'){
        programInfo = shaderPrograms.cel
    }
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fov = 45 * Math.PI/180;
    const aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, fov, aspect, zNear, zFar);

    const mvMatrix = mat4.create();

    //brings the square to the camera's view
    mat4.translate(mvMatrix, mvMatrix, [-0.0,0.0,-6.0]);

    rotationAngle += deltaTime;
    mat4.rotate(mvMatrix, mvMatrix, rotationAngle, [0,0,1]);
    mat4.rotate(mvMatrix, mvMatrix, rotationAngle*0.7, [0,1,0]);
    mat4.rotate(mvMatrix, mvMatrix, rotationAngle*0.1, [1,0,0]);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    //console.log(normalMatrix);

    // binds vertex positions to the shader attribute
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
            offset
        );

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    // binds the colors to the shader attribute
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
            offset
        );

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
    }

    // binds indices to the shader for color correspondence to vertices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index_buffer)


    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

function initShaderProgram(gl, vsSource, fsSource){
    const vShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}







window.onload = main;