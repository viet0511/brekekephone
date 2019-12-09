import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React from 'react';
import { Platform } from 'react-native';
import createId from 'shortid';

import pbx from '../api/pbx';
import sip from '../api/sip';
import uc from '../api/uc';
import g from '../global';
import authStore from '../global/authStore';
import callStore from '../global/callStore';
import chatStore from '../global/chatStore';
import contactStore from '../global/contactStore';
import PushNotification from '../native/PushNotification';
import { setApiProvider } from './getApiProvider';

@observer
class ApiProvider extends React.Component {
  static childContextTypes = {
    pbx: PropTypes.object.isRequired,
    sip: PropTypes.object.isRequired,
    uc: PropTypes.object.isRequired,
  };

  getChildContext() {
    return {
      pbx,
      sip,
      uc,
    };
  }

  componentDidMount() {
    setApiProvider(this);
    pbx.on(`connection-started`, this.onPBXConnectionStarted);
    pbx.on(`connection-stopped`, this.onPBXConnectionStopped);
    pbx.on(`connection-timeout`, this.onPBXConnectionTimeout);
    pbx.on(`park-started`, this.onPBXParkStarted);
    pbx.on(`park-stopped`, this.onPBXParkStopped);
    pbx.on(`user-calling`, this.onPBXUserCalling);
    pbx.on(`user-ringing`, this.onPBXUserRinging);
    pbx.on(`user-talking`, this.onPBXUserTalking);
    pbx.on(`user-holding`, this.onPBXUserHolding);
    pbx.on(`user-hanging`, this.onPBXUserHanging);
    pbx.on(`voicemail-updated`, this.onVoiceMailUpdated);
    sip.on(`connection-started`, this.onSIPConnectionStarted);
    sip.on(`connection-stopped`, this.onSIPConnectionStopped);
    sip.on(`connection-timeout`, this.onSIPConnectionTimeout);
    sip.on(`session-started`, this.onSIPSessionStarted);
    sip.on(`session-updated`, this.onSIPSessionUpdated);
    sip.on(`session-stopped`, this.onSIPSessionStopped);
    sip.on(`video-session-created`, this.onSIPVideoSessionCreated);
    sip.on(`video-session-updated`, this.onSIPVideoSessionUpdated);
    sip.on(`video-session-ended`, this.onSIPVideoSessionEnded);
    uc.on(`connection-stopped`, this.onUCConnectionStopped);
    uc.on(`user-updated`, this.onUCUserUpdated);
    uc.on(`buddy-chat-created`, this.onBuddyChatCreated);
    uc.on(`group-chat-created`, this.onGroupChatCreated);
    uc.on(`chat-group-invited`, this.onChatGroupInvited);
    uc.on(`chat-group-revoked`, this.onChatGroupRevoked);
    uc.on(`chat-group-updated`, this.onChatGroupUpdated);
    uc.on(`file-received`, this.onFileReceived);
    uc.on(`file-progress`, this.onFileProgress);
    uc.on(`file-finished`, this.onFileFinished);
  }

  componentWillUnmount() {
    setApiProvider(null);
    pbx.off(`connection-started`, this.onPBXConnectionStarted);
    pbx.off(`connection-stopped`, this.onPBXConnectionStopped);
    pbx.off(`connection-timeout`, this.onPBXConnectionTimeout);
    pbx.off(`park-started`, this.onPBXParkStarted);
    pbx.off(`park-stopped`, this.onPBXParkStopped);
    pbx.off(`user-calling`, this.onPBXUserCalling);
    pbx.off(`user-ringing`, this.onPBXUserRinging);
    pbx.off(`user-talking`, this.onPBXUserTalking);
    pbx.off(`user-holding`, this.onPBXUserHolding);
    pbx.off(`user-hanging`, this.onPBXUserHanging);
    pbx.off(`voicemail-updated`, this.onVoiceMailUpdated);
    sip.off(`connection-started`, this.onSIPConnectionStarted);
    sip.off(`connection-stopped`, this.onSIPConnectionStopped);
    sip.off(`connection-timeout`, this.onSIPConnectionTimeout);
    sip.off(`session-started`, this.onSIPSessionStarted);
    sip.off(`session-updated`, this.onSIPSessionUpdated);
    sip.off(`session-stopped`, this.onSIPSessionStopped);
    sip.off(`video-session-created`, this.onSIPVideoSessionCreated);
    sip.off(`video-session-updated`, this.onSIPVideoSessionUpdated);
    sip.off(`video-session-ended`, this.onSIPVideoSessionEnded);
    uc.off(`connection-stopped`, this.onUCConnectionStopped);
    uc.off(`connection-timeout`, this.onUCConnectionTimeout);
    uc.off(`user-updated`, this.onUCUserUpdated);
    uc.off(`buddy-chat-created`, this.onBuddyChatCreated);
    uc.off(`group-chat-created`, this.onGroupChatCreated);
    uc.off(`chat-group-invited`, this.onChatGroupInvited);
    uc.off(`chat-group-revoked`, this.onChatGroupRevoked);
    uc.off(`chat-group-updated`, this.onChatGroupUpdated);
    uc.off(`file-received`, this.onFileReceived);
    uc.off(`file-progress`, this.onFileProgress);
    uc.off(`file-finished`, this.onFileFinished);
  }

