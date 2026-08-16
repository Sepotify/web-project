const promise = new Promise((resolve, reject) => {
    // asynchronous operation here
    let success = Math.random() > 0.5;

    if (success) {
        resolve("Operation successful!");  // fulfilled
    } else {
        reject("Something went wrong!");   // rejected
    }
});

promise
    .then(result => {
        console.log(result); // runs if resolved
    })
    .catch(error => {
        console.error(error); // runs if rejected
    })
    .finally(() => {
        console.log("Promise completed.");
    });


fetch('https://skljfd')
    .then(response => response)   // handle successful response
    .then(data => console.log(data.url))
    .catch(error => console.error('Error:', error)); // handle errors
