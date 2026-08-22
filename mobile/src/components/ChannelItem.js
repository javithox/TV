import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

export default function ChannelItem({channel, selected, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      focusable
      style={({focused}) => [
        styles.item,
        selected && styles.selected,
        focused && styles.focused,
      ]}>
      <Text style={styles.text} numberOfLines={1}>{channel.title}</Text>
      <Text style={styles.group} numberOfLines={1}>{channel.group}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item:{padding:14, marginBottom:8, borderRadius:8, backgroundColor:'#202020'},
  selected:{backgroundColor:'#1565c0'},
  focused:{borderWidth:2, borderColor:'#fff'},
  text:{color:'#fff', fontSize:16, fontWeight:'600'},
  group:{color:'#bbb', marginTop:4, fontSize:12},
});
