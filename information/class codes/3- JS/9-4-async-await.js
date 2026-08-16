function fetchData() {
    return new Promise(function (resolve, reject) {
        console.log("Fetching data...");

        setTimeout(function () {
            const success = Math.random() > 0.5;

            if (success) {
                resolve("Hello from server");
            } else {
                reject("Failed to fetch data");
            }
        }, 1000);
    });
}

async function main() {
    try {
        const promise1 = fetchData();
        const result = await promise1;
        console.log("Received:", result);
    } catch (error) {
        console.log("Error:", error);
    }
}

main();
console.log('after main');
