import React from 'react';
import isActive from './isActive';

var { object } = React.PropTypes;

/**
 * A mixin for components that need to know the path, routes, URL
 * params and query that are currently active.
 *
 * Example:
 *
 *   import { State } from 'react-router';
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ State ],
 *     render() {
 *       var className = this.props.className;
 *
 *       if (this.isActive('about'))
 *         className += ' is-active';
 *
 *       return React.createElement('a', { className: className }, this.props.children);
 *     }
 *   });
 */
var State = {

  contextTypes: {
    location: object.isRequired
  },

  isActive(pathname, query) {
    return isActive(this.context.location, pathname, query);
  }

};

export default State;
