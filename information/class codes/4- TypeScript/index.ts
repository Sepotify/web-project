let age : number = 20;
let name : string = 'Mahdi';
let isMale : boolean = true;
// number , string , boolean, bigint, symbol
// name = 24;
console.log(name);


// ***************************** 

interface User {
    id?: number,
    name: string,
    email?: string,
}

let person : User = {id: 1, name: 'Mahdi' , email: 'mahdi@gmail.com'};

console.log(person.email);


// *************

function add(a: number, b: number) : number {
    return a + b;
}

const multiply = (a: number, b: number) : number => {
    return a *b;
}

console.log(multiply(2, 6));

// *********************************

interface Animal{

}

class Person implements Animal {
    public name: string;
    constructor(name: string){
        this.name = name;
    }
}

console.log((new Person('ali')).name);

// *************************************

import add2, { pi } from './utils.ts';
console.log(pi);

console.log(add2(1, 4));
