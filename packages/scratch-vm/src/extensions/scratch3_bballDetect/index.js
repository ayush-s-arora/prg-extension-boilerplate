require("regenerator-runtime/runtime");
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const Video = require('../../io/video');
// const posenet = require('@tensorflow-models/posenet');
const poseDetection = require('@tensorflow-models/pose-detection');
const tf = require('@tensorflow/tfjs');
const bballDetect = require('../../extensions/scratch3_bballDetect/tf-bball-detect/tfmodel.json');
const modelUrl = 'http://localhost:8080/tfmodel.json';
require("@tensorflow/tfjs-backend-webgl");
tf.setBackend('webgl');


function friendlyRound(amount) {
    return Number(amount).toFixed(2);
}

/// TODO: add value reporter blocks of x and y of different joints

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjAgMjA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojNDY5MUZGO30KCS5zdDF7ZmlsbDojOEFCOUZGO30KCS5zdDJ7ZmlsbDojMEJBMDg5O30KCS5zdDN7ZmlsbDojMTFGRkRBO30KCS5zdDR7ZmlsbDojQ0NGOEZGO30KPC9zdHlsZT4KPHRpdGxlPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1NZW51PC90aXRsZT4KPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik02LjcsMTguOUg1LjNjLTAuMiwwLTAuNC0wLjItMC40LTAuNGwwLTIuNWwwLTUuNGMwLTAuMSwwLTAuMiwwLTAuM2MwLTAuMywwLjItMC42LDAuNC0wLjhDNS42LDkuMSw2LDksNi40LDkKCWgwLjVsLTAuMiwxLjhsMCwwTDYsMTZsLTAuMiwxLjdjMCwwLjEsMCwwLjMsMC4yLDAuNGwwLjgsMC4zQzcsMTguNiw3LDE4LjksNi43LDE4Ljl6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNy45LDguNWwtMC4yLDAuNGMtMC4yLDAuMi0wLjUsMC40LTAuOCwwLjRsLTQuMiwwLjJsLTIsMC4xTDEwLjMsMTBjLTAuNSwwLjctMS4xLDAuOC0yLDAuOEg2LjZsMC4xLTEKCWwwLjEtMC42VjlIN2MwLjgsMCwxLjUtMC43LDEuNS0xLjVMNy44LDYuNmwtMi41LTNMNSwzLjFsMC43LTAuM0w1LjksM2wyLjcsMi45bDAsMGwxLjgsMS45YzAuMywwLjMsMC44LDAuNSwxLjIsMC41aDAuOUwxNy45LDguNXoKCSIvPgo8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNS45LDN2MC4xYzAsMC4xLTAuMSwwLjItMC4yLDAuMkg1LjVjMCwwLTAuMSwwLTAuMiwwTDUsMy4xbDAuNy0wLjNMNS45LDN6Ii8+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTYuOSw5bC0xLjEsMS42Yy0wLjIsMC0wLjYtMC4xLTAuOS0wLjNjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4zbC0yLTIuOUMyLDYuNiwyLDYsMi4zLDUuNmwxLjUtMi4ybDEuNi0yLjMKCQljMCwwLDAuMSwwLDAuMSwwbDAsMS42QzUuNywyLjksNS42LDMsNS41LDNINS4zQzUuMSwzLDUsMy4xLDUsMy4yTDQuNiw0TDMuNiw1LjhDMy41LDYsMy42LDYuMiwzLjcsNi4zYzAuNSwwLjQsMS4zLDEuMSwxLjMsMS4xCgkJQzYuOCw4LjksNi45LDksNi45LDlMNi45LDl6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNy4xLDkuNEw2LjgsOS44bDAuMS0wLjZDNyw5LjMsNy4xLDkuNCw3LjEsOS40TDcuMSw5LjR6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTAuMyw2LjRsMC42LTAuNmMwLjQtMC40LDEtMC40LDEuNCwwYzAuNCwwLjQsMC40LDEsMCwxLjRsLTAuNiwwLjZjLTAuNCwwLjQtMSwwLjQtMS40LDAKCQlDOS45LDcuNCw5LjksNi43LDEwLjMsNi40eiIvPgo8L2c+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xMi40LDUuN2MtMC4zLTAuMy0wLjctMC4zLTEtMC4yYzAuMSwwLDAuMiwwLjEsMC4zLDAuMmMwLjQsMC40LDAuNCwxLDAsMS40bC0wLjYsMC42CgljLTAuMSwwLjEtMC4yLDAuMi0wLjMsMC4yYzAuMywwLjEsMC44LDAsMS0wLjJsMC42LTAuNkMxMi44LDYuOCwxMi44LDYuMSwxMi40LDUuN3oiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTYuOSw5TDcsMTBsLTAuNCwwLjhsMCwwTDYsMTZINC44bDAtNS40YzAtMC4xLDAtMC4yLDAtMC4zYy0wLjEsMC0wLjItMC4xLTAuMi0wLjFjMCwwLTAuMS0wLjEtMC4xLTAuMWwtMi0yLjkKCUMyLDYuNiwyLDYsMi4zLDUuNmwxLjUtMi4ybDAuNiwwLjVsMC4xLDBMMy42LDUuOEMzLjUsNiwzLjYsNi4yLDMuNyw2LjNjMC41LDAuNCwxLjMsMS4xLDEuMywxLjFDNi44LDguOSw2LjksOSw2LjksOUw2LjksOXoiLz4KPHBhdGggY2xhc3M9InN0MyIgZD0iTTEyLjYsOS42TDEyLjYsOS42bC0yLDAuMUwxMC4zLDEwYy0wLjUsMC43LTEuMSwwLjgtMiwwLjhINi42TDYuOSw5SDdjMC44LDAsMS41LTAuNywxLjUtMS41TDcuOCw2LjVsMCwwCglsMC45LTAuNmwwLDBsMS44LDEuOWMwLjMsMC4zLDAuOCwwLjUsMS4yLDAuNWgwLjlMMTIuNiw5LjZ6Ii8+CjxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik0xMC42LDkuN0wxMC4zLDEwYy0wLjUsMC43LTEuMSwwLjgtMiwwLjhINy40YzAuNCwwLDAuOCwwLDEuMS0wLjFjMC4zLTAuMSwwLjYtMC4zLDAuOC0wLjYKCWMwLjItMC4yLDAuNC0wLjMsMC43LTAuM0wxMC42LDkuN3oiLz4KPC9zdmc+Cg==";

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIKCSBpZD0ic3ZnMTE3IiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQwIDQwIgoJIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzQ2OTFGRjt9Cgkuc3Qxe2ZpbGw6IzhBQjlGRjt9Cgkuc3Qye2ZpbGw6I0ZGRkZGRjt9Cgkuc3Qze2ZpbGw6Izk5RjFGRjt9Cgkuc3Q0e2ZpbGw6I0NDRjhGRjt9Cjwvc3R5bGU+Cjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxIiBncmlkdG9sZXJhbmNlPSIxMCIgZ3VpZGV0b2xlcmFuY2U9IjEwIiBpZD0ibmFtZWR2aWV3MTE5IiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJFeHRlbnNpb25zL1NvZnR3YXJlL1ZpZGVvLVNlbnNpbmctQmxvY2siIGlua3NjYXBlOmN4PSIxNC40NjcwNjkiIGlua3NjYXBlOmN5PSI2LjU5MDMwNTYiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIgaW5rc2NhcGU6c25hcC1zbW9vdGgtbm9kZXM9ImZhbHNlIiBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5MDciIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjAiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTYwMCIgaW5rc2NhcGU6d2luZG93LXg9IjU3MSIgaW5rc2NhcGU6d2luZG93LXk9Ijk2IiBpbmtzY2FwZTp6b29tPSI3LjA0IiBvYmplY3R0b2xlcmFuY2U9IjEwIiBwYWdlY29sb3I9IiNmZmZmZmYiIHNob3dncmlkPSJmYWxzZSI+Cgk8L3NvZGlwb2RpOm5hbWVkdmlldz4KPHRpdGxlICBpZD0idGl0bGUxMDQiPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1CbG9jazwvdGl0bGU+CjxkZXNjICBpZD0iZGVzYzEwNiI+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNC4zLDM3LjhoLTIuOWMtMC40LDAtMC44LTAuNC0wLjgtMC44bC0wLjEtNWwtMC4xLTEwLjhjMC0wLjIsMC0wLjUsMC4xLTAuN2MwLjEtMC43LDAuNS0xLjIsMC45LTEuNwoJYzAuNi0wLjYsMS40LTAuOSwyLjItMC45aDFsLTAuNSwzLjd2MGwtMS4zLDEwLjRsLTAuNCwzLjRjMCwwLjMsMC4xLDAuNywwLjUsMC44bDEuNywwLjdDMTQuOSwzNy4yLDE0LjgsMzcuOCwxNC4zLDM3Ljh6Ii8+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zNi42LDE2LjlsLTAuNCwwLjhjLTAuNCwwLjUtMSwwLjgtMS43LDAuOWwtOC40LDAuNWwtNC4xLDAuMkwyMS41LDIwYy0xLjEsMS40LTIuMiwxLjYtNCwxLjZoLTMuNGwwLjMtMi4xCglsMC4yLTEuMmwwLTAuM2gwLjJjMS43LDAsMy4xLTEuNCwzLjEtMy4xbC0xLjUtMS44bC01LTYuMWwtMC42LTAuOGwxLjUtMC42TDEyLjcsNmw1LjUsNS44aDBsMy42LDMuOGMwLjYsMC43LDEuNiwxLjEsMi41LDEuMQoJbDEuOCwwTDM2LjYsMTYuOXoiLz4KPHBhdGggY2xhc3M9InN0MSIgZD0iTTEyLjcsNmwwLDAuM2MwLDAuMy0wLjIsMC41LTAuNSwwLjVoLTAuNGMtMC4xLDAtMC4zLDAtMC40LDAuMWwtMC42LTAuOGwxLjUtMC42TDEyLjcsNnoiLz4KPGc+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTQuNiwxOGwtMi4yLDMuMmMtMC41LTAuMS0xLjMtMC4zLTEuOS0wLjdjLTAuMy0wLjItMC42LTAuNC0wLjgtMC42bC00LjEtNS44Yy0wLjctMC45LTAuNy0yLjEtMC4xLTIuOQoJCWwzLjEtNC40bDMuMy00LjZjMC4xLTAuMSwwLjMtMC4xLDAuMywwLjFsMC4xLDMuMmMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLTAuNGMtMC4zLDAtMC41LDAuMi0wLjYsMC40TDEwLDcuOWwtMS45LDMuNgoJCWMtMC4yLDAuNC0wLjEsMC44LDAuMiwxLjFjMS4xLDAuOSwyLjcsMi4zLDIuNywyLjNDMTQuNCwxNy44LDE0LjYsMTgsMTQuNiwxOEwxNC42LDE4eiIvPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTE1LDE4LjdsLTAuNiwwLjhsMC4yLTEuMkMxNC45LDE4LjYsMTUsMTguNywxNSwxOC43TDE1LDE4Ljd6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjEuNSwxMi43bDEuMi0xLjJjMC44LTAuOCwyLTAuOCwyLjgsMGMwLjgsMC44LDAuOCwyLDAsMi44bC0xLjIsMS4yYy0wLjgsMC44LTIsMC44LTIuOCwwCgkJQzIwLjcsMTQuNywyMC43LDEzLjQsMjEuNSwxMi43eiIvPgo8L2c+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0yNS42LDExLjRjLTAuNi0wLjYtMS40LTAuNy0yLjEtMC40YzAuMywwLjEsMC41LDAuMiwwLjcsMC40YzAuOCwwLjgsMC44LDIsMCwyLjhsLTEuMiwxLjIKCWMtMC4yLDAuMi0wLjQsMC40LTAuNywwLjRjMC43LDAuMywxLjYsMC4xLDIuMS0wLjRsMS4yLTEuMkMyNi40LDEzLjUsMjYuNCwxMi4yLDI1LjYsMTEuNHoiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTE0LjYsMThsMC4zLDJsLTAuOCwxLjZ2MGwtMS4zLDEwLjRoLTIuM2wtMC4xLTEwLjhjMC0wLjIsMC0wLjUsMC4xLTAuN2MtMC4yLTAuMS0wLjQtMC4yLTAuNS0wLjMKCWMtMC4xLTAuMS0wLjItMC4yLTAuMy0wLjNsLTQuMS01LjhjLTAuNy0wLjktMC43LTIuMS0wLjEtMi45bDMuMS00LjRsMS4yLDFMMTAsNy45bC0xLjksMy42Yy0wLjIsMC40LTAuMSwwLjgsMC4yLDEuMQoJYzEuMSwwLjksMi43LDIuMywyLjcsMi4zQzE0LjQsMTcuOCwxNC42LDE4LDE0LjYsMThMMTQuNiwxOHoiLz4KPHBhdGggY2xhc3M9InN0MyIgZD0iTTI2LjEsMTkuMUwyNi4xLDE5LjFsLTQuMSwwLjJMMjEuNSwyMGMtMS4xLDEuNC0yLjIsMS42LTQsMS42aC0zLjRsMC41LTMuN2gwLjJjMS43LDAsMy4xLTEuNCwzLjEtMy4xCglsLTEuNS0xLjhsMCwwbDEuOC0xLjNoMGwzLjYsMy44YzAuNiwwLjcsMS42LDEuMSwyLjUsMS4xbDEuOCwwTDI2LjEsMTkuMXoiLz4KPHBhdGggY2xhc3M9InN0NCIgZD0iTTIyLjEsMTkuNEwyMS41LDIwYy0xLjEsMS40LTIuMiwxLjYtNCwxLjZoLTEuOGMwLjksMCwxLjYtMC4xLDIuMy0wLjNjMC42LTAuMiwxLjItMC42LDEuNy0xLjMKCWMwLjQtMC40LDAuOS0wLjYsMS40LTAuN0wyMi4xLDE5LjR6Ii8+Cjwvc3ZnPgo=';

