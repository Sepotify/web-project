async function makeTea() {
    console.log("Starting to make tea...");

    const pr = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("Water is boiled ☕");
        }, 2000); // takes 2 seconds
    });

    const message = await pr; // wait until the Promise resolves
    console.log(message);

    console.log("Add tea leaves and sugar.");
    console.log("Tea is ready! 🍵");
}

makeTea();

console.log('Watching TV ...')
