import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';

const mockResources = [
  { id: 1, name: 'Lecture Notes.pdf', type: 'PDF', version: 'v2.1', folder: 'DBMS', preview: true, downloads: 120 },
  { id: 2, name: 'Assignment1.docx', type: 'DOCX', version: 'v1.0', folder: 'AI', preview: false, downloads: 85 },
];

export default function ResourcesScreen() {
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
      <Title style={styles.title}>Resources</Title>
      {mockResources.map(r => (
        <Card key={r.id} style={styles.card} elevation={3}>
          <Card.Content>
            <Title>{r.name}</Title>
            <View style={styles.chipRow}>
              <Chip style={styles.chip}>{r.type}</Chip>
              <Chip style={styles.chip}>Version: {r.version}</Chip>
              <Chip style={styles.chip}>Folder: {r.folder}</Chip>
              <Chip style={styles.chip}>Downloads: {r.downloads}</Chip>
            </View>
            <View style={styles.buttonRow}>
              <Button mode="contained" style={styles.button}>Preview</Button>
              <Button mode="outlined" style={styles.button}>Download</Button>
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
