import React from 'react';
import { Text, TouchableOpacity as Btn, View } from 'react-native';

import { st } from './AuthPBXUI';

const UCAuth = p => (
  <View style={st.main}>
    {p.didPleonasticLogin && (
      <Text style={st.message}>UC SIGNED IN AT ANOTHER LOCATION</Text>
    )}
    {!p.didPleonasticLogin && !p.failure && (
      <Text style={st.message}>CONNECTING TO UC</Text>
    )}
    {!p.didPleonasticLogin && p.failure && (
      <Text style={st.message}>UC CONNECTION FAILED</Text>
    )}
    <View style={st.buttons}>
      {(p.didPleonasticLogin || p.failure) && (
        <Btn style={st.retry} onPress={p.retry}>
          <Text style={st.retryText}>Retry</Text>
        </Btn>
      )}
      <Btn style={st.abort} onPress={p.abort}>
        <Text style={st.abortText}>Abort</Text>
      </Btn>
    </View>
  </View>
);

export default UCAuth;