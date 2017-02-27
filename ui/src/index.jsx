
//react things
import React from 'react';
import ReactDom from 'react-dom';
import { Router, Redirect, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';

/*
//redux things
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
*/

//ui things
import { Message, Button, Icon, Image, List, Label, Table } from 'semantic-ui-react';

//toastr
const ReactToastr = require("react-toastr");
const {ToastContainer} = ReactToastr;
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

//my things (component)
import AwesomeComponent from './components/AwesomeComponent.jsx';
import ButtonExampleGroup from './components/ButtonExampleGroup.jsx';
import StepExampleOrdered from './components/StepExampleOrdered.jsx';
import MessageExample from './components/MessageExample.jsx';
import TableExample from './components/TableExample.jsx';
import ClockComponent from './components/ClockComponent.jsx';
import NameForm from './components/NameForm.jsx';

import { getuser, getjwtheader } from './lib.jsx';

//inline style sheet from style.less under <style>
import css from 'style-loader!css-loader!less-loader!./style.less';


function SideMenu(props) {
    return (
    <div className="ui left fixed inverted vertical menu">
        <div className="item" style={{backgroundColor: "#489fdf", marginBottom: "5px"}}>
            Warehouse
        </div>

        <a href="#/" className={"item "+(props.active == "dashboard"?'active':'')}>
            <i className="cubes icon"></i> Dashboard</a>
        <a href="#/data" className={"item "+(props.active == "data"?'active':'')}>
            <i className="cubes icon"></i> Data</a>
        <a href="#/projects" className={"item "+(props.active == "projects"?'active':'')}>
            <i className="archive icon"></i> Projects</a>
        <a href="#/workflows" className={"item "+(props.active == "workflows"?'active':'')}>
            <i className="object group icon"></i> Workflows</a>
        <a href="#/test" className={"item "+(props.active == "test"?'active':'')}>
            <i className="warning sign icon"></i> Test</a>

        <a target="_blank" href="#/settings" className={"item "+(props.path == "settings"?'active':'')}
            style={{bottom: "0px", position: "fixed", width: "15em"}}>
            <i className="setting icon"></i> Settings
        </a>
    </div>
    );
}

function TopMenu(props) {
    function login() {
        //this only works if auth UI is on the same domain (storage only works for the same domain)
        sessionStorage.setItem("auth_redirect", document.location); 

        document.location = config.auth_url;
    }
    return (
    <div className="ui secondary pointing menu">
        <a className="item">
            <i className="bars icon"></i> 
        </a>
        <div className="right menu">
            <a onClick={login} className="ui item">
                Login
            </a>
            <a className="ui item">
                Logout
            </a>
        </div>
    </div>
    );
}

class Projects extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            projects: [],
            count: 0,
        }
    }

    componentDidMount() {
        fetch(config.api+"/project", getjwtheader())
        .then(res=>{
            if(res.status != "200") {
                console.error(res);
                this.refs.container.error("Failed to load projects");
                return;
            }
            return res.json()
        })
        .then(json=>{
            this.setState(json);
        })
    }

    render() {
        var projects = this.state.projects.map(function(project) {
            return <Table.Row key={project.id}>
                <Table.Cell>{project.name}</Table.Cell>
                <Table.Cell>{project.access}</Table.Cell>
                <Table.Cell>{project.admins}</Table.Cell>
                <Table.Cell>{project.members}</Table.Cell>
            </Table.Row>
        });

        return <div>
            <SideMenu active="projects" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "15px", paddingTop: "50px"}}>
                <Button className="right">New Project</Button>
                <h1>Projects</h1>
                <Table celled inverted selectable>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Name</Table.HeaderCell>
                            <Table.HeaderCell>Access</Table.HeaderCell>
                            <Table.HeaderCell>Admins</Table.HeaderCell>
                            <Table.HeaderCell>Members</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {projects} 
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell></Table.HeaderCell>
                            <Table.HeaderCell></Table.HeaderCell>
                            <Table.HeaderCell></Table.HeaderCell>
                            <Table.HeaderCell>
                                {projects.length} projects
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </div>
            <ToastContainer ref="container" toastMessageFactory={ToastMessageFactory}
                className="toast-bottom-right" />
        </div>
    }
}

