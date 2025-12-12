import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Paragraph, Button, ProgressBar } from 'react-native-paper';

const mockAnalytics = [
  { id: 1, title: 'Post Engagement', value: 0.85, description: 'Engagement rate for announcements.' },
  { id: 2, title: 'Assignment Submissions', value: 0.92, description: 'Percentage of students submitted assignments.' },
];

export default function AnalyticsScreen() {
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
      <Title style={styles.title}>Analytics & Reporting</Title>
      {mockAnalytics.map(a => (
        <Card key={a.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{a.title}</Title>
            <Paragraph>{a.description}</Paragraph>
            <ProgressBar progress={a.value} color="#1976d2" style={styles.progress} />
            <Paragraph>{Math.round(a.value * 100)}%</Paragraph>
            <Button mode="contained" style={styles.button}>Export Report</Button>
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
  button: {
    marginTop: 8,
  },
});
