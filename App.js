import React from 'react';
import { View, Text } from 'react-native';
import DraggbleList from './DragableList';
export default function App() {
  const initialState = Array.from(Array(5), (i, index) => index);
  const [data, setStateForNewFlatListData] = React.useState(initialState);
  function keyExtractor(item, index) {
    return index.toString();
  }

  function renderItem({ item, index }, noPanResponder = false) {
    return (
      <View
        style={{
          padding: 16,
          flexDirection: 'row',
        }}>
        <Text style={{ fontSize: 28 }}>@</Text>
        <Text style={{ fontSize: 22, textAlign: 'center', flex: 1 }}>
          {item}
        </Text>
      </View>
    );
  }

  return (
    <DraggbleList
      {...{ data, renderItem, setStateForNewFlatListData, keyExtractor }}
    />
  );
}
