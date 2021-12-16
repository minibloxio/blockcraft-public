/**
 * A random() function, must return a numer in the interval [0,1), just like Math.random().
 */
export declare type RandomFn = () => number;
/** Deterministic simplex noise generator suitable for 2D, 3D and 4D spaces. */
export declare class SimplexNoise {
    private p;
    private perm;
    private permMod12;
    /**
     * Creates a new `SimplexNoise` instance.
     * This involves some setup. You can save a few cpu cycles by reusing the same instance.
     * @param randomOrSeed A random number generator or a seed (string|number).
     * Defaults to Math.random (random irreproducible initialization).
     */
    constructor(randomOrSeed?: RandomFn | string | number);
    /**
     * Samples the noise field in 2 dimensions
     * @param x
     * @param y
     * @returns a number in the interval [-1, 1]
     */
    noise2D(x: number, y: number): number;
    /**
     * Samples the noise field in 3 dimensions
     * @param x
     * @param y
     * @param z
     * @returns a number in the interval [-1, 1]
     */
    noise3D(x: number, y: number, z: number): number;
    /**
     * Samples the noise field in 4 dimensions
     * @param x
     * @param y
     * @param z
     * @returns a number in the interval [-1, 1]
     */
    noise4D(x: number, y: number, z: number, w: number): number;
}
export default SimplexNoise;
/**
 * Builds a random permutation table.
 * This is exported only for (internal) testing purposes.
 * Do not rely on this export.
 * @private
 */
export declare function buildPermutationTable(random: RandomFn): Uint8Array;
