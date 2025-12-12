import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

const role = 'Faculty'; // TODO: Replace with actual user role from auth context

export default function DashboardScreen() {
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
      <Title style={styles.title}>Welcome to CSE Dashboard</Title>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <Title>Pinned Announcements</Title>
          <Paragraph>Critical notices and updates appear here.</Paragraph>
          <Button mode="contained" style={styles.button}>View All</Button>
        </Card.Content>
      </Card>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <Title>Upcoming Deadlines</Title>
          <Paragraph>Assignments, events, and project milestones.</Paragraph>
          <Button mode="outlined" style={styles.button}>See Calendar</Button>
        </Card.Content>
      </Card>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <Button mode="contained" style={styles.button}>Create Announcement</Button>
          <Button mode="contained" style={styles.button}>Post Assignment</Button>
        </Card.Content>
      </Card>
      <Card style={styles.feedCard} elevation={2}>
        <Card.Content>
          <Paragraph>Welcome, {role}! Here are your latest updates and activities.</Paragraph>
        </Card.Content>
      </Card>
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
  button: {
    marginTop: 8,
    marginRight: 8,
  },
  feedCard: {
    marginTop: 24,
    borderRadius: 8,
  },
});
