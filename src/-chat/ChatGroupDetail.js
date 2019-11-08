import { computed } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React from 'react';

import chatStore from '../-/chatStore';
import contactStore from '../-/contactStore';
import g from '../global';
import formatTime from '../shared/FormatTime';
import Layout from '../shared/Layout';
import { arrToMap } from '../utils/toMap';
import Message from './Message';
import m from './MiniChat';

@observer
class ChatGroupDetail extends React.Component {
  @computed get chatIds() {
    return (
      chatStore.messagesByThreadId[this.props.match.params.group] || []
    ).map(m => m.id);
  }
  @computed get chatById() {
    return arrToMap(
      chatStore.messagesByThreadId[this.props.match.params.group] || [],
      `id`,
      m => m,
    );
  }
  static contextTypes = {
    uc: PropTypes.object.isRequired,
    sip: PropTypes.object.isRequired,
  };

  state = {
    target: ``,
    loadingRecent: false,
    loadingMore: false,
    editingText: ``,
  };

  componentDidMount() {
    const noChat = !this.chatIds.length;

    if (noChat) this.loadRecent();
  }
  render() {
    const gr = chatStore.getGroup(this.props.match.params.group);
    return (
      <Layout
        header={{
          onBackBtnPress: g.goToChatsRecent,
          onCreateBtnPress: this.invite,
          onVideoCallBtnPress: this.callVideoConference,
          onVoiceCallBtnPress: this.callVoiceConference,
          title: gr?.name,
        }}
        footer={{
          actions: {
            text: this.state.editingText,
            setText: this.setEditingText,
            submitText: this.submitEditingText,
          },
          LayoutChat: true,
        }}
        isChat={{
          ref: this.setViewRef,
          onContentSizeChange: this.onContentSizeChange,
          onScroll: this.onScroll,
        }}
      >
        {this.chatIds.map((id, index) => (
          <Message
            last={index === this.chatIds.length - 1}
            hasMore={this.chatIds.length > 0 && !this.state.loadingMore}
            loadingMore={this.state.loadingMore}
            {...this.resolveChat(id, index)}
            loadMore={this.loadMore}
            acceptFile={this.acceptFile}
            rejectFile={this.rejectFile}
            showImage={this.state.showImage}
            fileType={this.state.fileType}
          />
        ))}
      </Layout>
    );
  }

  setViewRef = ref => {
    this.view = ref;
  };

  onContentSizeChange = () => {
    if (this._closeToBottom) {
      this.view.scrollToEnd({
        animated: !this._justMounted,
      });

      if (this._justMounted) {
        this._justMounted = false;
      }
    }
  };

  onScroll = ev => {
    ev = ev.nativeEvent;
    const layoutSize = ev.layoutMeasurement;
    const layoutHeight = layoutSize.height;
    const contentOffset = ev.contentOffset;
    const contentSize = ev.contentSize;
    const contentHeight = contentSize.height;
    const paddingToBottom = 20;
    this._closeToBottom =
      layoutHeight + contentOffset.y >= contentHeight - paddingToBottom;
  };

  me = this.context.uc.me();

  resolveBuddy = creator => {
    if (creator === this.me.id) return this.me;
    return contactStore.getUCUser(creator) || {};
  };

  resolveChat = (id, index) => {
    const chat = this.chatById[id];
    const prev = this.chatById[this.chatIds[index - 1]] || {};
    const mini = m.isMiniChat(chat, prev);
    const created = formatTime(chat.created);
    const text = chat.text;

    if (mini) {
      return {
        mini: true,
        created,
        text,
      };
    }

    const creator = this.resolveBuddy(chat.creator);
    const creatorName =
      !creator.name || creator.name.length === 0 ? creator.id : creator.name;

    return {
      creatorName: creatorName,
      creatorAvatar: creator.avatar,
      text,
      created,
    };
  };

  loadRecent() {
    const { uc } = this.context;

    const max = m.numberOfChatsPerLoad;

    const query = {
      max,
    };

    uc.getGroupChats(this.props.match.params.group, query)
      .then(this.onLoadRecentSuccess)
      .catch(this.onLoadRecentFailure);

    this.setState({
      loadingRecent: true,
    });
  }

  onLoadRecentSuccess = chats => {
    chatStore.pushMessages(this.props.match.params.group, chats.reverse());
    this.setState({
      loadingRecent: false,
    });
  };

  onLoadRecentFailure = err => {
    console.error(err);

    this.setState({
      loadingRecent: false,
    });

    g.showError({ message: `get recent chats` });
  };

  loadMore = () => {
    const { uc } = this.context;
    const oldestChat = this.chatById[this.chatIds[0]] || {};
    const oldestCreated = oldestChat.created || 0;
    const max = m.numberOfChatsPerLoad;
    const end = oldestCreated;

    const query = {
      max,
      end,
    };

    uc.getGroupChats(this.props.match.params.group, query)
      .then(this.onLoadMoreSuccess)
      .catch(this.onLoadMoreFailure);

    this.setState({
      loadingMore: true,
    });
  };

  onLoadMoreSuccess = chats => {
    chatStore.pushMessages(this.props.match.params.group, chats.reverse());
    this.setState({
      loadingMore: false,
    });
  };

  onLoadMoreFailure = err => {
    g.showError({ message: `get more chats` });
    console.error(err);

    this.setState({
      loadingMore: false,
    });
  };

  setEditingText = editingText => {
    this.setState({
      editingText,
    });
  };

  submitting = false;

  submitEditingText = () => {
    if (this.submitting) {
      return;
    }

    const txt = this.state.editingText.trim();

    if (!txt) {
      return;
    }

    this.submitting = true;

    this.context.uc
      .sendGroupChatText(this.props.match.params.group, txt)
      .then(this.onSubmitEditingTextSuccess)
      .catch(this.onSubmitEditingTextFailure)
      .then(() => {
        this.submitting = false;
      });
  };

  onSubmitEditingTextSuccess = chat => {
    chatStore.pushMessages(this.props.match.params.group, [chat]);

    this.setState({
      editingText: ``,
    });
  };

  onSubmitEditingTextFailure = err => {
    console.error(err);
    g.showError({ message: `send the message` });
  };

  leave = () => {
    const { uc } = this.context;
    uc.leaveChatGroup(this.props.match.params.group)
      .then(this.onLeaveSuccess)
      .catch(this.onLeaveFailure);
  };

  onLeaveSuccess = () => {
    chatStore.removeGroup(this.props.match.params.group);
    g.goToChatsRecent();
  };

  onLeaveFailure = err => {
    console.error(err);
    g.showError({ message: `leave the group` });
  };

  invite = () => {
    g.goToChatGroupInvite(this.props.match.params.group);
  };

  call = (target, bVideoEnabled) => {
    const { sip } = this.context;

    sip.createSession(target, {
      videoEnabled: bVideoEnabled,
    });
  };

  callVoiceConference = () => {
    let target = this.props.match.params.group;
    if (!target.startsWith(`uc`)) {
      target = `uc` + this.props.match.params.group;
    }
    this.call(target, false);
  };

  callVideoConference = () => {
    let target = this.props.match.params.group;
    if (!target.startsWith(`uc`)) {
      target = `uc` + this.props.match.params.group;
    }
    this.call(target, true);
  };
}

export default ChatGroupDetail;