import React from 'react';
import { View, StyleSheet, Animated, ToastAndroid, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { useSocket } from '../contexts/SocketContext';

const mockEvents = [
  { id: 1, title: 'AI Seminar', date: '2025-12-03', rsvp: false, recurring: false, reminder: true },
  { id: 2, title: 'Hackathon', date: '2025-12-15', rsvp: true, recurring: true, reminder: false },
];

export default function EventsScreen() {
  const { on, off, connected } = useSocket();
  const [events, setEvents] = React.useState(mockEvents);
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

    const handleNewEvent = (event) => {
      setEvents(prev => [event, ...prev]);
      const message = `📅 New event: ${event.title}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('New Event', event.title);
      }
    };

    on('event:new', handleNewEvent);

    return () => {
      off('event:new', handleNewEvent);
    };
  }, [connected, on, off]);

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Events</Title>
      {events.map(e => (
        <Card key={e.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{e.title}</Title>
            <View style={styles.chipRow}>
              <Chip style={styles.chip}>{e.date}</Chip>
              {e.recurring && <Chip style={styles.chip}>Recurring</Chip>}
              {e.reminder && <Chip style={styles.chip}>Reminder Set</Chip>}
            </View>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>{e.rsvp ? 'RSVPed' : 'RSVP'}</Button>
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
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    marginRight: 8,
  },
});
