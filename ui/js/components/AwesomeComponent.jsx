console.log("hi there soichi!");

import React from 'react';
import { Button } from 'semantic-ui-react'

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
