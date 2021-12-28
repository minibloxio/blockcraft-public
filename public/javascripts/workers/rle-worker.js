let bufferSize = 16*16*16;

self.addEventListener('message', e => {

	let chunks = e.data;

	let result = [];
	for (let chunk of chunks) {
		let cell = RLEdecode(chunk.cell);
		chunk.cell = new Uint8Array(new SharedArrayBuffer(bufferSize));
		chunk.cell.set(cell, 0);
		result.push(chunk);
	}
	
	self.postMessage(result)
});

function RLEdecode(array) {
	var newArray=[],isRip,isRun,ripCount,runCount;
	for (var i = 0; i < array.length; i++) {
		isRip=array[i]<0;
		isRun=array[i]>0;
		if(isRip){
			ripCount=Math.abs(array[i]);
			i+=1;

			for (let a of array.slice(i, i+ripCount)) {
				newArray.push(a);
			}

			i+=ripCount-1;
		}
		if(isRun){
			runCount=array[i];
			i+=1;
			for (var j = 0; j < runCount; j++) {
				newArray.push(array[i])
			};
			
		}
		
	};
	return newArray;

}