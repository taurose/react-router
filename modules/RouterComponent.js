import React, { createElement, isValidElement } from 'react';
import warning from 'warning';
import invariant from 'invariant';
import { loopAsync } from './AsyncUtils';
import { createRoutes } from './RouteUtils';
import { getState, getTransitionHooks, getComponents, getRouteParams, createTransitionHook } from './RoutingUtils';
import { routes, component, components, history, location } from './PropTypes';
import RouterContextMixin from './RouterContextMixin';
import { isLocation } from './Location';
import Transition from './Transition';
import runTransition from './runTransition';
import Router from './Router';
import RouteRenderer from './RouteRenderer';
import ScrollManager from './ScrollManager';

var { arrayOf, func, object, shape } = React.PropTypes;

var RouterComponent = React.createClass({

  propTypes: {
    onAbort: func,
    onError: func,
    onUpdate: func,

    createElement: func,
    passProps: object,

    history: history.isRequired,
    routes,
    // Routes may also be given as children (JSX)
    children: routes
  },

  getInitialState() {
    return {
      isTransitioning: false,
      location: null,
      branch: null,
      params: null,
      components: null
    };
  },

  _updateState(location) {
    invariant(
      isLocation(location),
      'A <RouterComponent> needs a valid Location'
    );

    this.setState({
      isTransitioning: true
    });

    var prevState = this.state;

    this.router.transition(prevState, location, (state, transition, done) => {
      this.setState(Object.assign({}, state, { isTransitioning: false }), this.props.onUpdate);
      this.scrollManager.restore(state, prevState);
      done();
    });
  },

  componentWillMount() {
    var { history, routes, children, onAbort, onError } = this.props;

    invariant(
      routes || children,
      '<RouterComponent> needs routes. Try using <RouterComponent routes> or ' +
      'passing your routes as nested <RouterComponent> children'
    );

    this.router = new Router(routes || children, history, { onAbort, onError });
    this.scrollManager = new ScrollManager();

    if (typeof history.setup === 'function')
      history.setup();

    // We need to listen first in case we redirect immediately.
    history.addChangeListener(() => this._updateState(history.location));

    this._updateState(history.location);
  },

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.history === nextProps.history,
      '<RouterComponent history> may not be changed'
    );

    var currentRoutes = this.props.routes || this.props.children;
    var nextRoutes = nextProps.routes || nextProps.children;

    if (currentRoutes !== nextRoutes) {
       // TODO
      invariant(false, '<RouterComponent> routes cannot be changed');
    }
  },

  componentWillUnmount() {
    var { history } = this.props;
    history.removeChangeListener(this.handleHistoryChange);
  },

  render() {
    var { location, branch, params, components, isTransitioning } = this.state;
    var { passProps, createElement } = this.props;
    var { router } = this;

    if (!location)
      return null;

    return (
      <RouteRenderer
        router={router}
        location={location}
        branch={branch}
        params={params}
        components={components}
        createElement={createElement}
        passProps={Object.assign({}, { isTransitioning }, passProps)} />
    );
  }

});

export default RouterComponent;
