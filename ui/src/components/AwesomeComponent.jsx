import React from 'react';
import { Button } from 'semantic-ui-react'

import { getuser } from '../lib.jsx';

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
        var user = getuser();
        return (
        <div>
            {JSON.stringify(user, null,4)}
            Likes! : <span>{this.state.likesCount}</span>
            <div><Button onClick={this.onLike}>Like Me</Button></div>
        </div>
        );
    }
}

export default AwesomeComponent;
