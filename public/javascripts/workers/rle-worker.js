self.addEventListener('message', e => {
	let result = [];
	for (let chunk of e.data) {
		chunk.cell = RLEdecode(chunk.cell);
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

			newArray=newArray.concat(array.slice(i,i+ripCount));
			// console.log("rip",ripCount,array.slice(i,i+ripCount));
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