/**
 * Sensor attribute video sensor block should report.
 * @readonly
 * @enum {string}
 */
const SensingAttribute = {
    /** The amount of motion. */
    MOTION: 'motion',

    /** The direction of the motion. */
    DIRECTION: 'direction'
};

/**
 * Subject video sensor block should report for.
 * @readonly
 * @enum {string}
 */
const SensingSubject = {
    /** The sensor traits of the whole stage. */
    STAGE: 'Stage',

    /** The senosr traits of the area overlapped by this sprite. */
    SPRITE: 'this sprite'
};

/**
 * States the video sensing activity can be set to.
 * @readonly
 * @enum {string}
 */
const VideoState = {
    /** Video turned off. */
    OFF: 'off',

    /** Video turned on with default y axis mirroring. */
    ON: 'on',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: 'on-flipped'
};

const EXTENSION_ID = 'bballDetect';

/**
 * Class for the motion-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3BballDetectBlocks {
    // async loadAndPredict() {
    //     const modelUrl = 'http://localhost:8080/tfmodel.json';
    //     const model = await tf.loadLayersModel(modelUrl);
    //     console.log('Model loaded successfully');
    
    //     // Example input for grayscale data
    //     const height = 96;
    //     const width = 96;
    //     const channels = 3; // RGB
    
    //     // Assuming you have grayscale data with shape [96, 96]
    //     const grayscaleData = new Float32Array();
    
    //     // Convert grayscale to RGB
    //     const rgbData = new Float32Array(height * width * channels);
    //     for (let i = 0; i < height * width; i++) {
    //         const value = grayscaleData[i];
    //         rgbData[i * 3] = value;       // R channel
    //         rgbData[i * 3 + 1] = value;   // G channel
    //         rgbData[i * 3 + 2] = value;   // B channel
    //     }
    
    //     const input = tf.tensor4d(rgbData, [1, height, width, channels]);
    
    //     const prediction = model.predict(input);
    //     prediction.print();
    // }    
    

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * A flag to determine if this extension has been installed in a project.
         * It is set to false the first time getInfo is run.
         * @type {boolean}
         */
        this.firstInstall = true;
        myTimer01 = setInterval(this.myPicturenow, this.globalDetectionRate);
        // this.renderPrediction();
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS () {
        return [480, 360];
    }

    static get MODELDIMENSIONS () {
        return [640, 640];
    }
    /**
     * The key to load & store a target's motion-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.bballDetect';
    }

    /**
     * The default motion-related state, to be used when a target has no existing motion state.
     * @type {MotionState}
     */
    static get DEFAULT_MOTION_STATE () {
        return {
            motionFrameNumber: 0,
            motionAmount: 0,
            motionDirection: 0
        };
    }

    /**
     * The transparency setting of the video preview stored in a value
     * accessible by any object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoTransparency () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoTransparency;
        }
        return 50;
    }

    set globalVideoTransparency (transparency) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoTransparency = transparency;
        }
        return transparency;
    }

    /**
     * The video state of the video preview stored in a value accessible by any
     * object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoState () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoState;
        }
        // Though the default value for the stage is normally 'on', we need to default
        // to 'off' here to prevent the video device from briefly activating
        // while waiting for stage targets to be installed that say it should be off
        return VideoState.OFF;
    }

    set globalVideoState (state) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoState = state;
        }
        return state;
    }

    /**
     * Get the latest values for video transparency and state,
     * and set the video device to use them.
     */
    projectStarted () {
        this.setVideoTransparency({
            TRANSPARENCY: this.globalVideoTransparency
        });
        this.videoToggle({
            VIDEO_STATE: this.globalVideoState
        });
    }

    reset () {
    }

    scan() {
    }

    isConnected() {
        return this.hasPose();
    }

    connect() {
    }

    async _loop () {

        while (true) {

            const frame = this.runtime.ioDevices.video.getFrame({
                format: Video.FORMAT_IMAGE_DATA,
                dimensions: Scratch3BballDetectBlocks.DIMENSIONS
            });

            const time = +new Date();
            if (frame) {
                this.objectCenters = {"basketball": [], "hoop": []};
                this.poseStates = await this.estimatePoseOnImage(frame);
                this.poseState = this.poseStates[0];
                this.currImage = frame;
                if (this.hasPose()) {
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
                } else {
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
                }
            }
            const estimateThrottleTimeout = (+new Date() - time) / 4;
            await new Promise(r => setTimeout(r, estimateThrottleTimeout));
        }
    }

    async estimatePoseOnImage(imageElement) {
        // load the posenet model from a checkpoint
        const bodyModel = await this.ensureBodyModelLoaded();
        // return await bodyModel.estimateSinglePose(imageElement, {
        //     flipHorizontal: false
        // });
        return await bodyModel.estimatePoses(imageElement);
    }

    async preprocess (source, modelWidth, modelHeight){
      let xRatio, yRatio; // ratios for boxes

      const input = tf.tidy(() => {
        const img = tf.browser.fromPixels(source);
        return tf.image
            .resizeNearestNeighbor(img, [416, 416])
            .div(255.0)
            .expandDims(0);
      });

      return input;
    };

    async RGBAToHex(r,g,b,a) {
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);
      
        if (r.length == 1)
          r = "0" + r;
        if (g.length == 1)
          g = "0" + g;
        if (b.length == 1)
          b = "0" + b;
      
       // return "#" + r + g + b + ", " ;
        return "0x" + r + g + b + ", " ;
             
      }

    //   async renderPrediction (){   
  
    //     document.ctx.clearRect(0, 0, document.ctx.canvas.width, document.ctx.canvas.width);
      
      
    //     document.ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    //     ctxFull.drawImage(video, 0, 0, videoWidth, videoHeight);
       
       
    //    let imgData = document.ctx.getImageData(0, 0, document.ctx.canvas.width, document.ctx.canvas.height);
    //    let pixels = imgData.data;
    //    for (var i = 0; i < pixels.length; i += 4) {
     
    //      let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
     
    //      pixels[i] = lightness;
    //      pixels[i + 1] = lightness;
    //      pixels[i + 2] = lightness;
    //    }
        
    //    document.ctx.scale(-1, 1);  // mirror image
    //    document.ctx.putImageData(imgData, 0, 0);
            
    //    requestAnimationFrame(renderPrediction);
          
        
    //  }; 

     async scaleImageData(imagedata, targetWidth, targetHeight) {
        const offScreenCanvas = document.createElement('canvas');
        offScreenCanvas.width = imagedata.width;
        offScreenCanvas.height = imagedata.height;
        const offScreenCtx = offScreenCanvas.getContext('2d');
    
        offScreenCtx.putImageData(imagedata, 0, 0);
    
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = targetWidth;
        scaledCanvas.height = targetHeight;
        const scaledCtx = scaledCanvas.getContext('2d');
    
        scaledCtx.drawImage(offScreenCanvas, 0, 0, targetWidth, targetHeight);
    
        return scaledCtx.getImageData(0, 0, targetWidth, targetHeight);
    }
    
    // async myPicturenow() {
    //    var classifier = await tf.loadLayersModel(modelUrl);
       
    //    let props = classifier.getProperties();
       
    //    scaledSquareDimension = props.input_width;
    //    document.getElementById('myWidthHeight').value = props.input_width;
    //    let myBestClassificationNumber = -1  
    //    let myBestClassificationValue = 0.25   // lowest best allowable value 
    //    for (let j = 0;  j < results.results.length; j++){  
    //        if (results.results[j].value > myBestClassificationValue ){
    //            myBestClassificationNumber = j;                      // find the biggest array value
    //            myBestClassificationValue = results.results[j].value  
    //        }
    //    }
    //     if (CONTDETECTIONSTATE == OFF) {
    //         myOutputString = test;
    //     } else {      
    //         for (var i = 0; i < pixels2.length; i += 4) {
    //             myOutputString += RGBAToHex(ImageData2.data[i], ImageData2.data[i+1], ImageData2.data[i+2], ImageData2.data[i+3]);
    //             myOutputString = myOutputString.substring(0, myOutputString.length - 2);  // remove last ,"
    //             document.getElementById('myTextArea01').value = myOutputString;
    //         }
    //     };
    //    results = await classifier.classify( myOutputString.split(', ')   );
    // }


    async ensureBodyModelLoaded() {
        if (!this._bodyModel) {
            const moveModel = poseDetection.SupportedModels.MoveNet;
            this._bodyModel = await poseDetection.createDetector(moveModel, {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING});

            // this._bodyModel = await posenet.load();
        }
        return this._bodyModel;
    }

    async ensureTaskModelLoaded() {
        if (!this.taskModel) {
            // this.taskModel = await tf.loadGraphModel("https://raw.githubusercontent.com/Adit31/Explorer_Treat/master/best_web_model_custom/model.json");
        }
        return this.taskModel;
    }

    
    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    static get SensingAttribute () {
        return SensingAttribute;
    }

    /**
     * An array of choices of whether a reporter should return the frame's
     * motion amount or direction.
     * @type {object[]}
     * @param {string} name - the translatable name to display in sensor
     *   attribute menu
     * @param {string} value - the serializable value of the attribute
     */
    get ATTRIBUTE_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.motion',
                    default: 'motion',
                    description: 'Attribute for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingAttribute.MOTION
            },
            {
                name: formatMessage({
                    id: 'videoSensing.direction',
                    default: 'direction',
                    description: 'Attribute for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingAttribute.DIRECTION
            }
        ];
    }

    static get SensingSubject () {
        return SensingSubject;
    }

    /**
     * An array of info about the subject choices.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the subject menu
     * @param {string} value - the serializable value of the subject
     */
    get SUBJECT_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.sprite',
                    default: 'sprite',
                    description: 'Subject for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingSubject.SPRITE
            },
            {
                name: formatMessage({
                    id: 'videoSensing.stage',
                    default: 'stage',
                    description: 'Subject for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingSubject.STAGE
            }
        ];
    }

    /**
     * States the video sensing activity can be set to.
     * @readonly
     * @enum {string}
     */
    static get VideoState () {
        return VideoState;
    }

    /**
     * An array of info on video state options for the "turn video [STATE]" block.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the video state menu
     * @param {string} value - the serializable value stored in the block
     */
    get VIDEO_STATE_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.off',
                    default: 'off',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.OFF
            },
            {
                name: formatMessage({
                    id: 'videoSensing.on',
                    default: 'on',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.ON
            },
            {
                name: formatMessage({
                    id: 'videoSensing.onFlipped',
                    default: 'on flipped',
                    description: 'Option for the "turn video [STATE]" block that causes the video to be flipped' +
                        ' horizontally (reversed as in a mirror)'
                }),
                value: VideoState.ON_FLIPPED
            }
        ];
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        // Set the video display properties to defaults the first time
        // getInfo is run. This turns on the video device when it is
        // first added to a project, and is overwritten by a PROJECT_LOADED
        // event listener that later calls updateVideoDisplay
        if (this.firstInstall) {
            this.globalVideoState = VideoState.ON;
            this.globalVideoTransparency = 50;
            this.globalDetectionRate = 130;
            this.projectStarted();
            this.firstInstall = false;
            this._bodyModel = null;
            this._taskModel = null;
        }

        // Return extension definition
        return {
            id: EXTENSION_ID,
            name: formatMessage({
                id: 'posenet.categoryName',
                default: 'Basketball/Rim Detection',
                description: 'Label for tiilt Basketball/Rim Detection'
            }),
            showStatusButton: true,
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: [
                {
                    opcode: 'goToPart',
                    text: 'go to [PART]',
                    blockType: BlockType.COMMAND,
                    isTerminal: false,
                    arguments: {
                        PART: {
                            type: ArgumentType.STRING,
                            defaultValue: 'nose',
                            menu: 'PART'
                        },
                    },
                },
                {
                    opcode: 'posePositionX',
                    text: 'x position of [PART]',
                    blockType: BlockType.REPORTER,
                    isTerminal: true,
                    arguments: {
                        PART: {
                            type: ArgumentType.STRING,
                            defaultValue: 'nose',
                            menu: 'PART'
                        },
                    }
                },
                {
                    opcode: 'posePositionY',
                    text: 'y position of [PART]',
                    blockType: BlockType.REPORTER,
                    isTerminal: true,
                    arguments: {
                        PART: {
                            type: ArgumentType.STRING,
                            defaultValue: 'nose',
                            menu: 'PART'
                        },
                    }
                },
                {
                    opcode: 'partAngle',
                    text: 'angle between [PART], [PART2] and [PART3]',
                    blockType: BlockType.REPORTER,
                    isTerminal: true,
                    arguments: {
                        PART: {
                            type: ArgumentType.STRING,
                            defaultValue: 'nose',
                            menu: 'PART'
                        },
                        PART2: {
                            type: ArgumentType.STRING,
                            defaultValue: 'left_shoulder',
                            menu: 'PART'
                        },
                        PART3: {
                            type: ArgumentType.STRING,
                            defaultValue: 'left_hip',
                            menu: 'PART'
                        },
                    }
                },

                /// TODO::: set up confidence threshold setter!!!
                // {
                //     opcode: 'goToObjects',
                //     text: 'go to [OBJECT]',
                //     blockType: BlockType.COMMAND,
                //     isTerminal: false,
                //     arguments: {
                //         OBJECT: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'basketball',
                //             menu: 'OBJECT'
                //         },
                //     },
                // },
                '---',
                {
                    opcode: 'videoToggle',
                    text: formatMessage({
                        id: 'videoSensing.videoToggle',
                        default: 'Turn video [VIDEO_STATE]',
                        description: 'Controls display of the video preview layer'
                    }),
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'VIDEO_STATE',
                            defaultValue: VideoState.OFF
                        }
                    }
                },
                {
                    opcode: 'setVideoTransparency',
                    text: formatMessage({
                        id: 'videoSensing.setVideoTransparency',
                        default: 'set video transparency to [TRANSPARENCY]%',
                        description: 'Controls transparency of the video preview layer'
                    }),
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'setDetectionRate',
                    text: formatMessage({
                        id: 'videoSensing.setDetectionRate',
                        default: 'Set detection rate to [RATE] ms',
                        description: 'Controls detection rate passed to model'
                    }),
                    arguments: {
                        RATE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 133
                        }
                    }
                },
                {
                    opcode: 'continuousDetection',
                    text: formatMessage({
                        id: 'videoSensing.continuousDetection',
                        default: 'Turn continuous detection [CONTDETECTIONSTATE]',
                        description: 'Controls whether model keeps detecting objects'
                    }),
                    arguments: {
                        CONTDETECTIONSTATE: {
                            type: ArgumentType.STRING,
                            menu: 'CONTINUOUS',
                            defaultValue: 'on'
                        }
                    }
                }
            ],
            menus: {
                PART: {
                    acceptReporters: true,
                    items: [
                        {text: 'nose', value: 'nose'},
                        {text: 'right eye', value: 'left_eye'},
                        {text: 'left eye', value: 'right_eye'},
                        {text: 'right ear', value: 'left_ear'},
                        {text: 'left ear', value: 'right_ear'},
                        {text: 'right shoulder', value: 'left_shoulder'},
                        {text: 'left shoulder', value: 'right_shoulder'},
                        {text: 'right elbow', value: 'left_elbow'},
                        {text: 'left elbow', value: 'right_elbow'},
                        {text: 'right wrist', value: 'left_wrist'},
                        {text: 'left wrist', value: 'right_wrist'},
                        {text: 'right hip', value: 'left_hip'},
                        {text: 'left hip', value: 'right_hip'},
                        {text: 'right knee', value: 'left_knee'},
                        {text: 'left knee', value: 'right_knee'},
                        {text: 'right ankle', value: 'left_ankle'},
                        {text: 'left ankle', value: 'right_ankle'},
                    ]
                },
                OBJECT: {
                    acceptReporters: true,
                    items: [
                        {text: 'basketball', value: 'basketball'},
                        // {text: 'sports ball', value: 'sports ball'},
                        // {text: 'person', value: 'person'},
                        {text: 'hoop', value: 'hoop'}
                    ]
                },

                ATTRIBUTE: {
                    acceptReporters: true,
                    items: this._buildMenu(this.ATTRIBUTE_INFO)
                },
                SUBJECT: {
                    acceptReporters: true,
                    items: this._buildMenu(this.SUBJECT_INFO)
                },
                VIDEO_STATE: {
                    acceptReporters: true,
                    items: this._buildMenu(this.VIDEO_STATE_INFO)
                },
                CONTINUOUS: {
                    acceptReporters: true,
                    items: [
                        {text: 'on', value: 'on'},
                        {text: 'off', value: 'off'}
                    ]
                }
            }
        };
    }

    // getPartLocation

    goToPart(args, util) {
        if (this.hasPose()) {
            const pt = this.poseState.keypoints.find(point => point.name === args['PART'])
            if (pt) {
                if (pt.score > 0.2) {
                    const {x, y} = this.tfCoordsToScratch({"x": pt.x, "y": pt.y});
                    util.target.setXY(x, y, false);    
                }
            }
        }
        else {

        }
    }

    xLocationReporter(args, util) {
        if (this.hasPose()) {
            args['PART']
        }
        else {
            return 0;
        }
    }

     async goToObjects(args, util) {        
        const taskModel = await this.ensureTaskModelLoaded();
        tf.engine().startScope();
        const imageTensor = await this.preprocess(this.currImage);
        await taskModel.executeAsync(imageTensor).then((res) => {
            const [boxes, scores, classes] = res.slice(0, 3);
            const boxes_data = boxes.dataSync();
            const scores_data = scores.dataSync();
            const classes_data = classes.dataSync();
            // console.log(boxes_data);
            this.drawBoxes(boxes_data, scores_data, classes_data);
            tf.dispose(res);
        });
        
        // tf.dispose(objectList);
        tf.engine().endScope();
        // console.log(args);
        const objPos = this.objectCenters[args["OBJECT"]][0];
        // console.log(this.objectCenters, objPos, args);
        if (objPos) {
            // console.log(objPos);
            util.target.setXY(parseInt(objPos.x), parseInt(objPos.y), false)    ;
        }
        

    }


    drawBoxes(boundingBoxes, confids, classes) {
        // console.log("boxes", boundingBoxes);
        // console.log("confids", confids);
        // console.log("classes", classes);
        // console.log(tf.memory());

        debugBox = false;
        var bbs = document.getElementsByClassName("boundingBoxes");
        while (bbs.length > 0) {
            bbs[0].remove();
        }
        var flagB = 0;
        var flagH = 0;
        var flagP = 0;

        for (let i=0; i<100; i++) {
            if (confids[i] > 0.5) {
                var x1 = (boundingBoxes[4*i]/416)*480;
                var y1 = (boundingBoxes[4*i+1]/416)*480;
                var x2 = (boundingBoxes[4*i+2]/416)*480;
                var y2 = (boundingBoxes[4*i+3]/416)*480;
                var center = {"x": (((x1 + x2)/2) * 405) - 250, "y": 200 - (((y1 + y2)/2) * 305)};

                if (debugBox) {
                    var w = x2 - x1;
                    var h = y2 - y1;
                    const parentDiv = document.querySelector('.stage_stage_1fD7k');
                    parentDiv.style.position = 'relative';

                    const childDiv = parentDiv.querySelector('div');
                    const yellowBox = document.createElement('div');
                    yellowBox.style.border = '1px solid black';
                    yellowBox.style.width = (w * 405).toString()+"px";
                    yellowBox.style.height = (h * 305).toString()+"px";
                    yellowBox.style.top = (y1 * 305).toString()+"px";
                    yellowBox.style.left = (x1 * 405).toString()+"px";
                    yellowBox.style.position = 'absolute';
                    yellowBox.classList.add("boundingBoxes");

                     childDiv.appendChild(yellowBox);
                 }

                if (classes[i] == 0) {
                    this.objectCenters["basketball"].push(center);
                }

                else if(classes[i] == 1) {
                    this.objectCenters["hoop"].push(center);
                }
            }
        }
        
    }

    hasPose() {
        // console.log(this.poseState)
        return this.poseState && this.poseState.keypoints && this.poseState.score > 0.01;
    }

    /**
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {number} class name if video frame matched, empty number if model not loaded yet
     */
    posePositionX(args, util) {
        // this.poseState.keypoints.find(point => point.name === args['PART'])
        if (this.hasPose()){
            return this.tfCoordsToScratch({x: this.poseState.keypoints.find(point => point.name === args['PART']).x}).x;
        }
        else {
            return 0
        }
    }

    /**
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {number} class name if video frame matched, empty number if model not loaded yet
     */
    posePositionY(args, util) {
        if (this.hasPose()){
            return this.tfCoordsToScratch({y: this.poseState.keypoints.find(point => point.name === args['PART']).y}).y;
        }
        else {
            return 0;
        }
    }

    partAngle(args, util) {
        if (this.hasPose()){
            p1 = this.poseState.keypoints.find(point => point.name === args['PART']);
            p2 = this.poseState.keypoints.find(point => point.name === args['PART2']);
            p3 = this.poseState.keypoints.find(point => point.name === args['PART3']);
            if (p1.score > 0.2 && p2.score > 0.2 && p3.score) {
            // pt1 = tfCoordsToScratch()
                // console.log(p1, p2, p3);
                // p12 = Math.sqrt(Math.pow((p2.x - p1.x),2)+ Math.pow((p2.y - p1.y),2));
                // p23 = Math.sqrt(Math.pow((p2.x - p3.x),2)+ Math.pow((p2.y - p3.y),2));
                // p13 = Math.sqrt(Math.pow((p3.x - p1.x),2)+ Math.pow((p3.y - p1.y),2));
                // cosang = ((p23 * p23) + (p12 * p12) - (p13 * p13)) / (2 * p23 * p12);

                ang12 = positiveTanInverse((p1.x - p2.x), (p1.y - p2.y))
                ang23 = positiveTanInverse((p3.x - p2.x), (p3.y - p2.y))

                function positiveTanInverse(x, y) {
                    ang = Math.atan2(y, x) * 180 / Math.PI;
                    if (ang < 0) {
                        ang += 360;
                    }
                    return ang
                }

                
                // console.log(p12, p23, p13,cosang);
                // if (Math.abs(cosang) > 1) {
                //     console.log(p1, p2, p3);
                //     console.log(p12, p23, p13,cosang);
                //     cosang = cosang%1;
                // }
                // ang = Math.acos(cosang);
                // ang2 = ang * 180 / Math.PI

                ang123 = ang12 - ang23;


                // console.log(ang2);
                return ang123;
            }
            // return this.tfCoordsToScratch({y: this.poseState.keypoints.find(point => point.name === args['PART']).y}).y;
        }
        else {
            return 0;
        }
    }

    tfCoordsToScratch({x, y}) {
        return {x: x - 250, y: 200 - y};
    }

    /**
     * A scratch command block handle that configures the video state from
     * passed arguments.
     * @param {object} args - the block arguments
     * @param {VideoState} args.VIDEO_STATE - the video state to set the device to
     */
    videoToggle (args) {
        const state = args.VIDEO_STATE;
        this.globalVideoState = state;
        if (state === VideoState.OFF) {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            this.runtime.ioDevices.video.enableVideo();
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    /**
     * A scratch command block handle that configures the video preview's
     * transparency from passed arguments.
     * @param {object} args - the block arguments
     * @param {number} args.TRANSPARENCY - the transparency to set the video
     *   preview to
     */
    setVideoTransparency (args) {
        const transparency = Cast.toNumber(args.TRANSPARENCY);
        this.globalVideoTransparency = transparency;
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
    }
    setDetectionRate(args) {
        const rate = Cast.toNumber(args.RATE);
        this.globalDetectionRate = rate;
        //todo
    }
}
module.exports = Scratch3BballDetectBlocks;