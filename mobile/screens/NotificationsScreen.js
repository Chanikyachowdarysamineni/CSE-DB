import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Paragraph, Button, Switch, Text, Chip } from 'react-native-paper';

const mockNotifications = [
  { id: 1, message: 'Assignment deadline tomorrow!', channel: 'In-app', priority: 'High', muted: false },
  { id: 2, message: 'Event RSVP reminder', channel: 'Email', priority: 'Medium', muted: true },
];

export default function NotificationsScreen() {
  const [dnd, setDnd] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Notifications Center</Title>
      <View style={styles.dndRow}>
        <Text>Do Not Disturb</Text>
        <Switch value={dnd} onValueChange={setDnd} style={styles.switch} />
      </View>
      {mockNotifications.map(n => (
        <Card key={n.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Paragraph>{n.message}</Paragraph>
            <View style={styles.chipRow}>
              <Chip style={styles.chip}>{n.channel}</Chip>
              <Chip style={styles.chip}>{n.priority}</Chip>
            </View>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>{n.muted ? 'Muted' : 'Mute'}</Button>
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
  dndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    marginLeft: 8,
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
