console.info("Running type coercion js file")

// String coercion
console.log("5" + 2);      // "52"
console.log(1 + 2 + "3");      // "33"
console.log("3" + 1 + 2);      // "312"

// Numeric coercion
console.log("5" - 2);      // 3
console.log("5" * 2);      // 10
console.log("10" / 2);         // 5
console.log("6" % 4);          // 2

// Boolean coercion
console.log(Boolean(0));   // false
console.log(Boolean("hi"));// true
console.log(Boolean([]));       // true
console.log(Boolean({}));       // true

// Loose equality (type coercion)
console.log(5 == "5");     // true
console.log(false == 0);   // true

// Strict equality (no coercion)
console.log(5 === "5");    // false

// Special cases
console.log(null == undefined); // true
console.log(null + 1);          // 1
console.log(undefined + 1);     // NaN
