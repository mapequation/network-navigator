import * as d3 from 'd3-force';


export default class State {
    constructor() {
        this.simulation = d3.forceSimulation()
            .alphaDecay(0.06)
            .stop();

        this.dirty = false;
    }
}
