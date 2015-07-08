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

var { arrayOf, func, object } = React.PropTypes;

var RouteRenderer = React.createClass({

  mixins: [ RouterContextMixin ],

  propTypes: {
    createElement: func.isRequired,
    passProps: object,

    location: location.isRequired,
    branch: routes.isRequired,
    params: object,
    components: arrayOf(components).isRequired
  },

  getDefaultProps() {
    return {
      createElement
    };
  },

  _createElement(component, props) {
    return typeof component === 'function' ? this.props.createElement(component, props) : null;
  },

  render() {
    var { branch, params, components, location, passProps } = this.props;
    var element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = branch[index];
        var routeParams = getRouteParams(route, params);
        var props = Object.assign({}, { branch, params, components, location }, { route, routeParams }, passProps);

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this._createElement(components[key], props);

          return elements;
        }

        return this._createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default RouteRenderer;
