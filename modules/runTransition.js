import Transition from './Transition';
import { getState, getTransitionHooks, getComponents, getRouteParams, createTransitionHook } from './RoutingUtils';
import { loopAsync } from './AsyncUtils';

export default function runTransition(transition, routes, hooks, context, prevState, location, callback) {
  getState(routes, location, function (error, nextState) {
    if (error || nextState == null || transition.isCancelled) {
      callback(error, null);
    } else {
      nextState.location = location;

      var transitionHooks = getTransitionHooks(prevState, nextState);
      if (Array.isArray(hooks)) {
        hooks = hooks.map(hook => createTransitionHook(hook, context));
        transitionHooks.unshift.apply(transitionHooks, hooks);
      }

      loopAsync(transitionHooks.length, (index, next, done) => {
        transitionHooks[index](nextState, transition, (error) => {
          if (error || transition.isCancelled) {
            done(error); // No need to continue.
          } else {
            next();
          }
        });
      }, function (error) {
        if (error || transition.isCancelled) {
          callback(error, null);
        } else {
          getComponents(nextState.branch, function (error, components) {
            if (error || transition.isCancelled) {
              callback(error, null);
            } else {
              nextState.components = components;
              callback(null, nextState);
            }
          });
        }
      });
    }
  });
}