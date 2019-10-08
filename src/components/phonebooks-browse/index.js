import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createModelView } from 'redux-model';
import createId from 'shortid';

import * as routerUtils from '../../mobx/routerStore';
import UI from './ui';

const mapGetter = getter => (state, props) => ({});
const mapAction = action => emit => ({
  showToast(message) {
    emit(action.toasts.create({ id: createId(), message }));
  },
});

class View extends Component {
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

  render() {
    return (
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
  }

  loadBooks() {
    const { pbx } = this.context;

    this.setState({ loading: true });

    pbx
      .getPhonebooks()
      .then(this.onLoadSuccess)
      .catch(this.onLoadFailure);
  }

  onLoadSuccess = books => {
    this.setState({ books, loading: false });
  };

  onLoadFailure = err => {
    console.error(err);
    return err && this.props.showToast(err.message);
  };
}

export default createModelView(mapGetter, mapAction)(View);