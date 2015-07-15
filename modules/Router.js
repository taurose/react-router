import warning from 'warning';
import StaticRouter from './StaticRouter';
import Transition from './Transition';
import runTransition from './runTransition';
import { createTransitionHook } from './RoutingUtils';

class Router extends StaticRouter {

  constructor(routes, history, {onAbort, onError, ...opts}={}) {
    super(routes, opts);
    this.history = history;
    this.currentTransition = null;

    this.onAbort = onAbort;
    this.onError = onError;
  }

  transition(prevState, location, callback) {
    var { routes, hooks } = this;

    if (this.currentTransition)
      this.currentTransition.abort();

    var transition = new Transition;
    this.currentTransition = transition;

    hooks = hooks.map(hook => createTransitionHook(hook, this));

    runTransition(transition, routes, hooks, this, prevState, location, (error, state) => {
      if (error) {
        if (this.currentTransition === transition)
          this.currentTransition = null;

        this.handleError(error);
        return;
      }

      if (this.finishTransition(transition))
        return;

      if (state == null) {
        warning(false, 'Location "%s" did not match any routes', location.pathname);
        return;
      }

      callback(state, transition, () => {
        this.finishTransition(transition);

        if (this.currentTransition === transition)
          this.currentTransition = null;
      });
    });
  }

  finishTransition(transition) {
    if (this.currentTransition !== transition)
      return true;

    if (transition.isCancelled) {
      this.currentTransition = null;

      if (transition.redirectInfo) {
        this.handleRedirect(transition.redirectInfo);
      } else {
        this.handleAbort(transition.abortReason);
      }

      return true;
    }

    return false;
  }

  resetCurrentTransition(transition) {
    if (this.currentTransition === transition)
      transition = null;
  }

  handleError(error) {
    if (this.onError) {
      this.onError.call(this, error);
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error; // This error probably originated in getChildRoutes or getComponents.
    }
  }

  handleRedirect(redirectInfo) {
    var { pathname, query, state } = redirectInfo;
    this.replaceWith(pathname, query, state);
  }

  handleAbort(reason) {
    if (this.onAbort) {
      this.onAbort.call(this, reason);
    } else {
      // The best we can do here is goBack so the location state reverts
      // to what it was. However, we also set a flag so that we know not
      // to run through _updateState again since state did not change.
      //this._ignoreNextHistoryChange = true;
      //this.goBack();
    }
  }

  makeHref(pathname, query) {
    var path = this.makePath(pathname, query);
    var { history } = this;

    if (history && history.makeHref)
      return history.makeHref(path);

    return path;
  }

  transitionTo(pathname, query, state=null) {
    var { history } = this;
    history.pushState(state, this.makePath(pathname, query));
  }

  replaceWith(pathname, query, state=null) {
    var { history } = this;
    history.replaceState(state, this.makePath(pathname, query));
  }

  go(n) {
    var { history } = this;
    history.go(n);
  }

}

export default Router;
