'use strict'

import * as constants from './constants.js'

const initialState = {
  mode: constants.MODE_NAVIGATION,  // The initial mode of the app.
  domain: '',                       // Current domain.
  safe: true,                       // whether the connection is safe or not.
  loading: false,                   // whether webview is loading.
  url: '',                          // the current URL of the webview.
  input: '',                        // the current command input value.
  results: [],                      // Resuts shown in the result list.
  history: {}                       // Navigation history.
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {

    case constants.ACTION_NAVIGATION_STATE:
      let navState = action.payload.navState;
      let url = parseURL(navState.url);
      var history = state.history;

      if (!navState.loading &&
        !navState.navigationType) {
        history[url.domain] = history[url.domain] || {
          hit: 0,
          pathes: {}
        };
        history[url.domain].hit += 1;

        history[url.domain].pathes[url.path] =
          history[url.domain].pathes[url.path] || {
            hit: 0,
            title: ''
          };
        history[url.domain].pathes[url.path].hit += 1;
        history[url.domain].pathes[url.path].title = navState.title || '';
      }

      return {
        ...state,
        loading: navState.loading,
        domain: url.domain,
        history: history,
        url: navState.url,
      };

    case constants.ACTION_COMMAND_SHOW:
      let results = computeResults('')

      return {
        ...state,
        results: computeResults(''),
        mode: constants.MODE_COMMAND,
      };

    case constants.ACTION_COMMAND_INPUT:
      return {
        ...state,
        input: action.payload.input,
        results: computeResults(action.payload.input),
      };

    case constants.ACTION_COMMAND_SELECT:
      const idx = action.payload.index;
      if (idx < state.results.length) {
        return {
          ...state,
          results: [],
          input: '',
          url: state.results[idx].target,
          mode: constants.MODE_NAVIGATION,
        };
      } else {
        return {
          ...state,
          results: [],
          input: '',
          mode: constants.MODE_NAVIGATION,
        };
      }

    default:
      return state;
  }
}

const inputURLRegexp =
  /^(https?:\/\/)?([-a-zA-Z0-9@%._\+~#=]{2,512}\.([a-z]{2,4}))\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/

// computeResults recomputes the results to show in COMMAND mode based on the
// current input value.
const computeResults = (input) => {
  let results = [];
  input = input.trim();

  let url = inputURLRegexp.exec(input);
  // TODO check against a list of TLDs
  if (url != null) {
    results.push({
      type: constants.RESULT_TYPE_URL,
      target: (url[1] ? '' : 'http://') + url[0],
      url: url[0],
      title: '',
    });
  }

  if (input.length > 0) {
    const searchURL = 'https://www.google.com/search?&ie=UTF-8&q=' +
      encodeURIComponent(input)
    results.push({
      type: constants.RESULT_TYPE_SEARCH,
      target: searchURL,
      url: '',
      title: input,
    })
  }

  return results;
}

// parseURL parses an URL into an object with domain, scheme and path.
const parseURL = (url) => {
  var domain;
  var scheme;
  var path;

  if (url.indexOf("://") > -1) {
    var sp = url.split('/');
    domain = sp[2];
    scheme = sp[0];
    if (sp.length > 3) {
      path =  '/' + url.substr(scheme.length + 3 + domain.length)
    } else {
      path = '/';
    }
  } else {
    var sp = url.split('/');
    scheme = 'http';
    domain = sp[0];
    if (sp.length > 1) {
      path =  '/' + url.substr(domain.length)
    } else {
      path = '/';
    }
  }

  return {
    domain: domain,
    scheme: scheme,
    path: path
  };
}

