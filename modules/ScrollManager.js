import { canUseDOM, setWindowScrollPosition } from './DOMUtils';
import NavigationTypes from './NavigationTypes';


function getCommonAncestors(branch, otherBranch) {
  return branch.filter(route => otherBranch.indexOf(route) !== -1);
}

function shouldUpdate(state, prevState) {
  var { location, branch } = state;
  var { location: prevLocation, branch: prevBranch } = prevState;

  // When an onEnter hook uses transition.to to redirect
  // on the initial load prevLocation is null, so assume
  // we don't want to update the scroll position.
  if (prevLocation === null)
    return false;

  // Don't update scroll position if only the query has changed.
  if (location.pathname === prevLocation.pathname)
    return false;

  // Don't update scroll position if any of the ancestors
  // has `ignoreScrollPosition` set to `true` on the route.
  var sharedAncestors = getCommonAncestors(branch, prevBranch);
  if (sharedAncestors.some(route => route.ignoreScrollBehavior))
    return false;

  return true;
}

function updateWindowScrollPosition(navigationType, scrollX, scrollY) {
  if (canUseDOM) {
    if (navigationType === NavigationTypes.POP) {
      setWindowScrollPosition(scrollX, scrollY);
    } else {
      setWindowScrollPosition(0, 0);
    }
  }
}

class ScrollManager {

  constructor(shouldUpdateScrollPosition=shouldUpdate, updateScrollPosition=updateWindowScrollPosition){
    this.shouldUpdate = shouldUpdateScrollPosition;
    this.update = updateScrollPosition;
  }

  restore(state, prevState) {
    var { location } = state;
    var locationState = location && location.state;

    if (locationState && this.shouldUpdate(state, prevState)) {
      var { scrollX, scrollY } = locationState;
      this.update(location.navigationType, scrollX || 0, scrollY || 0);
    }
  }

}

export default ScrollManager;
