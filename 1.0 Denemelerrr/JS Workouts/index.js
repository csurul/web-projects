var money = 11;/*prompt( "How much money do you have?: ");*/
console.log("you got " + getMilk(money) + " bottles");

function getMilk(money) {
    return Math.ceil( money / 1.5);
}

var myAge= 35;
lifeInWeeks(myAge);

function lifeInWeeks(age) {
    
    /************Don't change the code above************/    
        
        //Write your code here.
        var leftYears = 90 - age;
        console.log("You have " + leftYears * 365 + " days, " + leftYears * 52 + 
                    " weeks, and " + leftYears * 12 + " months left."); 
    
        
    /*************Don't change the code below**********/
}

console.log("\nMy body mass index: " + bmiCalculator(80, 1.75));
function bmiCalculator( weight, height) {
    return Math.round( weight / Math.pow(height, 2));
}