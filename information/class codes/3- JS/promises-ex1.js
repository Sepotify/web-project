function task(name, time) {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(name, "done");
            resolve(name);
        }, time);
    });
}

async function run() {
    const a = task("A", 1000);
    const b = task("B", 500);
    const c = await task("C", 200);

    console.log(c);

    console.log("Waiting ...");
    const results = await Promise.all([a, b, c]);
    console.log("All finished", results);

}

run();
