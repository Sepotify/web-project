// 1. No Block Scope
if (true) {
    var x = 10;
}
console.log(x); // 10 (still accessible outside the block)

// 2. Hoisting Confusion
console.log(a1); // undefined
var a1 = 5;
// JavaScript interprets it like this:
var a2;
console.log(a2); // undefined
a2 = 5;

// 3. Loop Problems with Closures
for (var i = 0; i < 3; i++) {
    setTimeout(function () {
        console.log(i);
    }, 100);
}
// Fix: Use let
for (var i = 0; i < 300000000; i++) {
    setTimeout(function () {
        console.log(i);
    }, 10);
}

// 4. Accidental Global Variables
function test() {
    x = 10; // becomes global accidentally
}
test();
console.log(x); // 10


// 5. Redeclaration Allowed
var name = "Alice";
var name = "Bob";

console.log(name); // Bob
