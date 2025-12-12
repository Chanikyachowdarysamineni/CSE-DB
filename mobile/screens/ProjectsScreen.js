import React from 'react';
import { View, StyleSheet, Animated, ToastAndroid, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar } from 'react-native-paper';
import { useSocket } from '../contexts/SocketContext';

const mockProjects = [
  { id: 1, title: 'Smart Attendance System', progress: 0.8, milestone: 'Final Demo', team: ['Alice', 'Bob'], evaluated: false },
  { id: 2, title: 'AI Chatbot', progress: 0.5, milestone: 'Prototype', team: ['Carol', 'Dave'], evaluated: true },
];

export default function ProjectsScreen() {
  const { on, off, connected } = useSocket();
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

    const handleNewProject = (project) => {
      const message = `💼 New project: ${project.title}`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Alert.alert('New Project', project.title);
      }
    };

    on('project:new', handleNewProject);

    return () => {
      off('project:new', handleNewProject);
    };
  }, [connected, on, off]);

  return (
    <Animated.View style={{ flex: 1, padding: 16, opacity: fadeAnim }}>
      <Title style={styles.title}>Projects</Title>
      {mockProjects.map(p => (
        <Card key={p.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{p.title}</Title>
            <Paragraph>Milestone: {p.milestone}</Paragraph>
            <ProgressBar progress={p.progress} color="#1976d2" style={styles.progress} />
            <Paragraph>Team: {p.team.join(', ')}</Paragraph>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>View Details</Button>
              {!p.evaluated && <Button mode="outlined" style={styles.button}>Submit for Evaluation</Button>}
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
  progress: {
    marginVertical: 8,
    height: 8,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    marginRight: 8,
  },
});
