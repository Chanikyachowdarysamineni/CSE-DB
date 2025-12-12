import React from 'react';
import { View, StyleSheet, Animated, ToastAndroid, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { useSocket } from '../contexts/SocketContext';

const mockAssignments = [
  { id: 1, title: 'DBMS Assignment', deadline: '2025-12-07', submitted: false, grade: null },
  { id: 2, title: 'AI Project', deadline: '2025-12-12', submitted: true, grade: 'A' },
];

export default function AcademicsScreen() {
  const { on, off, connected } = useSocket();
  const [assignments, setAssignments] = React.useState(mockAssignments);
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

    const handleNewAssignment = (assignment) => {
      setAssignments(prev => [assignment, ...prev]);
      const message = `📚 New assignment: ${assignment.title}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('New Assignment', assignment.title);
      }
    };

    const handleNewSubmission = () => {
      const message = '✅ New submission received';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      }
    };

    on('assignment:new', handleNewAssignment);
    on('submission:new', handleNewSubmission);

    return () => {
      off('assignment:new', handleNewAssignment);
      off('submission:new', handleNewSubmission);
    };
  }, [connected, on, off]);

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Academics</Title>
      {assignments.map(a => (
        <Card key={a.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{a.title}</Title>
            <View style={styles.chipRow}>
              <Chip style={styles.chip}>Deadline: {a.deadline}</Chip>
              {a.submitted ? <Chip style={styles.chip}>Submitted</Chip> : <Chip style={styles.chip}>Pending</Chip>}
              {a.grade && <Chip style={styles.chip}>Grade: {a.grade}</Chip>}
            </View>
            <View style={styles.buttonRow}>
              {!a.submitted && <Button mode="contained" style={styles.button}>Submit</Button>}
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
