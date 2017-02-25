import React from 'react';
import { Button } from 'semantic-ui-react'

/*
class AwesomeComponent extends React.Component {
     
    constructor(props) {
        super(props);
        this.state = {likesCount : 0};
        this.onLike = this.onLike.bind(this);
    }

    onLike () {
        let newLikesCount = this.state.likesCount + 1;
        this.setState({likesCount: newLikesCount});
    }

    render() {
        return (
        <div>
            Likes! : <span>{this.state.likesCount}</span>
            <div><Button onClick={this.onLike}>Like Me</Button></div>
        </div>
        );
    }
}

export default AwesomeComponent;
*/

class ClockComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {date: new Date()};
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

    render() {
        return (
            <div>
                <h1>Clock</h1>
                <h2>It's {this.state.date.toLocaleTimeString()}.</h2>
            </div>
        );
    }
}

export default ClockComponent;

