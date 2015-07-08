import React from 'react';
import invariant from 'invariant';
import Transition from './Transition';
import runTransition from './runTransition';
import isActive from './isActive';
import { createRoutes } from './RouteUtils';
import { getState, getTransitionHooks, getComponents, getRouteParams, createTransitionHook } from './RoutingUtils';
import { stripLeadingSlashes, stringifyQuery as stringify } from './URLUtils';
import { loopAsync } from './AsyncUtils';

class StaticRouter {

  constructor(routes, {stringifyQuery=stringify, transitionHooks=[]}={}) {
    this.routes = createRoutes(routes);
    this.stringifyQuery = stringifyQuery;
    this.hooks = transitionHooks;
  }

  getProps(location, callback) {
    var { routes, hooks } = this;
    var transition = new Transition;

    hooks = hooks.map(hook => createTransitionHook(hook, this));

    runTransition(transition, routes, hooks, this, null, location, (error, state) => {
      callback(error, state, transition);
    });
  }

  /**
   * Adds a transition hook that runs before all route hooks in a
   * transition. The signature is the same as route transition hooks.
   */
  addTransitionHook(hook) {
    this.hooks.push(hook);
  }

  /**
   * Removes the given transition hook.
   */
  removeTransitionHook(hook) {
    this.hooks = this.hooks.filter(h => h !== hook);
  }

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    if (query) {
      if (typeof query !== 'string')
        query = this.stringifyQuery(query);

      if (query !== '')
        return pathname + '?' + query;
    }

    return pathname;
  }

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  makeHref(pathname, query) {
    return this.makePath(pathname, query);
  }

  /**
   * Pushes a new Location onto the history stack.
   */
  transitionTo(pathname, query, state=null) {
    invariant(
      false,
      'Router#transitionTo is client-side only (needs history)'
    );
  }

  /**
   * Replaces the current Location on the history stack.
   */
  replaceWith(pathname, query, state=null) {
    invariant(
      false,
      'Router#replaceWith is client-side only (needs history)'
    );
  }

  /**
   * Navigates forward/backward n entries in the history stack.
   */
  go(n) {
    invariant(
      false,
      'Router#go is client-side only (needs history)'
    );
  }

  /**
   * Navigates back one entry in the history stack. This is identical to
   * the user clicking the browser's back button.
   */
  goBack() {
    this.go(-1);
  }

  /**
   * Navigates forward one entry in the history stack. This is identical to
   * the user clicking the browser's forward button.
   */
  goForward() {
    this.go(1);
  }

}

export default StaticRouter;
