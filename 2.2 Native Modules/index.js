const fs = require("fs");

// fs.writeFile("message.txt", "Hello from NodeJs!!!", (err) => {
//     if (err) throw err;
//     console.log("The file has been saved!");
// })

// comment multiple lines shortcut alt + shift + a
//toggle line comments command + /

fs.readFile("message.txt", "utf-8", (err, data) => {
    if (err) throw err;
    console.log(data);
})