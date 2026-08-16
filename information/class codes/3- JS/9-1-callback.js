function fetchData(callback) {
  console.log("Fetching data...");

  setTimeout(function () {
    const data = "Hello from server";
    callback(data);
  }, 1000);
}

let handleData = result => {
  console.log("Received:", result);
}

fetchData(handleData);
console.log('After calling fetchData');
