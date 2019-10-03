let trainingImages = [];
let testingImages = [];

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

function preloadImages() {
  consoleMsg('Preloading images');
  const trainingFolderUrl = 'images/data/training';
  const testingFolderUrl = 'images/data/testing';
  
  const trainingFolders = new Array(6).fill(0).map((_, i) => i + 1);
  const testingFolders = [9];
  const imagesNames = new Array(10).fill(0).map((_, i) => `${i}.png`);
  
  trainingFolders.forEach((folderName) => {
    imagesNames.forEach((imageName, i) => {
      const imageUrl = `${trainingFolderUrl}/${folderName}/${imageName}`;
      trainingImages.push({ image: createImg(imageUrl), label: i });
    })
  })

  testingFolders.forEach((folderName) => {
    imagesNames.forEach((imageName, i) => {
      const imageUrl = `${testingFolderUrl}/${folderName}/${imageName}`;
      testingImages.push({ image: createImg(imageUrl), label: i });
    })
  })
}

function trainModel() {
  const promises = [];
  trainingImages.forEach((image) => {
    promises.push(classifier.addImage(image.image, image.label));  
  });

  return Promise.all(promises);
}


async function modelLoaded() {
  classifier = featureExtractor.classification();

  await trainModel();
  
  // Retrain the network
  consoleMsg('training model')
  await classifier.train(function(lossValue) {
    console.log("Loss is", lossValue);
  });

  const predictImagesPaths = getFramePaths('images/data/frames/image-',
    30);
  const prediction = await predictImage(predictImagesPaths[0]);
  
  consoleMsg('predicting')
  predictImagesPaths.forEach(async (path) => {
    const prediction = await predictImage(path);
    addThumb(parentEl, path, prediction);
  });
}

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

function crop(image, x, y, w, h) {
  var cropped = createImage(w, h);
  cropped.copy(image, x, y, x + w, y + h, 0, 0, x + w, y + h)
  return cropped;
}

const FIRST_DIGIT = [929, 37, 8, 10];
const SECOND_DIGIT = [935.5, 37, 8, 10];
const THIRD_DIGIT = [944.5, 37, 8, 10];
const FOURTH_DIGIT = [951, 37, 8, 10];
const FOUR_DIGIT_SIZES = [
  FIRST_DIGIT, SECOND_DIGIT, THIRD_DIGIT, FOURTH_DIGIT,
];

function getHighestPrediction(arr) {
  const maxPrediction = arr.reduce((max, i) => {
    if (i.confidence > max.confidence) {
      return i;
    }
    return max;
  }, { label: -1, confidence: -1 });

  return maxPrediction.label;
}

async function predictDigit(img, size) {
  const cropped = crop(img, ...size);
  await cropped.loadPixels();

  //  convert canvas to image
  const imgNew = new Image();
  imgNew.src = cropped.canvas.toDataURL();

  const classification = await classifier.classify(imgNew);
  return getHighestPrediction(classification);
}

function predictImage(imagePath) {
  return new Promise((resolve, reject) => {
    //  load a an entire image
    loadImage(imagePath, async (img) => {
      const promises = FOUR_DIGIT_SIZES.map((size) => {
        return predictDigit(img, size);
      });

      const results = await Promise.all(promises);
      resolve(results.join(''));
    });
  });
}

let featureExtractor;
let classifier;

const parentEl = document.getElementById('thumbs');
const msgEl = document.getElementById('msg');

function consoleMsg(text) {
  msg.innerHTML = text;
}

const options = {
  numLabels: 10,
}

function setup() {
  preloadImages();
  featureExtractor = ml5.featureExtractor("MobileNet", options, modelLoaded);
  
}
