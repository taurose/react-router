import React from 'react';
import invariant from 'invariant';
import { stripLeadingSlashes, stringifyQuery } from './URLUtils';

var { func, object } = React.PropTypes;

var RouterContextMixin = {

  propTypes: {
    router: object.isRequired,
    location: object.isRequired
  },

  childContextTypes: {
    router: object.isRequired,
    location: object.isRequired
  },

  getChildContext() {
    var {router, location} = this.props;

    return {
      router,
      location
    };
  }

};

export default RouterContextMixin;
