import React from 'react';
import { View, StyleSheet, Animated, ToastAndroid, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Chip, Badge } from 'react-native-paper';
import { useSocket } from '../contexts/SocketContext';

const mockAnnouncements = [
  { id: 1, title: 'Exam Schedule', priority: 'High', expiry: '2025-12-10', department: 'CSE', course: 'DBMS', content: 'Final exam on Dec 10.', archived: false },
  { id: 2, title: 'Project Submission', priority: 'Medium', expiry: '2025-12-05', department: 'CSE', course: 'AI', content: 'Submit by Dec 5.', archived: false },
];

export default function AnnouncementsScreen() {
  const { on, off, connected } = useSocket();
  const [search, setSearch] = React.useState('');
  const [announcements, setAnnouncements] = React.useState(mockAnnouncements);
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

    const handleNewAnnouncement = (announcement) => {
      setAnnouncements(prev => [announcement, ...prev]);
      const message = `📢 New: ${announcement.title}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('New Announcement', announcement.title);
      }
    };

    const handleUpdatedAnnouncement = (announcement) => {
      setAnnouncements(prev => prev.map(a => a.id === announcement.id ? announcement : a));
      const message = `📝 Updated: ${announcement.title}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      }
    };

    on('announcement:new', handleNewAnnouncement);
    on('announcement:updated', handleUpdatedAnnouncement);

    return () => {
      off('announcement:new', handleNewAnnouncement);
      off('announcement:updated', handleUpdatedAnnouncement);
    };
  }, [connected, on, off]);

  const filtered = announcements.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Announcements</Title>
      <TextInput label="Search" value={search} onChangeText={setSearch} mode="outlined" style={styles.search} />
      {filtered.map(a => (
        <Card key={a.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{a.title}</Title>
            <View style={styles.chipRow}>
              <Chip style={styles.chip} textStyle={{ color: 'white' }} selectedColor="white">{a.priority}</Chip>
              <Chip style={styles.chip} textStyle={{ color: 'white' }} selectedColor="white">Expires: {a.expiry}</Chip>
            </View>
            <Paragraph>{a.content}</Paragraph>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>View Details</Button>
              <Button mode="outlined" style={styles.button}>Archive</Button>
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
  search: {
    marginBottom: 16,
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
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    marginRight: 8,
  },
});
