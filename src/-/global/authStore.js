import debounce from 'lodash/debounce';
import { computed, observable } from 'mobx';

import { intlDebug } from '../intl/intl';
import { getUrlParams } from '../native/deeplink';
import { AppState } from '../Rn';
import { arrToMap } from '../utils/toMap';
import g from './_';
import BaseStore from './BaseStore';
import callStore from './callStore';
import chatStore from './chatStore';
import contactStore from './contactStore';

const compareField = (p1, p2, field) => {
  const v1 = p1[field];
  const v2 = p2[field];
  return !v1 || !v2 || v1 === v2;
};
const compareProfile = (p1, p2) => {
  return (
    p1.pbxUsername && // Must have pbxUsername
    compareField(p1, p2, 'pbxUsername') &&
    compareField(p1, p2, 'pbxTenant') &&
    compareField(p1, p2, 'pbxHostname') &&
    compareField(p1, p2, 'pbxPort')
  );
};

const connectingOrFailure = ['connecting', 'failure'];

class AuthStore extends BaseStore {
  // 'stopped'
  // 'connecting'
  // 'success'
  // 'failure'
  @observable pbxState = 'stopped';
  @observable sipState = 'stopped';
  @observable ucState = 'stopped';
  @observable ucLoginFromAnotherPlace = false;
  @computed get pbxShouldAuth() {
    return !(!this.signedInId || this.pbxState !== 'stopped');
  }
  @computed get pbxConnectingOrFailure() {
    return connectingOrFailure.some(s => s === this.pbxState);
  }
  @computed get sipShouldAuth() {
    return !(this.pbxState !== 'success' || this.sipState !== 'stopped');
  }
  @computed get sipConnectingOrFailure() {
    return connectingOrFailure.some(s => s === this.sipState);
  }
  @computed get ucShouldAuth() {
    return !(
      !this.currentProfile?.ucEnabled ||
      this.ucState !== 'stopped' ||
      this.ucLoginFromAnotherPlace ||
      this.isSignInByNotification
    );
  }
  @computed get ucConnectingOrFailure() {
    return (
      this.currentProfile?.ucEnabled &&
      connectingOrFailure.some(s => s === this.ucState)
    );
  }
  @computed get shouldShowConnStatus() {
    return (
      this.pbxConnectingOrFailure ||
      this.sipConnectingOrFailure ||
      this.ucConnectingOrFailure
    );
  }
  @computed get isConnFailure() {
    return [
      this.pbxState,
      this.sipState,
      this.currentProfile?.ucEnabled && this.ucState,
    ].some(s => s === 'failure');
  }

  findProfile = _p => {
    return g.profiles.find(p => compareProfile(p, _p));
  };
  pushRecentCall = call => {
    const recentCalls = [call, ...(this.currentProfile.recentCalls || [])];
    if (recentCalls.length > 20) {
      recentCalls.pop();
    }
    g.upsertProfile({
      id: this.signedInId,
      recentCalls,
    });
  };
  //
  @computed get _profilesMap() {
    return arrToMap(g.profiles, 'id', p => p);
  }
  getProfile = id => {
    return this._profilesMap[id];
  };

  @observable signedInId = null;
  @computed get currentProfile() {
    return this.getProfile(this.signedInId);
  }
  signIn = id => {
    const p = this.getProfile(id);
    if (!p) {
      return false;
    }
    if (!p.pbxPassword && !p.accessToken) {
      g.goToPageProfileUpdate(p.id);
      g.showError({
        message: intlDebug`The account password is empty`,
      });
      return true;
    }
    if (p.ucEnabled && (!p.ucHostname || !p.ucPort)) {
      g.goToPageProfileUpdate(p.id);
      g.showError({
        message: intlDebug`The UC config is missing`,
      });
      return true;
    }
    this.set('signedInId', p.id);
    return true;
  };

  signOut = () => {
    const clearStore = () => {
      chatStore.clearStore();
      contactStore.clearStore();
      this.set('signedInId', null);
    };
    callStore._calls.forEach(c => c.hangupWithUnhold());
    if (callStore._calls.length > 0) {
      const intervalStartedAt = Date.now();
      const id = setInterval(() => {
        // TODO show/hide loader
        if (!callStore._calls.length || Date.now() > intervalStartedAt + 2000) {
          clearInterval(id);
          clearStore();
        }
      }, 100);
    } else {
      clearStore();
    }
  };

  handleUrlParams = async () => {
    await g.profilesLoaded;
    const urlParams = await getUrlParams();
    if (!urlParams) {
      return;
    }
    //
    const { _wn, host, phone_idx, port, tenant, user } = urlParams;
    if (!tenant || !user) {
      return;
    }
    //
    const p = this.findProfile({
      pbxUsername: user,
      pbxTenant: tenant,
      pbxHostname: host,
      pbxPort: port,
    });
    const pbxPhoneIndex = `${parseInt(phone_idx) || 4}`;
    //
    if (p) {
      if (_wn) {
        p.accessToken = _wn;
      }
      if (!p.pbxHostname) {
        p.pbxHostname = host;
      }
      if (!p.pbxPort) {
        p.pbxPort = port;
      }
      p.pbxPhoneIndex = pbxPhoneIndex;
      //
      g.upsertProfile(p);
      if (p.pbxPassword || p.accessToken) {
        this.signIn(p.id);
      } else {
        g.goToPageProfileUpdate(p.id);
      }
      return;
    }
    //
    const newP = {
      ...g.genEmptyProfile(),
      pbxTenant: tenant,
      pbxUsername: user,
      pbxHostname: host,
      pbxPort: port,
      pbxPhoneIndex,
      accessToken: _wn,
    };
    //
    g.upsertProfile(newP);
    if (newP.accessToken) {
      this.signIn(newP.id);
    } else {
      g.goToPageProfileUpdate(newP.id);
    }
  };

  @observable isSignInByNotification = false;
  clearSignInByNotification = debounce(
    () => {
      // clearSignInByNotification will activate UC login
      // We will only allow UC login when the app is active
      if (AppState.currentState !== 'active') {
        setTimeout(this.clearSignInByNotification, 17);
      } else {
        this.isSignInByNotification = false;
      }
    },
    10000,
    {
      maxWait: 15000,
    },
  );

  signInByNotification = async n => {
    const state = AppState.currentState;
    await g.profilesLoaded;
    // Find account for the notification target
    const p = this.findProfile({
      ...n,
      pbxUsername: n.to,
      pbxTenant: n.tenant,
    });
    if (!p?.id || !p.pushNotificationEnabled) {
      return false;
    }
    // Use isSignInByNotification to disable UC auto sign in for a while
    if (n.isCall) {
      this.isSignInByNotification = true;
      this.clearSignInByNotification();
    }
    // In case the app is already signed in
    if (this.signedInId) {
      // Always show notification if the signed in id is another account
      if (this.signedInId !== p.id) {
        return true;
      }
      // Attempt to reconnect on notification if state is currently failure
      ['pbxState', 'sipState', 'ucState'].forEach(k => {
        if (this[k] === 'failure') {
          this[k] = 'stopped';
        }
      });
      return state !== 'active';
    }
    // Call signIn
    return this.signIn(p?.id);
  };

  // id
  // name
  // language
  // phones[]
  //   id
  //   type
  userExtensionProperties = null;
}

const authStore = new AuthStore();

export { compareProfile };
export default authStore;