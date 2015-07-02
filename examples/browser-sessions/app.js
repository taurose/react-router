import React from 'react';
import { history } from 'react-router/lib/BrowserHistory';
import { Router, Route, Link, Redirect } from 'react-router';

var StorageKey = '_sessions';

var App = React.createClass({
  getInitialState() {
    return {
      sessions: null
    };
  },
  componentWillMount() {
    this.refreshSessions();
  },

  componentWillReceiveProps() {
    this.refreshSessions();
  },

  refreshSessions() {
    this.setState({
      sessions: JSON.parse(window.sessionStorage.getItem(StorageKey))
    });
  },

  render() {
    var s = JSON.stringify(this.state.sessions, null, 2);
    var state = this.props.location.state;
    return (
      <div>
        <div>
          <pre>{s}</pre>
          <div>Current: {state.current} of {state.length}, Key: {state.key}</div>
        </div>
        <ul>
          <li><Link to="/browser-sessions/user/123">Bob</Link></li>
          <li><Link to="/browser-sessions/user/abc">Sally</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var User = React.createClass({
  render() {
    var { userID } = this.props.params;

    return (
      <div className="User">
        <h1>User id: {userID}</h1>
        <ul>
          <li><Link to={`/browser-sessions/user/${userID}/tasks/foo`}>foo task</Link></li>
          <li><Link to={`/browser-sessions/user/${userID}/tasks/bar`}>bar task</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var Task = React.createClass({
  render() {
    var { userID, taskID } = this.props.params;

    return (
      <div className="Task">
        <h2>User ID: {userID}</h2>
        <h3>Task ID: {taskID}</h3>
      </div>
    );
  }
});

React.render((
  <Router history={history}>
    <Route path="/browser-sessions" component={App}>
      <Route path="user/:userID" component={User}>
        <Route path="tasks/:taskID" component={Task}/>
        <Redirect from="todos/:taskID" to="task"/>
      </Route>
    </Route>
  </Router>
), document.getElementById('example'));
