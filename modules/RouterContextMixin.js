import React from 'react';
import { location } from './PropTypes';

var { func, object } = React.PropTypes;

var RouterContextMixin = {

  propTypes: {
    router: object.isRequired,
    location: location.isRequired
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
