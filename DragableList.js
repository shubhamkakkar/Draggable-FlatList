import React, { createRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PanResponder,
  PanResponderInstance,
  Animated,
  SafeAreaView,
} from 'react-native';

import { immutableMove } from './utilityFunctions';

export default class App extends React.Component {
  state = {
    dragging: false,
    draggingIdx: -1,
  };

  // _panResponder: PanResponderInstance;
  point = new Animated.ValueXY();
  flatListOpacity = new Animated.Value(1)
  draggerOpacity = new Animated.Value(0)
  currentY = 0;
  scrollOffset = 0;
  flatlistTopOffset = 0;
  rowHeight = 0;
  currentIdx = -1;
  active = false;
  flatList = createRef();
  flatListHeight = 0;

  constructor(props) {
    super(props);
    this.animateList = this.animateList.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.yToIndex = this.yToIndex.bind(this);
    this.reset = this.reset.bind(this);
    this.renderAnimatedItem = this.renderAnimatedItem.bind(this);

    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        this.currentIdx = this.yToIndex(gestureState.y0);
        this.currentY = gestureState.y0;
        Animated.event([{ y: this.point.y }])({
          y: gestureState.y0 - this.rowHeight / 2,
        });
        this.active = true;
        Animated.parallel([
          Animated.timing(this.flatListOpacity, {
            toValue: 0.5,
            useNativeDriver: true
          }),
          Animated.timing(this.draggerOpacity, {
            toValue: 1,
            useNativeDriver: true
          })
        ]).start()
        this.setState({ dragging: true, draggingIdx: this.currentIdx }, () => {
          this.animateList();
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        Animated.event([{ y: this.point.y }])({ y: gestureState.moveY });
        this.currentY = gestureState.moveY;
      },
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderRelease: (evt, gestureState) => {
        this.reset();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        this.reset();
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
  }

  animateList() {



    if (!this.active) {
      return;
    }
    requestAnimationFrame(() => {
      if (this.currentY + 100 > this.flatListHeight) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset + 20,
          animated: true,
        });
      } else if (this.currentY < 100) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset - 20,
          animated: false,
        });
      }

      const newIdx = this.yToIndex(this.currentY);
      if (this.currentIdx !== newIdx) {
        const updatedFlatListData = immutableMove(
          this.props.data,
          this.currentIdx,
          newIdx
        );

        this.setState({
          draggingIdx: newIdx,
        });
        this.props.setStateForNewFlatListData(updatedFlatListData);
        this.currentIdx = newIdx;
      }
      this.animateList();
    });
  }

  yToIndex(y) {
    const value = Math.floor(
      (this.scrollOffset + y - this.flatlistTopOffset) / this.rowHeight
    );


    if (value < 0) {
      return 0;
    }
    if (value > this.props.data.length - 1) {
      return this.props.data.length - 1;
    }
    return value;
  }

  reset() {
    this.active = false;
    this.setState({ dragging: false, draggingIdx: -1 }, () => {
      Animated.parallel([
        Animated.timing(this.flatListOpacity, {
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(this.draggerOpacity, {
          toValue: 0,
          useNativeDriver: true
        })
      ]).start()
    });
  }

  renderItem({ item, index }, noPanResponder = false) {
    const RenderItem = this.props.renderItem;
    const draggingIdx = this.state.draggingIdx;
    return (
      <Animated.View
        onLayout={e => {
          this.rowHeight = e.nativeEvent.layout.height;
        }}
        style={{
          backgroundColor: 'green',
          marginVertical: 5,
          opacity: this.flatListOpacity
        }}>
        <View {...this._panResponder.panHandlers}>
          <RenderItem {...{ item, index }} />
        </View>
      </Animated.View>
    );
  }

  renderAnimatedItem({ item, index }) {
    const RenderItem = this.props.renderItem;
    const draggingIdx = this.state.draggingIdx;

    return (
      <Animated.View
        onLayout={e => {
          this.rowHeight = e.nativeEvent.layout.height;
        }}
        style={{
          backgroundColor: 'red',
          opacity: this.draggerOpacity
        }}>
        <RenderItem {...{ item, index }} />
      </Animated.View>
    );
  }

  render() {
    const {
      props: { data, keyExtractor },
      state: { dragging, draggingIdx },
      renderItem,
      renderAnimatedItem,
    } = this;

    return (
      <SafeAreaView style={styles.container}>

        <FlatList
          ref={this.flatList}
          scrollEnabled={!dragging}
          extraData={this.state}
          style={{ width: '100%' }}
          {...{ data, renderItem, keyExtractor }}
          onScroll={e => (this.scrollOffset = e.nativeEvent.contentOffset.y)}
          onLayout={({
            nativeEvent: {
              layout: { y, height },
            },
          }) => {
            this.flatlistTopOffset = y;
            this.flatListHeight = height;
          }}
          scrollEventThrottle={16}
        />
        {dragging && (
          <Animated.View
            style={{
              position: 'absolute',
              backgroundColor: 'cyan',
              zIndex: 2,
              width: '100%',
              top: this.point.getLayout().top,
            }}>
            {renderAnimatedItem({ item: data[draggingIdx], index: -1 })}
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});