import invariant from 'invariant';
import warning from 'warning';
import NavigationTypes from './NavigationTypes';
import { getPathname, getQueryString, parseQueryString } from './URLUtils';
import Location from './Location';

var RequiredHistorySubclassMethods = [ 'push', 'replace', 'go' ];
var StateKey = '_sessions';

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - pushState(state, path)
 * - replaceState(state, path)
 * - go(n)
 */
class History {

  constructor(options={}) {
    RequiredHistorySubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);

    this.parseQueryString = options.parseQueryString || parseQueryString;

    this.changeListeners = [];
    // TODO
    this.beforeChangeListener = (location, done) => {
      if (location == null && this.location.state.key) {
        // this makes only sense when leaving with a "push" that removes the next entries
        //this.trimSession(this.location.state.key);
        return;
      }
      done();
    };

    this.path = null;
    this.location = null;
    this._pendingLocation = null;
    this._actualLocation = null;

    // TODO
    this.state = {};
    this.sessions = [];
  }
  readState(key) {
    return this.state[key];
  }
  saveState(key, state) {
    this.state[key] = state;
  }

  findInSessions(key) {
    for (var i = 0; i < this.sessions.length; i++) {
      var session = this.sessions[i];
      for (var j = 0; j < session.length; j++) {
        if (session[j] === key) {
          return {
            current: j,
            length: session.length
          };
        }
      }
    }
  }

  trimSession(lastKey) {
    for (var i = 0; i < this.sessions.length; i++) {
      var session = this.sessions[i];
      for (var j = 0; j < session.length; j++) {
        if (session[j] === lastKey) {
          this.sessions[i] = session.slice(0, j + 1);
          this.saveState(StateKey, this.sessions);
          return;
        }
      }
    }
  }

  createSession(key) {
    this.sessions.push([key]);
    this.saveState(StateKey, this.sessions);

    return {
      current: 0,
      length: 1
    };
  }

  replaceInSession(oldKey, newKey) {
    for (var i = 0; i < this.sessions.length; i++) {
      var session = this.sessions[i];
      for (var j = 0; j < session.length; j++) {
        if (session[j] === oldKey) {
          session[j] = newKey;

          this.saveState(StateKey, this.sessions);

          return {
            current: j,
            length: session.length
          };
        }
      }
    }
  }

  pushInSession(oldKey, newKey) {
    for (var i = 0; i < this.sessions.length; i++) {
      var session = this.sessions[i];
      for (var j = 0; j < session.length; j++) {
        if (session[j] === oldKey) {
          this.sessions[i] = this.sessions[i].slice(0, j + 1).concat([newKey]);

          this.saveState(StateKey, this.sessions);

          return {
            current: j + 1,
            length: this.sessions[i].length
          };
        }
      }
    }
  }

  _notifyChange() {
    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this);
  }

  addChangeListener(listener) {
    this.changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    this.changeListeners = this.changeListeners.filter(function (li) {
      return li !== listener;
    });
  }

  onBeforeChange(listener) {
    warning(
      this.beforeChangeListener != null,
      'beforeChange listener of History should not be overwritten'
    );

    // TODO
    this.beforeChangeListener = (location, done) => {
      if (location == null && this.location.state.key) {
        this.trimSession(this.location.state.key);
      }

      listener.call(this, location, done);
    };
  }

  setup(path, entry = {}) {
    if (this.location)
      return;

    if (!entry.key)
      entry = this.replace(path, this.createRandomKey());

    this.sessions = this.readState(StateKey) || [];

    var state = null;
    if (entry.key) {
      state = this.readState(entry.key);
      var session = this.findInSessions(entry.key) || this.createSession(entry.key);
      Object.assign(entry, session);
    }

    var location = this._createLocation(path, state, entry, NavigationTypes.POP);
    this._update(path, location, false);
  }

  teardown() {
    this.changeListeners = [];
    this.beforeChangeListener = null;

    this.path = null;
    this.location = null;
    this._pendingLocation = null;
  }

  handlePop(path, entry={}) {
    var state = null;
    if (entry.key) {
      state = this.readState(entry.key);
      var session = this.findInSessions(entry.key);
      Object.assign(entry, session);
    }

    var pendingLocation = this._createLocation(path, state, entry, NavigationTypes.POP);
    this._actualLocation = location;

    this.beforeChange(pendingLocation, () => {
      this._update(path, pendingLocation);
    });
  }

  createRandomKey() {
    return Math.random().toString(36).substr(2);
  }

  _saveNewState(state) {
    var key = this.createRandomKey();

    if (state != null)
      this.saveState(key, state);

    return key;
  }

  canUpdateState() {
    return this.location
      && this.location.state
      && this.location.state.key;
  }

  updateState(extraState) {
    invariant(
      this.canUpdateState(),
      '%s is unable to update state right now',
      this.constructor.name
    );

    var key = this.location.state.key;
    var state = this.readState(key);
    this.saveState(key, { ...state, ...extraState });
  }

  beforeChange(location, done) {
    if (!this.beforeChangeListener) {
      done();
      return;
    }

    this._pendingLocation = location;

    this.beforeChangeListener.call(this, location, () => {
      if (this._pendingLocation === location) {
        this._pendingLocation = null;
        done();
        return true;
      }
      return false;
    });
  }

  isPending(location) {
    return this._pendingLocation === location;
  }

  pushState(state, path) {
    var pendingLocation = this._createLocation(path, state, null, NavigationTypes.PUSH);
    this.beforeChange(pendingLocation, () => {
      this._doPushState(state, path)
    });
  }

  _doPushState(state, path) {
    var key = this._saveNewState(state);
    var entry = null;

    var replace = (this.path === path);
    if (replace) {
      entry = this.replace(path, key) || {};
    } else {
      entry = this.push(path, key) || {};
    }

    warning(
      entry.key || state == null,
      '%s does not support storing state',
      this.constructor.name
    );

    if (entry.key && this.location.state.key) {
      var session = null;
      if (replace) {
        session = this.replaceInSession(this.location.state.key, entry.key);
      } else {
        session = this.pushInSession(this.location.state.key, entry.key);
      }
      Object.assign(entry, session);
    }

    var location = this._createLocation(path, state, entry, NavigationTypes.PUSH);
    this._update(path, location);
  }

  replaceState(state, path) {
    var pendingLocation = this._createLocation(path, state, null, NavigationTypes.REPLACE);
    this.beforeChange(pendingLocation, () => {
      this._doReplaceState(state, path);
    });
  }

  _doReplaceState(state, path) {
    var key = this._saveNewState(state);
    var entry = this.replace(path, key) || {};

    warning(
      entry.key || state == null,
      '%s does not support storing state',
      this.constructor.name
    );

    if (entry.key && this.location.state.key) {
      var session = this.replaceInSession(this.location.state.key, entry.key);
      Object.assign(entry, session);
    }

    var location = this._createLocation(path, state, entry, NavigationTypes.REPLACE);
    this._update(path, location);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  _update(path, location, notify=true) {
    this.path = path;
    this.location = location;
    this._actualLocation = location;
    this._pendingLocation = null;

    if (notify)
      this._notifyChange();
  }

  _createLocation(path, state, entry, navigationType) {
    var pathname = getPathname(path);
    var queryString = getQueryString(path);
    var query = queryString ? this.parseQueryString(queryString) : null;
    return new Location(pathname, query, {...state, ...entry}, navigationType);
  }

}

export default History;