class Project extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="project" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "15px", paddingTop: "50px"}}>
                Project
            </div>
        </div>
    }
}

class NoMatch extends React.Component {
    render() {
        return (
            <div>
                NoMatch
            </div>
        );
    }
}

class About extends React.Component {
    render() {
        return (
            <div>
                About
            </div>
        );
    }
}

/////////////////////////////////////////////////////////////////////////////////////////

function toCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

function toFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

function tryConvert(value, convert) {
  const input = parseFloat(value);
  if (Number.isNaN(input)) {
    return '';
  }
  const output = convert(input);
  const rounded = Math.round(output * 1000) / 1000;
  return rounded.toString();
}

const scaleNames = {
  c: 'Celsius',
  f: 'Fahrenheit'
};

function BoilingVerdict(props) {
    if (props.celsius >= 100) {
        return <p>The water would boil.</p>;
    }
    return (
        <p>The water would not boil.{props.children}</p>
    );
}

class TemperatureInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {value: ''};
    }

    handleChange(e) {
        this.props.onChange(e.target.value);
    }

    render() {
        return (
            <fieldset>
                <legend>Enter temperature in {scaleNames[this.props.scale]}:</legend>
                <input value={this.props.value} onChange={this.handleChange} />
            </fieldset>
        );
    }
}

/*
class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.handleCelsiusChange = this.handleChange.bind(this, 'c');
        this.handleFahrenheitChange = this.handleChange.bind(this, 'f');
        this.state = {value: '', scale: 'c'};
    }

    handleChange(scale, value) {
        this.setState({scale, value});
        console.log(value);
    }

    render() {
        const scale = this.state.scale;
        const value = this.state.value;
        const c = scale === 'f' ? tryConvert(value, toCelsius) : value;
        const f = scale === 'c' ? tryConvert(value, toFahrenheit) : value;
        return (
        <div>
            <SideMenu active="dashboard" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "10px"}}>
                <h1>Dashboard</h1>
                <TemperatureInput scale="c" value={c} onChange={this.handleCelsiusChange}/>
                <TemperatureInput scale="f" value={f} onChange={this.handleFahrenheitChange} />
                <BoilingVerdict celsius={parseFloat(c)}>
                    <span>hello</span>
                </BoilingVerdict>
            </div>
        </div>
        );
    }
}
*/


/*
let createStoreWithMiddleware = applyMiddleware(thunkMiddleware, api)(createStore)
let store = createStoreWithMiddleware(quotesApp)
*/

class App extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            {this.props.children}
        </div>
    }
}

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="dashboard" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "10px"}}>
                Dashboard
            </div>
        </div>
    }
}

class Data extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="data" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "10px"}}>
                Data
            </div>
        </div>
    }
}

class Workflows extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="workflows" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "10px"}}>
                Workflows
            </div>
        </div>
    }
}

class Workflow extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="workflows" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "10px"}}>
                Workflow
            </div>
        </div>
    }
}

class Test extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>
            <SideMenu active="test" />
            <div className="w_fixedtop" style={{marginLeft: "15em"}}>
                <TopMenu />
            </div>
            <div style={{marginLeft: "15em", padding: "15px", paddingTop: "50px"}}>
                Test
                {JSON.stringify(getuser())}
                <AwesomeComponent />
            </div>
        </div>
    }
}

ReactDom.render((
<Router history={hashHistory}>
    <Route path="/" component={App}>
        <IndexRoute component={Dashboard}/>
        <Route path="about" component={About}/>
        <Route path="data" component={Data}/>
        <Route path="projects" component={Projects}>
            <Route path=":id" component={Project}/>
        </Route>
        <Route path="workflows" component={Workflows}>
            <Route path=":id" component={Workflow}/>
        </Route>
        <Route path="test" component={Test}/>
    </Route>
</Router>
), document.getElementById('root'));

