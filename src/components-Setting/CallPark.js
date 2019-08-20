import { mdiExitToApp, mdiPencil } from '@mdi/js';
import { observer } from 'mobx-react';
import {
  Body,
  Button,
  Content,
  Left,
  List,
  ListItem,
  Right,
  Text,
} from 'native-base';
import React from 'react';
import { FlatList } from 'react-native';

import SvgIcon from '../components-shared/SvgIcon';
import * as routerUtils from '../mobx/routerStore';

const Park = p => (
  <ListItem callpark>
    <Left>
      <Text>{p.name}</Text>
      <Text note>Extension:{p.extension}</Text>
    </Left>
    <Right>
      <Button>
        <SvgIcon path={mdiPencil} />
      </Button>
    </Right>
  </ListItem>
);

@observer
class CallParkComponent extends React.Component {
  render() {
    const p = this.props;
    const { profile } = p;
    console.warn(this.props);
    return (
      <Content>
        <List>
          <ListItem itemDivider>
            <Text>CALL PARK</Text>
          </ListItem>
          <FlatList
            data={profile?.parks}
            renderItem={({ item: rowData }) => {
              return <Park name={rowData} extension="" />;
            }}
          />
          <ListItem>
            <Body>
              <Button
                full
                onPress={() => routerUtils.goToNewCallPark(profile?.id)}
              >
                <Text>NEW CALL PARK</Text>
              </Button>
            </Body>
          </ListItem>
        </List>
        <Button full iconLeft danger onPress={p?.signout}>
          <SvgIcon path={mdiExitToApp} />
          <Text>LOG OUT</Text>
        </Button>
      </Content>
    );
  }
}

export default CallParkComponent;