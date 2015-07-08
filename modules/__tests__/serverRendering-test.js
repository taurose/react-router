import expect from 'expect';
import React, { createClass, renderToString } from 'react';
import Location from '../Location';
import Router from '../Router';
import StaticRouter from '../StaticRouter';
import RouteRenderer from '../RouteRenderer';
import Link from '../Link';

describe('Server rendering', function () {
  var Dashboard, Inbox, DashboardRoute, InboxRoute, RedirectToInboxRoute, routes;
  beforeEach(function () {
    Dashboard = createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
            {this.props.children}
          </div>
        );
      }
    });
 
    Inbox = createClass({
      render() {
        return <div>Inbox <Link to="/">Go to the dashboard</Link></div>;
      }
    });
 
    DashboardRoute = {
      component: Dashboard,
      getChildRoutes(locationState, callback) {
        setTimeout(function () {
          callback(null, [ InboxRoute, RedirectToInboxRoute ]);
        }, 0);
      }
    };

    InboxRoute = {
      path: 'inbox',
      component: Inbox
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, transition) {
        transition.to('/inbox');
      }
    };
 
    routes = [
      DashboardRoute
    ];
  });
  
  it('works', function (done) {
    var location = new Location('/inbox');
    var router = new StaticRouter(routes);

    router.getProps(location, (error, state, transition) => {
      var string = renderToString(<RouteRenderer {...state} router={router} />);
      expect(string).toMatch(/Dashboard/);
      expect(string).toMatch(/Inbox/);
      done();
    });

  });

});
