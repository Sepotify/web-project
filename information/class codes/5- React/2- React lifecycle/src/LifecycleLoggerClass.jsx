import { Component } from "react";

class LifecycleLogger extends Component {
    constructor(props) {
        // Set states, save props, ...
        super(props);

        this.state = {
            count: 0
        }

        console.log('Init LifecycleLogger Component ...');
    }

    componentDidMount() {
        console.log('Component Mounted.')
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('ComponentDidUpdate called.')
    }

    componentWillUnmount(){
        console.log('Component unmount.')
    }

    incrementCount = () => {
        this.setState((prevState) => {
            return { count: prevState.count + 1 }
        })
    }

    render() {
        return (
            <div>
                <h2>LifecycleLogger Class Component</h2>
                <h3>{this.state.count}</h3>

                <button onClick={this.incrementCount}>
                    Increment
                </button>
            </div>
        )
    }

}

export default LifecycleLogger;
