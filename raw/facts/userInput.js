// const readline = require('readline').createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
//     await readline.promises.question('Who are you?', name);

//     console.log(name)


const prompt = require('prompt-sync')();

const name = prompt('What is your name?');
console.log(`Hey there ${name}`);

let myname = name;
console.log(myname);
