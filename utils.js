/*
  This file contains all the non-AI helper functions which
  are really not that important.
*/

/*
*   Construct an array of paths to frame images with the following naming
*   convention: `image-xxxx.png`
*/  
function getFramePaths(basePath, numFrames = 10, extension = 'png') {
   // construct paths to all frames
  const frameNames = new Array(numFrames).fill(0).map((_, i) => {
    const numberStr = (i + 1).toString();
    return numberStr.padStart(4, '0');;
  });

  const framePaths = frameNames.map((frame) => {
    return `${basePath}${frame}.${extension}`;
  });

  return framePaths;
}

/*
* Add a div to the dom with a zoom in frame image and orange prediction number
*/
function addThumb(parentEl, path, prediction) {
  const thumb = document.createElement('div');
  thumb.className = 'thumb';

  const image = document.createElement('img');
  image.className = 'image';
  image.src = path;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'imageWrap';
  imageWrap.appendChild(image);
  
  const number = document.createElement('div');
  number.className = 'number';
  number.innerHTML = prediction;

  thumb.appendChild(imageWrap);
  thumb.appendChild(number);

  parentEl.appendChild(thumb);
}

/*
*   Return bitmap data for a particular part of the image
*/
function crop(image, x, y, w, h) {
  var cropped = createImage(w, h);
  cropped.copy(image, x, y, x + w, y + h, 0, 0, x + w, y + h)
  return cropped;
}

const msgEl = document.getElementById('msg');

/*
*   Update visible status image
*/  
function consoleMsg(text) {
  msg.innerHTML = text;
}
