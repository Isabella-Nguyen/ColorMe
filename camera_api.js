let videoOn = false;

let image = null;
let canvas = null;
let photo = null;
let clickButton = null;
let flipButton = null;

let width = 600;
let height = 600;

let constraints = {
  video: {
    width: {
      ideal: 1280,
    },
    height: {
      ideal: 720
    },
    facingMode: "user"
  }
};

function startup() {
  input = document.getElementById('image');
  canvas = document.getElementById('canvas');
  clickButton = document.getElementById('clickButton');
  flipButton = document.getElementById("flipButton");
  description = document.getElementById("description");

  navigator.permissions.query({ name: 'camera' })
    .then((permissionObj) => {
      console.log(permissionObj.state);
    })
    .catch((error) => {
      console.log('Got error :', error);
    });

  cameraSetup();

  clickButton.addEventListener(
    "click",
    (ev) => {
      takepicture();
      ev.preventDefault();
    },
    false
  );

  flipButton.addEventListener(
    "click",
    (ev) => {
      let curMode = constraints.video.facingMode;
      if (curMode == "user") {
        constraints.video.facingMode = "environment";
        
      } else {
        constraints.video.facingMode = "user";
      }
      cameraSetup();
      ev.preventDefault();
    },
    false
  );

  description.addEventListener(
    "click",
    (ev) => {
      var msg = new SpeechSynthesisUtterance();
      msg.text = description.innerHTML;
      window.speechSynthesis.speak(msg);
      window.speechSynthesis.speak("");
      ev.preventDefault();
    }
  );

  clearphoto();
}

function cameraSetup() {
  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      input.srcObject = stream;
      input.play();
    })
    .catch((err) => {
      console.log(err);
    });

  input.addEventListener(
    "canplay",
    (ev) => {
      if (!videoOn) {
        input.setAttribute("width", width);
        input.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);

        videoOn = true;
      }
    },
    false
  );
}

function clearphoto() {
  const context = canvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const data = canvas.toDataURL("image/png");
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

async function takepicture() {

  const context = canvas.getContext("2d");
  if (width && height) {
    context.drawImage(input, 0, 0, width, height);

    const data = canvas.toDataURL("image/png"); //The actual image is here

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDPhakki1OiCDXPAB3ij9ZdD28QGMZhm-k`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "requests": [
          {
            "image": {
              "content": data.substring(22)
            },
            "features": [
              {
                "type": "IMAGE_PROPERTIES",
                "maxResults": 3
              }
            ]
          }
        ]
      }),
    });

    const res = await response.json();
    colors = res.responses[0].imagePropertiesAnnotation.dominantColors.colors[0].color;

    let red = colors.red;
    let green = colors.green;
    let blue = colors.blue;

    console.log(red);
    console.log(green);
    console.log(blue);

    let hex = rgbToHex(red, green, blue);

    async function getColorData(r, g, b) {
      const response = await fetch(`https://www.thecolorapi.com/id?rgb=rgb(${r},${g},${b})`);
      const colorData = await response.json();
      return colorData.name.value;
      ;
    } 

  const rgb = [red, green, blue];

  try {
    const colorName = await getColorData(rgb[0], rgb[1], rgb[2]);
    console.log(`The color name is: ${colorName}`);
    let hex = rgbToHex(red, green, blue);
    console.log(`https://www.thecolorapi.com/id?hex=${hex}&format=svg`);

    var fullMessage = colorName;
    var msg = new SpeechSynthesisUtterance();
    msg.text = fullMessage;
    window.speechSynthesis.speak(msg);
    
  } catch (error) {
    console.error('Error fetching color name:', error);
  }
  } else {
    clearphoto();
  }
}

window.addEventListener("load", startup, false);





