import PropTypes from 'prop-types';
import React from 'react';

import * as routerUtils from '../../mobx/routerStore';
import toast from '../../nativeModules/toast';
import UI from './ui';

class View extends React.Component {
  static contextTypes = {
    pbx: PropTypes.object.isRequired,
  };

  state = {
    loading: true,
    books: [],
  };

  componentDidMount() {
    this.loadBooks();
  }

  render = () => (
    <UI
      loading={this.state.loading}
      books={this.state.books}
      selectBook={b =>
        routerUtils.goToContactsBrowse({
          book: b.name,
          shared: b.shared,
        })
      }
      create={() => routerUtils.goToContactsCreate()}
    />
  );

  loadBooks() {
    const { pbx } = this.context;

    this.setState({
      loading: true,
    });

    pbx
      .getPhonebooks()
      .then(this.onLoadSuccess)
      .catch(this.onLoadFailure);
  }

  onLoadSuccess = books => {
    this.setState({
      books,
      loading: false,
    });
  };

  onLoadFailure = function(err) {
    console.error(err);
    err && toast.error(err.message);
  };
}

export default View;