  pbxAndSipStarted = 0;

  onPBXAndSipStarted = async () => {
    try {
      await this._onPBXAndSipStarted();
    } catch (err) {
      console.error(`onPBXAndSipStarted`, err);
    }
  };

  _onPBXAndSipStarted = async () => {
    if (this.pbxAndSipStarted < 1) {
      this.pbxAndSipStarted += 1;
      return;
    }

    this.pbxAndSipStarted = 0;
    const webPhone = await this.updatePhoneIndex();

    if (!webPhone) {
      return;
    }

    this.addPnToken(webPhone);
  };

  updatePhoneIndex = async () => {
    try {
      return await this._updatePhoneIndex();
    } catch (err) {
      console.error(`updatePhoneIndex`, err);
      g.goToPageProfileSignIn();
      return null;
    }
  };

  _updatePhoneIndex = async () => {
    //
    const phoneIndex = parseInt(authStore.currentProfile.pbxPhoneIndex) || 4;
    const extProps = authStore.userExtensionProperties;
    const phone = extProps.phones[phoneIndex - 1];
    const phoneTypeCorrect = phone.type === `Web Phone`;
    const { pbxTenant, pbxUsername } = authStore.currentProfile;
    const expectedPhoneId = `${pbxTenant}_${pbxUsername}_phone${phoneIndex}_webphone`;
    const phoneIdCorrect = phone.id === expectedPhoneId;
    //
    const setExtensionProperties = async () => {
      await pbx.pal(`setExtensionProperties`, {
        tenant: pbxTenant,
        extension: pbxUsername,
        properties: {
          // See ./pbx getExtensionProperties for the detail of parameters
          pnumber: extProps.phones.map(p => p.id).join(`,`),
          [`p${phoneIndex}_ptype`]: phone.type,
        },
      });
      authStore.userExtensionProperties = extProps;
    };
    //
    if (phoneTypeCorrect && phoneIdCorrect) {
      // Do nothing
    } else if (phoneTypeCorrect && !phoneIdCorrect) {
      phone.id = expectedPhoneId;
      await setExtensionProperties();
    } else if (!phoneTypeCorrect && !phoneIdCorrect) {
      phone.id = expectedPhoneId;
      phone.type = `Web Phone`;
      await setExtensionProperties();
    } else {
      return new Promise(resolve => {
        g.showPrompt({
          title: `Warning`,
          message: `This phone index is already in use. Do you want to continue?`,
          onConfirm: () => {
            phone.type = `Web Phone`;
            setExtensionProperties()
              .then(() => {
                resolve(phone);
              })
              .catch(err => {
                console.error(`setExtensionProperties`, err);
                resolve(null);
              });
          },
          onDismiss: () => {
            g.goToPageProfileSignIn();
            resolve(null);
          },
        });
      });
    }
    return phone;
  };
  addPnToken = async phone => {
    const t = await PushNotification.getToken();

    if (!t) {
      return;
    }

    if (Platform.OS === `ios`) {
      await pbx.addApnsToken({
        username: phone.id,
        device_id: t,
      });
    } else if (Platform.OS === `android`) {
      await pbx.addFcmPnToken({
        username: phone.id,
        device_id: t,
      });
    } else if (Platform.OS === `web`) {
      await pbx.addWebPnToken({
        user: phone.id,
        endpoint: t.endpoint,
        auth_secret: t.auth,
        key: t.p256dh,
      });
    }
  };

