import { EdgeImpulseClassifier } from "./edge-impulse/eiclassifier.js";

export const getImageHelper = (width, height) => {
    const canvas = document.body.appendChild(document.createElement("canvas"));
    canvas.hidden = true;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
  
    return {
      /**
       * Creates rectangular boxes around each detection in the video frame
       * @param detections A list of detections
       * @param color Color of the box
       * @param thickness Thickness of the box
       * @returns The ImageData object with all of the detections boxes
       */
      createRects(detections, color: string, thickness: number) {
        context.save();
        context.clearRect(0, 0, width, height);
        context.fillStyle = color
        for (let detection of detections) {
          const x = detection.boundingBox.originX
          const y = detection.boundingBox.originY
          const width = detection.boundingBox.width
          const height = detection.boundingBox.height
          context.fillRect(x, y, width, height);
          context.clearRect(x + thickness, y + thickness, width - 2 * thickness, height - 2 * thickness);
          const text = detection.categories[0].categoryName + " - with " +
            Math.round(parseFloat(detection.categories[0].score) * 100) + "% confidence."
          context.fillText(text, x, y - 5)
        }
        context.restore();
        return context.getImageData(0, 0, width, height);
      },
    }
  }
  
export const initializeObjectDetector = async () => {
  const classifier = new EdgeImpulseClassifier();
  await classifier.init();
  return classifier;
};

/**
 * Initializes the Edge Impulse standalone WASM model
 * @returns Initialized Edge Impulse model
 */
// export const initializeEdgeImpulseModel = async () => {
//     const wasmURL = "edge-impulse-standalone.js";
  
//     // Load the WASM module
//     const response = await fetch(wasmURL);
//     const wasmBuffer = await response.arrayBuffer();
//     const wasmModule = await WebAssembly.instantiate(wasmBuffer);
  
//     // Access the module's exports
//     const { EdgeImpulseModel } = wasmModule.instance.exports;
  
//     // Create Edge Impulse model instance
//     var classifier = new EdgeImpulseClassifier();
//     await classifier.init();

//     let props = classifier.getProperties();

//     scaledSquareDimension = props.input_width;
//     document.getElementById()

//       // Add other methods as per your Edge Impulse API
//     };
  
//     return model;
// }






