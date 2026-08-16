console.info("Runnign variable definintion js file");

var sample_name = 'sample name';
var sample_name = 'ss'; // No error!!

// using let (value can change)
let counter = 1;
counter = 2;   // OK
console.log(counter); // 2

// using const (value cannot be reassigned)
const pi = 3.14;
 pi = 3.15;   // ❌ Error: Assignment to constant variable
console.log(pi); // 3.14

// const with objects: the reference can't change, but properties can
const user = { name: "Alice" };
user.name = "Bob";      // OK (modifying property)
// user = {};           // ❌ Error (reassigning the whole object)
console.log(user); // { name: "Bob" }
