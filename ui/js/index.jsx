
import React from 'react';
//import {render} from 'react-dom';
import ReactDom from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';

import { Message, Button, Icon } from 'semantic-ui-react';

import AwesomeComponent from './components/AwesomeComponent.jsx';
import ButtonExampleGroup from './components/ButtonExampleGroup.jsx';
import StepExampleOrdered from './components/StepExampleOrdered.jsx';
import MessageExample from './components/MessageExample.jsx';
import TableExample from './components/TableExample.jsx';
import ClockComponent from './components/ClockComponent.jsx';

class App extends React.Component {
    /*
    constructor() {
        super();
        this.list = [<p>hi</p>];

        setTimeout(()=>{
            this.list.push(<h1>soichi</h1>);
        }, 1000);
    }
    */

    render() {
        return (
            <div>
                <h1>{this.list}</h1>
                <ClockComponent />
                <MessageExample />
                <ButtonExampleGroup />
                <AwesomeComponent />
                <StepExampleOrdered />
                <TableExample />

                <Message
                    icon='inbox'
                    header='Have you heard about our mailing list?'
                    content='Get the best news in your e-mail every day.' />

                <Button size='small' color='green'>
                  <Icon name='download' />
                    Download Green
                </Button>
            </div>
        );
    }
}

ReactDom.render(
    <App/>, 
    document.getElementById('app'));
    
/*
ReactDom.render((
<Router history={hashHistory}>
    <Router path="/" component={App} />
</Router>
), document.getElementById('router'));
*/
