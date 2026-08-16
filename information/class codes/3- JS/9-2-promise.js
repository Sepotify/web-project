let promise = new Promise(function (resolve, reject) {
    console.log("Fetching data...");

    setTimeout(function () {
        const data = "Hello from server";
        resolve(data);
    }, 100);
});

console.log('promise variable defined');

promise
    .then(function (result) {
        console.log("Received:", result);
    });

console.log('after then');
