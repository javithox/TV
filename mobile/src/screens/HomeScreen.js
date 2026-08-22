import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';
import Video from 'react-native-video';
import ChannelItem from '../components/ChannelItem';
import {getChannels} from '../services/api';

export default function HomeScreen() {
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getChannels()
      .then(items => { setChannels(items); setSelected(items[0] ?? null); })
      .catch(err => setError(err.message || 'No se pudieron cargar los canales.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => channels.filter(c => c.title.toLowerCase().includes(query.toLowerCase())),
    [channels, query]
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.title}>TV IPTV</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar canal..."
          placeholderTextColor="#888"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {filtered.map(channel => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            selected={selected?.id === channel.id}
            onPress={() => setSelected(channel)}
          />
        ))}
      </View>

      <View style={styles.playerArea}>
        <Text style={styles.nowPlaying}>{selected?.title || 'Selecciona un canal'}</Text>
        {selected ? (
          <Video
            source={{uri: selected.playbackUrl}}
            style={styles.video}
            controls
            resizeMode="contain"
            paused={false}
            onError={(e) => console.warn('Playback error', e)}
          />
        ) : (
          <Text style={styles.empty}>No hay canales disponibles.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, flexDirection:'row', backgroundColor:'#101010'},
  sidebar:{width:320, padding:16},
  playerArea:{flex:1, padding:16},
  title:{color:'#fff', fontSize:26, fontWeight:'700', marginBottom:12},
  input:{backgroundColor:'#202020', color:'#fff', borderRadius:8, padding:12, marginBottom:12},
  nowPlaying:{color:'#fff', fontSize:20, fontWeight:'600', marginBottom:10},
  video:{width:'100%', flex:1, backgroundColor:'#000'},
  empty:{color:'#aaa', textAlign:'center', marginTop:40},
  error:{color:'#ff8a80', marginBottom:10},
  center:{flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#101010'},
});
