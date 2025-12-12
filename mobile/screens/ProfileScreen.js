import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Switch, Text } from 'react-native-paper';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = React.useState(false);
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
      <Title style={styles.title}>User Profile & Settings</Title>
      <Card style={styles.card} elevation={3}>
        <Card.Content>
          <View style={styles.profileRow}>
            <Avatar.Text size={64} label="U" style={styles.avatar} />
            <View>
              <Title>User Name</Title>
              <Paragraph>user@email.com</Paragraph>
            </View>
          </View>
          <View style={styles.switchRow}>
            <Text>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} style={styles.switch} />
          </View>
          <View style={styles.buttonRow}>
            <Button mode="contained" style={styles.button}>Edit Profile</Button>
            <Button mode="outlined" style={styles.button}>Privacy Settings</Button>
          </View>
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
    borderRadius: 12,
    maxWidth: 400,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    marginRight: 8,
  },
});
