import React from 'react';
import { Button } from 'semantic-ui-react'

function UserGreeting(props) {
  return <h1>Welcome back!</h1>;
}

function GuestGreeting(props) {
  return <h1>Please sign up.</h1>;
}

function Greeting(props) {
    const isLoggedIn = props.isLoggedIn;
    if(isLoggedIn) {
        return <UserGreeting />;
    } else {
        return <GuestGreeting />;
    }
}

function NumberList(props) {
    const listItems = props.numbers.map((number)=>
        <li key={number.toString()}>{number}</li>
    );
    return (
        <ul>{listItems}</ul>
    )
}

class ClockComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: new Date(),
            c: false,
        };
        this.clickit = this.clickit.bind(this);
        /*
        this.clickit = (e) => {
            this.setState({date: new Date(2015,1,1)});
        }
        */
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(), 1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timeID);
    }

    tick() {
        this.setState({
            date: new Date()
        });
    }

    clickit(e) {
        console.log("click here!!", e);
        this.setState({
            c: true,
        });
    }

    render() {
        const numbers = [1,2,3,4,5];

        return (
            <div>
                <Greeting isLoggedIn={true} />
                <h1 onClick={this.clickit}>Clock</h1>
                <h2>CurrentTime {this.state.date.toLocaleTimeString()}.</h2>
                {this.state.c?(
                    <p>clicked</p>
                ) : (
                    <p>not clicked</p>
                )}

                <NumberList numbers={numbers} />
            </div>
        );
    }
}

export default ClockComponent;

