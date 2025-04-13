import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';

const rewards = [
  { title: 'Free drink at any on campus restaurant', image: require('@/assets/images/rewards/drink.webp'), cost: 100 },
  { title: 'Free Lanyard', image: require('@/assets/images/rewards/landyrd.webp'), cost: 200 },
  { title: 'Free Keychain', image: require('@/assets/images/rewards/keychain.webp'), cost: 300 },
  { title: 'Free USF flag', image: require('@/assets/images/rewards/flag.webp'), cost: 400 },
  { title: 'Free meal', image: require('@/assets/images/rewards/freemeal.webp'), cost: 500 },
  { title: 'Free t-shirt', image: require('@/assets/images/rewards/apparel.webp'), cost: 600 },
  { title: 'Football VIP student section', image: require('@/assets/images/rewards/football.png'), cost: 700 },
  { title: 'Free backpack', image: require('@/assets/images/rewards/bp.webp'), cost: 800 },
  { title: 'Free hoodie', image: require('@/assets/images/rewards/hoodie.webp'), cost: 900 },
  { title: '40% discount on semester parking', image: require('@/assets/images/rewards/car1.webp'), cost: 1000 },
];

export default function RoadmapScreen() {
  const [userPoints, setUserPoints] = useState(2000);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [code, setCode] = useState('');

  const rockyIndex = Math.max(0, rewards.findIndex(reward => reward.cost > userPoints) - 1);

  const handleRedeem = () => {
    if (selectedReward && userPoints >= selectedReward.cost) {
      const newPoints = userPoints - selectedReward.cost;
      const generatedCode = `#SB${Math.floor(1000 + Math.random() * 9000)}`;
      setUserPoints(newPoints);
      setCode(generatedCode);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: '#006747' }}
    >
      <Text style={styles.header}>Your Rewards Roadmap</Text>
      <Text style={styles.pointsDisplay}>Current Points: {userPoints}</Text>

      {rewards.map((reward, index) => {
        const isUnlocked = userPoints >= reward.cost;
        const showRocky = index === rockyIndex;

        return (
          <View key={index} style={styles.levelContainer}>
            {showRocky && (
              <Image
                source={require('@/assets/images/Mascot.png')}
                style={styles.rocky}
              />
            )}

            <TouchableOpacity
              disabled={!isUnlocked}
              onPress={() => {
                setSelectedReward(reward);
                setModalVisible(true);
                setCode('');
              }}
              style={styles.levelBubble}
            >
              <Image
                source={reward.image}
                style={[styles.rewardImage, !isUnlocked && styles.grayscale]}
              />
            </TouchableOpacity>

            <Text style={[styles.rewardText, { opacity: isUnlocked ? 1 : 0.4 }]}>Level {index + 1}: {reward.title}</Text>
            <Text style={[styles.pointsText, { opacity: isUnlocked ? 1 : 0.4 }]}>Requires {reward.cost} Points</Text>
          </View>
        );
      })}

      {/* Modal for redeeming prize */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedReward?.title}</Text>
            {code ? (
              <Text style={styles.codeText}>Your Code: {code}</Text>
            ) : (
              <Pressable style={styles.redeemButton} onPress={handleRedeem}>
                <Text style={styles.redeemText}>Redeem Prize</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ marginTop: 20, color: '#006747', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  pointsDisplay: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
  },
  levelContainer: {
    marginVertical: 50,
    alignItems: 'center',
    position: 'relative',
  },
  rocky: {
    width: 80,
    height: 80,
    position: 'absolute',
    top: -80,
    zIndex: 2,
    resizeMode: 'contain',
  },
  levelBubble: {
    backgroundColor: 'white',
    borderRadius: 100,
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  rewardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    color: 'white',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#f0f0f0',
    marginTop: 4,
  },
  grayscale: {
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#006747',
    textAlign: 'center',
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006747',
    marginBottom: 10,
  },
  redeemButton: {
    backgroundColor: '#006747',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  redeemText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});