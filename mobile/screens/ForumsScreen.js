import React from 'react';
import { View, StyleSheet, Animated, ToastAndroid, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSocket } from '../contexts/SocketContext';

const mockThreads = [
  { id: 1, topic: 'How to optimize SQL queries?', category: 'DBMS', upvotes: 12, accepted: true, anonymous: false },
  { id: 2, topic: 'Best resources for AI beginners?', category: 'AI', upvotes: 7, accepted: false, anonymous: true },
];

export default function ForumsScreen() {
  const { on, off, connected } = useSocket();
  const [threads, setThreads] = React.useState(mockThreads);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Real-time listeners
  React.useEffect(() => {
    if (!connected) return;

    const handleNewThread = (thread) => {
      setThreads(prev => [thread, ...prev]);
      const message = `💬 New thread: ${thread.topic}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('New Forum Thread', thread.topic);
      }
    };

    on('forum:new', handleNewThread);

    return () => {
      off('forum:new', handleNewThread);
    };
  }, [connected, on, off]);

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Discussion Forums</Title>
      {threads.map(t => (
        <Card key={t.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{t.topic}</Title>
            <View style={styles.chipRow}>
              <Chip style={styles.chip}>{t.category}</Chip>
              {t.accepted && <Chip style={styles.chip}>Accepted Solution</Chip>}
              {t.anonymous && <Chip style={styles.chip}>Anonymous</Chip>}
            </View>
            <View style={styles.upvoteRow}>
              <IconButton icon={() => <MaterialCommunityIcons name="thumb-up" size={24} color="#1976d2" />} />
              <Paragraph>{t.upvotes} Upvotes</Paragraph>
            </View>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>View Thread</Button>
              <Button mode="outlined" style={styles.button}>Moderate</Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#1976d2',
    color: 'white',
  },
  upvoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    marginRight: 8,
  },
});
