import { useState, useEffect } from "react";

const LifecycleLogger = () => {
    const [count, setCount] = useState(0);

    // componentDidUpdate
    useEffect(() => {
        console.log('Component mounted...')

        // componentWillUnmount
        return () => {
            console.log('Component unmount...')
        };
    }, []);

    // componentDidUpdate
    useEffect(() => {
        if (count > 0){
            console.log('Component updated...', count);
        }

    }, [count]);

    const incrementCount = () => {
        setCount((prevCount) => prevCount + 1);
    };

    return (
        <div>
            <h2>LifecycleLogger Function.</h2>
            <p>count is: {count}</p>
            <button onClick={incrementCount}>
                Update counter
            </button>
        </div>
    )

}

export default LifecycleLogger;
