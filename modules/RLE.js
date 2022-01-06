module.exports = class RLE {
    static decode(array) {
        var newArray = [], isRip, isRun, ripCount, runCount;
        for (var i = 0; i < array.length; i++) {
            isRip = array[i] < 0;
            isRun = array[i] > 0;
            if (isRip) {
                ripCount = Math.abs(array[i]);
                i += 1;

                newArray = newArray.concat(array.slice(i, i + ripCount));
                i += ripCount - 1;
            }
            if (isRun) {
                runCount = array[i];
                i += 1;
                for (var j = 0; j < runCount; j++) {
                    newArray.push(array[i])
                };

            }

        };
        return newArray;
    }

    static encode(array) {
        var newArray = [];
        var rip = [];
        var lastValue = undefined;
        var runCount = 0;

        for (var i = 1, lastValue = array[0]; i <= array.length; i++) {
            if (array[i] !== lastValue) {
                if (runCount !== 0) {
                    newArray.push(runCount + 1, lastValue);
                } else {
                    rip.push(lastValue);
                }
                runCount = 0;
            }

            if (array[i] === lastValue || i === array.length) {
                if (rip.length !== 0) {
                    if (rip.length) {
                        newArray.push(-rip.length);
                        newArray = newArray.concat(rip);
                    }
                    rip = [];
                }
                runCount++;
            }
            lastValue = array[i];
        };
        return newArray;
    }
}