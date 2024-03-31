var output = [];

function fibonacciGenerator(n) {
    if (n > 0) {
        if (n === 1) {
            output.push(0);
        } else if (n === 2){
            output.push(0);
            output.push(1);      
        } else {
            output = [0, 1];
            for (var index = 2; index < n; index++) {
                output.push(output[index - 1] + output[index - 2]);
            }
            
        } 
    }

    return output;
}

fibonacciGenerator(15);
console.log(output);

