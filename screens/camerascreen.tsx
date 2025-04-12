import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';
import { Camera, CameraCapturedPicture, CameraType } from 'expo-camera';


export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  type CameraFacing = typeof Camera.Constants.Type.back | typeof Camera.Constants.Type.front;


  const cameraRef = useRef<CameraType | null>(null);


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        console.log(photo.uri);
      }
      
  };

  if (hasPermission === null) {
    return <View><Text>Requesting permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={(ref) => (cameraRef.current = ref)}
        style={styles.camera}
        type={type}
      >
        <View style={styles.buttonContainer}>
          <Button
            title="Flip Camera"
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          />
          <Button title="Take Picture" onPress={takePicture} />
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
});