  onPBXConnectionStarted = () => {
    this.loadPBXUsers().catch(err => {
      g.showError({ message: `load PBX users` });
      console.error(err);
    });

    setTimeout(this.onPBXAndSipStarted, 170);
  };

  onPBXConnectionStopped = () => {
    authStore.set(`pbxState`, `stopped`);
  };

  onPBXConnectionTimeout = () => {
    authStore.set(`pbxState`, `failure`);
  };

  loadPBXUsers = async () => {
    if (!authStore.currentProfile) {
      return;
    }
    const tenant = authStore.currentProfile.pbxTenant;
    const username = authStore.currentProfile.pbxUsername;
    const userIds = await pbx
      .getUsers(tenant)
      .then(ids => ids.filter(id => id !== username));
    const users = await pbx.getOtherUsers(tenant, userIds);
    contactStore.set(`pbxUsers`, users);
  };

  onPBXUserCalling = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, `calling`);
  };
  onPBXUserRinging = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, `ringing`);
  };
  onPBXUserTalking = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, `talking`);
  };
  onPBXUserHolding = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, `holding`);
  };
  onPBXUserHanging = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, ``);
  };

  onVoiceMailUpdated = ev => {
    callStore.set(`voicemail`, ev);
  };

  onPBXParkStarted = park => {
    callStore.upsertRunning({
      id: park,
      parking: true,
    });
  };
  onPBXParkStopped = park => {
    callStore.upsertRunning({
      id: park,
      parking: false,
    });
  };

  onSIPConnectionStarted = () => {
    authStore.set(`sipState`, `success`);
    setTimeout(this.onPBXAndSipStarted, 170);
  };

  onSIPConnectionStopped = () => {
    authStore.set(`sipState`, `stopped`);
  };

  onSIPConnectionTimeout = () => {
    authStore.set(`sipState`, `failure`);
  };

  onSIPSessionStarted = call => {
    const number = call.partyNumber;

    if (number === `8`) {
      call.partyName = `Voicemails`;
    }

    if (!call.partyName) {
      const pbxUser = contactStore.getPBXUser(number);
      call.partyName = pbxUser ? pbxUser.name : `Unnamed`;
    }

    callStore.upsertRunning(call);
  };

  onSIPSessionUpdated = call => {
    callStore.upsertRunning(call);
  };

  onSIPSessionStopped = id => {
    const call = callStore.getRunningCall(id);
    const time = new Date();
    authStore.pushRecentCall({
      id: createId(),
      incoming: call.incoming,
      answered: call.answered,
      partyName: call.partyName,
      partyNumber: call.partyNumber,
      created: `${time.getHours()}:${time.getMinutes()}`,
    });
    callStore.removeRunning(call.id);
  };

  onUCConnectionStopped = () => {
    authStore.set(`ucState`, `stopped`);
  };

  onUCConnectionTimeout = () => {
    authStore.set(`ucState`, `failure`);
  };

  onUCUserUpdated = ev => {
    contactStore.updateUCUser(ev);
  };

  onBuddyChatCreated = chat => {
    chatStore.pushMessages(chat.creator, chat);
  };
  onGroupChatCreated = chat => {
    chat.isGroup = true;
    chatStore.pushMessages(chat.group, chat);
  };

  onChatGroupInvited = group => {
    chatStore.upsertGroup(group);
  };
  onChatGroupUpdated = group => {
    chatStore.upsertGroup(group);
  };
  onChatGroupRevoked = group => {
    chatStore.removeGroup(group.id);
  };

  onFileReceived = file => {
    chatStore.upsertFile(file);
  };
  onFileProgress = file => {
    chatStore.upsertFile(file);
  };
  onFileFinished = file => {
    chatStore.upsertFile(file);
  };

  onSIPVideoSessionCreated = ev => {
    callStore.upsertRunning(ev);
  };

  onSIPVideoSessionUpdated = ev => {
    callStore.upsertRunning(ev);
  };

  onSIPVideoSessionEnded = ev => {
    callStore.removeRunning(ev);
  };

  render() {
    return this.props.children;
  }
}

export default ApiProvider;
