import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

// Doc: https://docs.coingecko.com/reference/coins-markets
const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1";

function fetchData(setCoins, setIsLoading) {
  console.log("fetch data");

  fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch data.");

      return res.json();
    })
    .then((data) => {
      console.log(data);
      setCoins(data);
      setIsLoading(false);
    })
    .catch((err) => {
      console.log("Error occurred: ", err.message);
      setIsLoading(false);
    });
}

async function fetchDataAsync(setCoins, setIsLoading) {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch data.");

    const data = await res.json();
    console.log(data);
    setCoins(data);
  } catch (err) {
  } finally {
    setIsLoading(false);
  }
}

function App() {
  const [coins, setCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // fetchData(setCoins, setIsLoading);
    fetchDataAsync(setCoins, setIsLoading);
  }, []);

  return (
    <div>
      <ul>
        {coins.map((coin, index) => {
          return (
            <li key={coin.id}>
              name: {coin.name}, price: {coin.current_price}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;
