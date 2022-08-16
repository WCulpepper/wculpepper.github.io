$(document).foundation()

function main(){
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    if(gl == null){
        alert("Unable to initialize webGL app. Your browser might not support it.");
        return;
    }

    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

}

window.onload = main;