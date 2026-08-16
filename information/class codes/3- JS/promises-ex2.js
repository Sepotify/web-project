let winner = null;

function race(name, time) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!winner) winner = name;
      resolve(name);
    }, time);
  });
}

async function run() {
  const results = await Promise.all([
    race("A", Math.random() * 500),
    race("B", Math.random() * 500),
    race("C", Math.random() * 500)
  ]);
  console.log("Winner:", winner);
  console.log("All finished:", results);
}

run();
