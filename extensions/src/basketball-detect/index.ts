import { ArgumentType, BlockType, Environment, ExtensionMenuDisplayDetails, extension, block, untilTimePassed } from "$common";
// import BlockUtility from "$scratch-vm/engine/block-utility";
import { getImageHelper, initializeObjectDetector } from './utils';

/** 👋 Hi!

Below is a working Extension that you should adapt to fit your needs. 

It makes use of JSDoc comments (anything inside of the '/**   * /' regions) 
to add explanations to what you're seeing. These do not affect the code 
and can be delete when you no longer need them.

Anywhere you find something that looks like: @see {ExplanationOfSomething} 
hover over the 'ExplanationOfSomething' part to get a popup that tells you more about the code.

Try out hovering by reviewing the below terminology.
NOTE: When the documentation refers to these terms, they will be capitalized.

@see {Extension}
@see {Block}
@see {BlockProgrammingEnvironment}

If you don't see anything when hovering, or find some documentation is missing, please contact: 
Parker Malachowsky (pmalacho@media.mit.edu)

Happy coding! 👋 */

/** @see {ExplanationOfDetails} */
const details: ExtensionMenuDisplayDetails = {
  name: "Basketball/Rim Detector",
  description: "This extension can detect if there is a basketball or rim in your camera output. SportSense | tiilt Lab",
  iconURL: "logo.png",
  // insetIconURL: "Replace with the name of your inset icon image file (which should be placed in the same directory as this file)"
};

/** @see {ExplanationOfClass} */
/** @see {ExplanationOfInitMethod} */
export default class Basketball_RimDetector extends extension(details, "video", "drawable", "addCostumes", "toggleVideoBlock", "setTransparencyBlock") {

    /**
   * Tells whether the continuous detection should be on/off
   */
    continuous: boolean;

    /**
     * Dimensions of the video frame
     */
    DIMENSIONS = [480, 360];

    myFrequencyMs: number;

    imageHelper: ReturnType<typeof getImageHelper>;
    
    drawables: ReturnType<typeof this.createDrawable>[] = [];

    detector: EdgeImpulseClassifier;


    init(env: Environment) {
      this.enableVideo();
      this.continuous = true;
      this.imageHelper = getImageHelper(this.DIMENSIONS[0], this.DIMENSIONS[1]);
      this.myFrequencyMs = 130;
    }

    private async detectionLoop() {
      while (this.continuous) {
        const frame = this.getVideoFrame("canvas");
        const start = Date.now();
        if (frame) {
          const detections = await this.detector.detect(frame);
          // this.displayImageDetections(detections);
        }
        const elapsed = Date.now() - start;
        await untilTimePassed(this.myFrequencyMs - elapsed);
        this.clearFrame()
      }
    } 
    clearFrame() {
      while (this.drawables.length > 0) this.drawables.shift().destroy();
    }

    async displayImageDetections(detections) {
      const { drawables, imageHelper } = this;
      const rects = imageHelper.createRects(detections.detections, "white", 5);
      drawables.push(this.createDrawable(rects));
    }
    async initEdgeImpulseModel() {
      const modelUrl = './edge-impulse/edge-impulse-standalone.wasm';
      const response = await fetch(modelUrl);
      const buffer = await response.arrayBuffer();
      const model = await WebAssembly.instantiate(buffer);
  
      return model.instance.exports;
    }
  

  @block({
    type: "command",
    text: (delay) => `Set detection rate to ${delay}`,
    arg: {
      type: ArgumentType.Number, defaultValue: 130
    }
  })
  setFrameRate(delay: number) {
    this.myFrequencyMs = delay
  }


  exampleCommand(exampleString: string, exampleNumber: number) {
    alert(`This is a command! Here's what it received: ${exampleString} and ${exampleNumber}`); // Replace with what the block should do! 
  }

  @block({
    type: BlockType.Command,
    text: (state) => `Detection ${state}`,
    arg: { type: ArgumentType.Boolean, options: [{ text: 'on', value: true }, { text: 'off', value: false }] }
  })
  async continuouslyDetectObjects(state: boolean) {
    this.continuous = state
    this.detectionLoop()
  }
}