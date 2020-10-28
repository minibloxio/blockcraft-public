self.addEventListener('message', e => {
	let chunk = e.data;
	chunk.cell = RLEdecode(chunk.cell);
	self.postMessage(chunk);
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