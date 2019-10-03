/* number of examples for each digit, you can change this all the way to 8 */
const NUM_TRAIN = 4;

/* position and size of digits in the video frame */
const FIRST_DIGIT = [929, 37, 8, 10];
const SECOND_DIGIT = [935.5, 37, 8, 10];
const THIRD_DIGIT = [944.5, 37, 8, 10];
const FOURTH_DIGIT = [951, 37, 8, 10];
const FOUR_DIGIT_SIZES = [
  FIRST_DIGIT, SECOND_DIGIT, THIRD_DIGIT, FOURTH_DIGIT,
];

let trainingImages = [];
let testingImages = [];

let featureExtractor;
let classifier;

const parentEl = document.getElementById('thumbs');

/*
*   Make sure all the images are loadded and their bitmap data is available
*   for later use
*/
function preloadImages() {
  consoleMsg('Preloading images');
  const trainingFolderUrl = 'images/training';
  const testingFolderUrl = 'images/testing';
  
  const trainingFolders = new Array(NUM_TRAIN).fill(0).map((_, i) => i + 1);
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

/*
* Add image/label pair as new example to the classifer for re-training later
*/  
function trainModel() {
  const promises = [];
  trainingImages.forEach((image) => {
    promises.push(classifier.addImage(image.image, image.label));  
  });

  return Promise.all(promises);
}


/*
*   Create classifier and train it with examples for each digit
*/
async function modelLoaded() {
  classifier = featureExtractor.classification();

  //  add new train image for every image/label pair stored in `trainingImages`
  await trainModel();
  
  // Retrain the network 
  consoleMsg('training model')
  await classifier.train(function(lossValue) {
    console.log("Loss is", lossValue);
  });

  // Get paths of frame images which we want to predict
  const predictImagesPaths = getFramePaths('images/frames/image-',
    30);
  const prediction = await predictImage(predictImagesPaths[0]);
  
  consoleMsg('predicting')
  // For each image, predict the number in the top-right corent
  predictImagesPaths.forEach(async (path) => {
    const prediction = await predictImage(path);
    addThumb(parentEl, path, prediction);
  });
}

/*
*   Predictions are returned as an array with probabilities, so find 
*   the prediction with the highest probability
*/
function getHighestPrediction(arr) {
  const maxPrediction = arr.reduce((max, i) => {
    if (i.confidence > max.confidence) {
      return i;
    }
    return max;
  }, { label: -1, confidence: -1 });

  return maxPrediction.label;
}

/*
*   Predicts a part of the image which is cropped according to size
*   The resulting bitmap data is fed into the classifier
*/
async function predictDigit(img, size) {
  //  get only relevant part of the image with a single digit
  //  size will be one of FIRST_DIGIT, SECOND_DIGIT ...
  const cropped = crop(img, ...size);
  await cropped.loadPixels();

  //  convert canvas to image using Base64 encoding
  const imgNew = new Image();
  imgNew.src = cropped.canvas.toDataURL();

  //  the actual classification using the trained classfier
  const classification = await classifier.classify(imgNew);
  return getHighestPrediction(classification);
}

/*
*   Loads a video frame and predicts four digits within it. 
*/
function predictImage(imagePath) {
  return new Promise((resolve, reject) => {
    //  load a an entire image and loop over 4 different positions/sizes
    loadImage(imagePath, async (img) => {
      const promises = FOUR_DIGIT_SIZES.map((size) => {
        return predictDigit(img, size);
      });

      const results = await Promise.all(promises);
      resolve(results.join(''));
    });
  });
}

/*
*   Setup function is automatically called by ml5.js
*/
function setup() {
  preloadImages();
  featureExtractor = ml5.featureExtractor("MobileNet", { numLabels: 10 }, modelLoaded);
}
